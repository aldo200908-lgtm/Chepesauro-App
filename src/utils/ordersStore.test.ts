import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_DEMO_ORDERS,
  createDemoOrder,
  getNextOrderId,
  isValidOrder,
} from './ordersStore.ts';

test('getNextOrderId continúa después del id más alto, no según la cantidad', () => {
  const orders = [{ ...INITIAL_DEMO_ORDERS[0], id: 'VG-1010' }];
  assert.equal(getNextOrderId(orders), 'VG-1011');
});

test('getNextOrderId arranca en VG-1001 con lista vacía', () => {
  assert.equal(getNextOrderId([]), 'VG-1001');
});

test('createDemoOrder no repite ids al crear varios pedidos seguidos', () => {
  const base = {
    type: 'encargo_personalizado' as const,
    customDescription: 'Sobre con documentos',
    pickupAddress: 'Av. A 1',
    dropoffAddress: 'Calle B 2',
    instructions: 'Llamar al llegar',
    paymentMethod: 'Efectivo (Demo)' as const,
  };
  const first = createDemoOrder(INITIAL_DEMO_ORDERS, base);
  const second = createDemoOrder(first.orders, base);
  assert.ok(first.createdOrder && second.createdOrder);
  assert.notEqual(first.createdOrder.id, second.createdOrder.id);
  const ids = second.orders.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('isValidOrder acepta los pedidos demo iniciales', () => {
  for (const order of INITIAL_DEMO_ORDERS) {
    assert.equal(isValidOrder(order), true);
  }
});

test('isValidOrder rechaza datos corruptos o incompletos', () => {
  assert.equal(isValidOrder(null), false);
  assert.equal(isValidOrder({}), false);
  assert.equal(isValidOrder({ ...INITIAL_DEMO_ORDERS[0], status: 'inventado' }), false);
  assert.equal(isValidOrder({ ...INITIAL_DEMO_ORDERS[0], pickup: null }), false);
  assert.equal(isValidOrder({ ...INITIAL_DEMO_ORDERS[0], totalAmount: 'x' }), false);
});
