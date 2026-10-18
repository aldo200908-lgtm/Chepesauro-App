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
  verifyMotorizadoAccess,
  resetOnboardingSelection,
  switchTab,
  advanceOrderStatus,
  createQuickOrder,
} from './onboarding.ts';

test('initial state starts at onboarding step 1 (WelcomeScreen) in onboarding viewMode', () => {
  const state = createInitialOnboardingState();
  assert.equal(state.onboardingStep, 1);
  assert.equal(state.viewMode, 'onboarding');
  assert.equal(state.onboardingCompleted, false);
  assert.equal(state.selectedRole, null);
});

test('navigating forward and backward through the 3 onboarding screens works without reload', () => {
  const step1 = createInitialOnboardingState();
  const step2 = goToNextOnboardingStep(step1);
  assert.equal(step2.onboardingStep, 2);

  const step3 = goToNextOnboardingStep(step2);
  assert.equal(step3.onboardingStep, 3);

  const backTo2 = goToPrevOnboardingStep(step3);
  assert.equal(backTo2.onboardingStep, 2);

  const backTo1 = goToPrevOnboardingStep(backTo2);
  assert.equal(backTo1.onboardingStep, 1);

  const skippedTo3 = skipToProfileSelection(step2);
  assert.equal(skippedTo3.onboardingStep, 3);
});

test('confirmRoleSelection does not advance if no profile is selected', () => {
  const step3 = skipToProfileSelection(createInitialOnboardingState());
  const afterConfirm = confirmRoleSelection(step3);
  assert.equal(afterConfirm.viewMode, 'onboarding');
  assert.equal(afterConfirm.onboardingCompleted, false);
});

test('selecting cliente (usuario) and confirming completes onboarding and opens main_app', () => {
  const step3 = skipToProfileSelection(createInitialOnboardingState());
  const selected = selectRole(step3, 'usuario');
  const confirmed = confirmRoleSelection(selected);
  assert.equal(confirmed.selectedRole, 'usuario');
  assert.equal(confirmed.onboardingCompleted, true);
  assert.equal(confirmed.viewMode, 'main_app');
});

test('selecting motorizado never grants automatic dashboard permissions; requires verification code', () => {
  const step3 = skipToProfileSelection(createInitialOnboardingState());
  const selected = selectRole(step3, 'motorizado');
  const confirmed = confirmRoleSelection(selected);

  assert.equal(confirmed.viewMode, 'motorizado_auth');
  assert.equal(confirmed.onboardingCompleted, false);
  assert.equal(confirmed.motorizadoVerified, false);

  // Invalid short code does not grant access
  const failedVerify = verifyMotorizadoAccess(confirmed, '12');
  assert.equal(failedVerify.viewMode, 'motorizado_auth');

  // Valid code grants access to main_app
  const verified = verifyMotorizadoAccess(confirmed, 'MOTO-2026');
  assert.equal(verified.viewMode, 'main_app');
  assert.equal(verified.onboardingCompleted, true);
  assert.equal(verified.motorizadoVerified, true);
});

test('resetOnboardingSelection logs out and returns to step 1 onboarding without showing protected dashboard', () => {
  const step3 = selectRole(skipToProfileSelection(createInitialOnboardingState()), 'usuario');
  const inApp = confirmRoleSelection(step3);
  const afterLogout = resetOnboardingSelection(inApp);
  assert.equal(afterLogout.viewMode, 'onboarding');
  assert.equal(afterLogout.onboardingStep, 1);
  assert.equal(afterLogout.onboardingCompleted, false);
  assert.equal(afterLogout.selectedRole, null);
});

test('service options and role options match exact required copy', () => {
  assert.equal(SERVICE_OPTIONS.length, 2);
  assert.equal(SERVICE_OPTIONS[0].title, 'Comprar en negocios');
  assert.equal(SERVICE_OPTIONS[1].title, 'Enviar por encargo');
  assert.equal(ROLE_OPTIONS.usuario.title, 'Soy cliente');
  assert.equal(ROLE_OPTIONS.motorizado.title, 'Soy motorizado');
});

test('switchTab and order operations work in main_app', () => {
  const initial = createInitialOnboardingState('?autostart=1');
  const onPedidos = switchTab(initial, 'pedidos');
  assert.equal(onPedidos.activeTab, 'pedidos');

  const updated = advanceOrderStatus(onPedidos, onPedidos.orders[1].id);
  assert.equal(updated.orders[1].status, 'en_camino');

  const withNew = createQuickOrder(updated, 'Av. Central 100', 'Calle Sur 250');
  assert.equal(withNew.orders.length, updated.orders.length + 1);
});
