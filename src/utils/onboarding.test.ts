import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_OPTIONS,
  SERVICE_OPTIONS,
  createInitialOnboardingState,
  goToNextOnboardingStep,
  goToPrevOnboardingStep,
  skipToProfileSelection,
  selectRole,
  confirmRoleSelection,
  activateDemoMotorizadoSession,
  resetOnboardingSelection,
  switchTab,
} from './onboarding.ts';
import {
  INITIAL_DEMO_ORDERS,
  DEMO_DRIVERS,
  createDemoOrder,
  assignOrderToDriver,
  advanceDriverOrderStatus,
  cancelClientOrder,
  formatPenCurrency,
} from './ordersStore.ts';

test('onboarding starts at step 1 and navigates through all 3 steps without reload', () => {
  const step1 = createInitialOnboardingState('', INITIAL_DEMO_ORDERS);
  assert.equal(step1.onboardingStep, 1);
  assert.equal(step1.viewMode, 'onboarding');

  const step2 = goToNextOnboardingStep(step1);
  assert.equal(step2.onboardingStep, 2);

  const step3 = goToNextOnboardingStep(step2);
  assert.equal(step3.onboardingStep, 3);

  const backTo2 = goToPrevOnboardingStep(step3);
  assert.equal(backTo2.onboardingStep, 2);

  const skipped = skipToProfileSelection(step2);
  assert.equal(skipped.onboardingStep, 3);
});

test('selecting cliente enters main_app, while motorizado opens demo access confirmation first', () => {
  const step3 = skipToProfileSelection(
    createInitialOnboardingState('', INITIAL_DEMO_ORDERS)
  );
  const clientConfirmed = confirmRoleSelection(selectRole(step3, 'usuario'));
  assert.equal(clientConfirmed.viewMode, 'main_app');
  assert.equal(clientConfirmed.onboardingCompleted, true);

  const motoSelected = confirmRoleSelection(selectRole(step3, 'motorizado'));
  assert.equal(motoSelected.viewMode, 'motorizado_auth');
  assert.equal(motoSelected.onboardingCompleted, false);

  const motoActivated = activateDemoMotorizadoSession(motoSelected, DEMO_DRIVERS[0]);
  assert.equal(motoActivated.viewMode, 'main_app');
  assert.equal(motoActivated.motorizadoVerified, true);
  assert.equal(motoActivated.activeDriver.id, 'DRV-01');
});

test('creating custom order and store purchase formats S/ currency and adds to disponible list', () => {
  assert.equal(formatPenCurrency(7.5), 'S/ 7.50');

  // Missing required fields fails validation
  const invalid = createDemoOrder(INITIAL_DEMO_ORDERS, {
    type: 'encargo_personalizado',
    customDescription: '',
    pickupAddress: 'Av. Arequipa 400',
    dropoffAddress: 'Calle Schell 120',
    instructions: 'Timbre 2',
    paymentMethod: 'Efectivo (Demo)',
  });
  assert.equal(invalid.createdOrder, null);
  assert.ok(invalid.error);

  // Valid encargo personalizado
  const validEncargo = createDemoOrder(INITIAL_DEMO_ORDERS, {
    type: 'encargo_personalizado',
    customDescription: 'Mochila azul con cuadernos',
    pickupAddress: 'Av. Arequipa 400, Lince',
    pickupReference: 'Puerta principal',
    dropoffAddress: 'Calle Schell 120, Miraflores',
    dropoffReference: 'Recepción edificio',
    instructions: 'Entregar en recepción a nombre de Jorge.',
    paymentMethod: 'Yape / Plin (Demo)',
    demoDeliveryFee: 8.0,
  });

  assert.ok(validEncargo.createdOrder);
  assert.equal(validEncargo.createdOrder.status, 'disponible');
  assert.equal(validEncargo.createdOrder.totalAmount, 8.0);
  assert.equal(validEncargo.orders.length, INITIAL_DEMO_ORDERS.length + 1);
});

test('exclusive assignment assigns disponible order once and blocks second assignment', () => {
  const baseOrders = structuredClone(INITIAL_DEMO_ORDERS);
  // VG-1001 starts as 'disponible'
  const firstAssign = assignOrderToDriver(
    baseOrders,
    'VG-1001',
    DEMO_DRIVERS[0]
  );
  assert.equal(firstAssign.success, true);

  const assignedOrder = firstAssign.orders.find((o) => o.id === 'VG-1001')!;
  assert.equal(assignedOrder.status, 'asignado');
  assert.equal(assignedOrder.assignedDriver?.id, 'DRV-01');

  // Second driver attempting to accept the same order is blocked
  const secondAssign = assignOrderToDriver(
    firstAssign.orders,
    'VG-1001',
    DEMO_DRIVERS[1]
  );
  assert.equal(secondAssign.success, false);
  assert.ok(secondAssign.error);
});

test('driver transitions follow valid sequence and block unauthorized drivers or invalid terminal transitions', () => {
  let orders = structuredClone(INITIAL_DEMO_ORDERS);
  // VG-1002 is assigned to DRV-01 ('asignado')
  // DRV-02 (not assigned) cannot advance VG-1002
  const unauthorized = advanceDriverOrderStatus(orders, 'VG-1002', 'DRV-02');
  assert.equal(unauthorized.success, false);

  // DRV-01 advances through all valid states:
  // 1. asignado -> en_camino_recogida
  let res = advanceDriverOrderStatus(orders, 'VG-1002', 'DRV-01');
  assert.equal(res.success, true);
  orders = res.orders;
  assert.equal(orders.find((o) => o.id === 'VG-1002')!.status, 'en_camino_recogida');

  // 2. en_camino_recogida -> llegada_recogida
  res = advanceDriverOrderStatus(orders, 'VG-1002', 'DRV-01');
  assert.equal(res.success, true);
  orders = res.orders;
  assert.equal(orders.find((o) => o.id === 'VG-1002')!.status, 'llegada_recogida');

  // Once at llegada_recogida, client can no longer cancel
  const lateCancel = cancelClientOrder(orders, 'VG-1002');
  assert.equal(lateCancel.success, false);

  // 3. llegada_recogida -> recogido
  res = advanceDriverOrderStatus(orders, 'VG-1002', 'DRV-01');
  assert.equal(res.success, true);
  orders = res.orders;
  assert.equal(orders.find((o) => o.id === 'VG-1002')!.status, 'recogido');

  // 4. recogido -> en_camino_cliente
  res = advanceDriverOrderStatus(orders, 'VG-1002', 'DRV-01');
  assert.equal(res.success, true);
  orders = res.orders;
  assert.equal(orders.find((o) => o.id === 'VG-1002')!.status, 'en_camino_cliente');

  // 5. en_camino_cliente -> entregado
  res = advanceDriverOrderStatus(orders, 'VG-1002', 'DRV-01');
  assert.equal(res.success, true);
  orders = res.orders;
  const delivered = orders.find((o) => o.id === 'VG-1002')!;
  assert.equal(delivered.status, 'entregado');
  assert.equal(delivered.statusHistory.length, 7);

  // 6. entregado is terminal: cannot advance further
  const afterDelivered = advanceDriverOrderStatus(orders, 'VG-1002', 'DRV-01');
  assert.equal(afterDelivered.success, false);
});

test('client can cancel order when disponible, and cancelled order cannot be assigned or reopened', () => {
  const baseOrders = structuredClone(INITIAL_DEMO_ORDERS);
  const cancelledRes = cancelClientOrder(
    baseOrders,
    'VG-1001',
    'El cliente cambió la dirección.'
  );
  assert.equal(cancelledRes.success, true);
  const cancelledOrder = cancelledRes.orders.find((o) => o.id === 'VG-1001')!;
  assert.equal(cancelledOrder.status, 'cancelado');

  // Cancelled order cannot be assigned to a driver
  const assignCancelled = assignOrderToDriver(
    cancelledRes.orders,
    'VG-1001',
    DEMO_DRIVERS[0]
  );
  assert.equal(assignCancelled.success, false);
});

test('service options, role options, and logout work as expected', () => {
  assert.equal(SERVICE_OPTIONS.length, 2);
  assert.equal(ROLE_OPTIONS.usuario.title, 'Soy cliente');
  assert.equal(ROLE_OPTIONS.motorizado.title, 'Soy motorizado');

  const initial = createInitialOnboardingState('?autostart=1', INITIAL_DEMO_ORDERS);
  const onMapa = switchTab(initial, 'mapa');
  assert.equal(onMapa.activeTab, 'mapa');

  const loggedOut = resetOnboardingSelection(onMapa);
  assert.equal(loggedOut.viewMode, 'onboarding');
  assert.equal(loggedOut.onboardingStep, 1);
});
