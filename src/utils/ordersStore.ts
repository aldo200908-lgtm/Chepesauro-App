/**
 * Módulo centralizado de lógica de negocio para pedidos de demostración.
 *
 * NOTA ARQUITECTÓNICA (FASE 1 — PROTOTIPO LOCAL):
 * - Los importes en soles peruanos (S/) son valores ficticios de demostración.
 * - La comprobación de asignación exclusiva (`assignOrderToDriver`) evita dobles
 *   asignaciones dentro de la sesión/navegador actual, pero NO garantiza exclusividad
 *   entre dispositivos independientes. En producción se requiere una transacción
 *   atómica en el servidor (por ejemplo, actualización condicional en base de datos).
 * - La persistencia usa `localStorage` y sincroniza pestañas del mismo navegador
 *   mediante el evento `storage` de `window`.
 */

export type OrderServiceType = 'compra_negocio' | 'encargo_personalizado';

export type OrderStatus =
  | 'disponible'
  | 'asignado'
  | 'en_camino_recogida'
  | 'llegada_recogida'
  | 'recogido'
  | 'en_camino_cliente'
  | 'entregado'
  | 'cancelado';

export type DemoPaymentMethod =
  | 'Efectivo (Demo)'
  | 'Yape / Plin (Demo)'
  | 'Tarjeta (Demo)';

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderLocationPoint {
  address: string;
  referencePoint: string;
  /**
   * Coordenadas geográficas verificadas [longitud, latitud].
   * Si es undefined, la dirección es un texto descriptivo sin geocodificar.
   */
  coordinates?: [number, number];
}

export interface AssignedDriverInfo {
  id: string;
  name: string;
  vehiclePlate: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  actor: 'cliente' | 'motorizado' | 'sistema';
  note: string;
}

export interface DemoOrder {
  id: string;
  type: OrderServiceType;
  businessName?: string;
  items?: OrderItem[];
  customDescription?: string;
  pickup: OrderLocationPoint;
  dropoff: OrderLocationPoint;
  instructions: string;
  productsCost: number;
  demoDeliveryFee: number;
  totalAmount: number;
  paymentMethod: DemoPaymentMethod;
  status: OrderStatus;
  assignedDriver: AssignedDriverInfo | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderStatusHistoryEntry[];
}

export interface CreateCustomOrderInput {
  type: OrderServiceType;
  businessName?: string;
  items?: OrderItem[];
  customDescription?: string;
  pickupAddress: string;
  pickupReference?: string;
  dropoffAddress: string;
  dropoffReference?: string;
  instructions: string;
  paymentMethod: DemoPaymentMethod;
  demoDeliveryFee?: number;
}

export const DEMO_DRIVERS: AssignedDriverInfo[] = [
  {
    id: 'DRV-01',
    name: 'Carlos Mendoza (Demo)',
    vehiclePlate: 'B7K-412',
  },
  {
    id: 'DRV-02',
    name: 'Luis Paredes (Demo)',
    vehiclePlate: 'C9M-805',
  },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  disponible: 'Disponible',
  asignado: 'Asignado a un motorizado',
  en_camino_recogida: 'En camino al punto de recogida',
  llegada_recogida: 'Llegada al punto de recogida',
  recogido: 'Pedido recogido',
  en_camino_cliente: 'En camino al cliente',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/**
 * Mapa estricto de transiciones válidas para el motorizado.
 * Un pedido entregado o cancelado es terminal y no tiene transiciones posteriores.
 */
export const VALID_DRIVER_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  disponible: null, // Se asigna mediante assignOrderToDriver
  asignado: 'en_camino_recogida',
  en_camino_recogida: 'llegada_recogida',
  llegada_recogida: 'recogido',
  recogido: 'en_camino_cliente',
  en_camino_cliente: 'entregado',
  entregado: null,
  cancelado: null,
};

export const DRIVER_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  asignado: 'Ir al punto de recogida',
  en_camino_recogida: 'Confirmar llegada a recogida',
  llegada_recogida: 'Confirmar recogida',
  recogido: 'Iniciar trayecto al cliente',
  en_camino_cliente: 'Marcar como entregado',
};

/**
 * Estados en los que el cliente aún puede cancelar el pedido
 * (antes de que el motorizado haya confirmado llegada/recogida).
 */
const CANCELLABLE_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'disponible',
  'asignado',
  'en_camino_recogida',
]);

export function formatPenCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

export function canClientCancelOrder(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.has(status);
}

export function getNextDriverStatus(currentStatus: OrderStatus): OrderStatus | null {
  return VALID_DRIVER_TRANSITIONS[currentStatus] ?? null;
}

export const INITIAL_DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'VG-1001',
    type: 'encargo_personalizado',
    customDescription: 'Recoger sobre sellado con documentos contables y llaves.',
    pickup: {
      address: 'Av. Principal 420, Centro',
      referencePoint: 'Recepción del edificio gris, piso 1',
    },
    dropoff: {
      address: 'Calle Los Pinos 185, Miraflores',
      referencePoint: 'Casa con portón blanco frente al parque',
    },
    instructions: 'Preguntar por la Sra. Elena al recoger. Llamar al llegar al destino.',
    productsCost: 0,
    demoDeliveryFee: 7.5,
    totalAmount: 7.5,
    paymentMethod: 'Yape / Plin (Demo)',
    status: 'disponible',
    assignedDriver: null,
    createdAt: '2026-10-17T16:30:00.000Z',
    updatedAt: '2026-10-17T16:30:00.000Z',
    statusHistory: [
      {
        status: 'disponible',
        timestamp: '2026-10-17T16:30:00.000Z',
        actor: 'cliente',
        note: 'Encargo personalizado creado y disponible para motorizados.',
      },
    ],
  },
  {
    id: 'VG-1002',
    type: 'compra_negocio',
    businessName: 'Panadería y Café San Martín (Demo)',
    items: [
      { name: 'Pan artesanal de masa madre', quantity: 1, unitPrice: 14.0 },
      { name: 'Empanada de queso horneada', quantity: 2, unitPrice: 6.5 },
    ],
    pickup: {
      address: 'Av. Las Palmas 890, San Isidro',
      referencePoint: 'Mostrador de entregas rápidas',
    },
    dropoff: {
      address: 'Jr. Alcanfores 240, Surco',
      referencePoint: 'Departamento 302, timbre 302',
    },
    instructions: 'Pedir boleta simple en el local y revisar que el café/pan esté bien cerrado.',
    productsCost: 27.0,
    demoDeliveryFee: 6.0,
    totalAmount: 33.0,
    paymentMethod: 'Efectivo (Demo)',
    status: 'asignado',
    assignedDriver: DEMO_DRIVERS[0],
    createdAt: '2026-10-17T16:15:00.000Z',
    updatedAt: '2026-10-17T16:22:00.000Z',
    statusHistory: [
      {
        status: 'disponible',
        timestamp: '2026-10-17T16:15:00.000Z',
        actor: 'cliente',
        note: 'Pedido de compra en negocio registrado.',
      },
      {
        status: 'asignado',
        timestamp: '2026-10-17T16:22:00.000Z',
        actor: 'motorizado',
        note: `Asignado a ${DEMO_DRIVERS[0].name}.`,
      },
    ],
  },
];

/**
 * Crea un nuevo pedido validando los campos obligatorios según el tipo de servicio.
 */
export function createDemoOrder(
  orders: DemoOrder[],
  input: CreateCustomOrderInput,
  nowIso: string = new Date().toISOString()
): { orders: DemoOrder[]; createdOrder: DemoOrder | null; error?: string } {
  const pickupAddress = input.pickupAddress.trim();
  const dropoffAddress = input.dropoffAddress.trim();
  const instructions = input.instructions.trim();

  if (!pickupAddress || !dropoffAddress) {
    return {
      orders,
      createdOrder: null,
      error: 'Debes indicar la dirección de recogida y la dirección de destino.',
    };
  }

  if (!instructions) {
    return {
      orders,
      createdOrder: null,
      error: 'Debes incluir las instrucciones o referencias para el pedido.',
    };
  }

  if (input.type === 'compra_negocio') {
    const businessName = (input.businessName || '').trim();
    if (!businessName) {
      return {
        orders,
        createdOrder: null,
        error: 'En compras en negocios debes indicar el nombre del negocio.',
      };
    }
  } else {
    const customDescription = (input.customDescription || '').trim();
    if (!customDescription) {
      return {
        orders,
        createdOrder: null,
        error: 'En encargos personalizados debes describir qué se va a enviar.',
      };
    }
  }

  const items =
    input.type === 'compra_negocio' && input.items && input.items.length > 0
      ? input.items
      : undefined;

  const productsCost = items
    ? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    : 0;

  const demoDeliveryFee =
    typeof input.demoDeliveryFee === 'number' && input.demoDeliveryFee > 0
      ? input.demoDeliveryFee
      : input.type === 'compra_negocio'
      ? 6.0
      : 7.5;

  const totalAmount = Number((productsCost + demoDeliveryFee).toFixed(2));
  const nextNumber = 1001 + orders.length;
  const id = `VG-${nextNumber}`;

  const createdOrder: DemoOrder = {
    id,
    type: input.type,
    businessName:
      input.type === 'compra_negocio' ? input.businessName?.trim() : undefined,
    items,
    customDescription:
      input.type === 'encargo_personalizado'
        ? input.customDescription?.trim()
        : undefined,
    pickup: {
      address: pickupAddress,
      referencePoint:
        (input.pickupReference || '').trim() || 'Referencia en punto de recogida',
    },
    dropoff: {
      address: dropoffAddress,
      referencePoint:
        (input.dropoffReference || '').trim() || 'Referencia en punto de destino',
    },
    instructions,
    productsCost,
    demoDeliveryFee,
    totalAmount,
    paymentMethod: input.paymentMethod,
    status: 'disponible',
    assignedDriver: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    statusHistory: [
      {
        status: 'disponible',
        timestamp: nowIso,
        actor: 'cliente',
        note:
          input.type === 'compra_negocio'
            ? `Compra en ${input.businessName?.trim()} creada y disponible.`
            : 'Encargo personalizado creado y disponible.',
      },
    ],
  };

  return {
    orders: [createdOrder, ...orders],
    createdOrder,
  };
}

/**
 * Asignación exclusiva en el prototipo local:
 * Verifica que el pedido siga exactamente en estado `'disponible'` y sin motorizado
 * antes de asignarlo.
 */
export function assignOrderToDriver(
  orders: DemoOrder[],
  orderId: string,
  driver: AssignedDriverInfo,
  nowIso: string = new Date().toISOString()
): { orders: DemoOrder[]; success: boolean; error?: string } {
  const target = orders.find((o) => o.id === orderId);
  if (!target) {
    return { orders, success: false, error: 'El pedido no existe.' };
  }

  if (target.status !== 'disponible' || target.assignedDriver !== null) {
    return {
      orders,
      success: false,
      error: 'Este pedido ya no está disponible para asignación.',
    };
  }

  const nextOrders = orders.map((order) => {
    if (order.id !== orderId) return order;
    return {
      ...order,
      status: 'asignado' as OrderStatus,
      assignedDriver: driver,
      updatedAt: nowIso,
      statusHistory: [
        ...order.statusHistory,
        {
          status: 'asignado' as OrderStatus,
          timestamp: nowIso,
          actor: 'motorizado' as const,
          note: `Pedido aceptado y asignado a ${driver.name} (${driver.vehiclePlate}).`,
        },
      ],
    };
  });

  return { orders: nextOrders, success: true };
}

/**
 * Avanza o cambia el estado de un pedido por parte del motorizado asignado.
 * Bloquea cualquier modificación si el motorizado no es el asignado al pedido
 * o si la transición solicitada no es válida.
 */
export function advanceDriverOrderStatus(
  orders: DemoOrder[],
  orderId: string,
  driverId: string,
  targetStatus?: OrderStatus,
  nowIso: string = new Date().toISOString()
): { orders: DemoOrder[]; success: boolean; error?: string } {
  const target = orders.find((o) => o.id === orderId);
  if (!target) {
    return { orders, success: false, error: 'El pedido no existe.' };
  }

  if (!target.assignedDriver || target.assignedDriver.id !== driverId) {
    return {
      orders,
      success: false,
      error: 'Solo el motorizado asignado puede actualizar este pedido.',
    };
  }

  const expectedNext = VALID_DRIVER_TRANSITIONS[target.status];
  if (!expectedNext) {
    return {
      orders,
      success: false,
      error: `El pedido en estado "${ORDER_STATUS_LABELS[target.status]}" no admite más avances.`,
    };
  }

  if (targetStatus && targetStatus !== expectedNext) {
    return {
      orders,
      success: false,
      error: `Transición inválida de "${target.status}" a "${targetStatus}".`,
    };
  }

  const nextStatus = expectedNext;
  const noteByStatus: Record<OrderStatus, string> = {
    disponible: 'Disponible',
    asignado: 'Asignado a motorizado.',
    en_camino_recogida: 'El motorizado está en camino al punto de recogida.',
    llegada_recogida: 'El motorizado llegó al punto de recogida.',
    recogido: 'El motorizado recogió el pedido.',
    en_camino_cliente: 'El motorizado está en camino a la dirección del cliente.',
    entregado: 'Pedido entregado satisfactoriamente al destinatario.',
    cancelado: 'Pedido cancelado.',
  };

  const nextOrders = orders.map((order) => {
    if (order.id !== orderId) return order;
    return {
      ...order,
      status: nextStatus,
      updatedAt: nowIso,
      statusHistory: [
        ...order.statusHistory,
        {
          status: nextStatus,
          timestamp: nowIso,
          actor: 'motorizado' as const,
          note: noteByStatus[nextStatus],
        },
      ],
    };
  });

  return { orders: nextOrders, success: true };
}

/**
 * Permite al cliente cancelar un pedido únicamente si las reglas del flujo lo permiten
 * (`disponible`, `asignado` o `en_camino_recogida`). Un pedido recogido, en camino al
 * cliente, entregado o ya cancelado no puede cancelarse.
 */
export function cancelClientOrder(
  orders: DemoOrder[],
  orderId: string,
  reason: string = 'Cancelado por el cliente en demostración.',
  nowIso: string = new Date().toISOString()
): { orders: DemoOrder[]; success: boolean; error?: string } {
  const target = orders.find((o) => o.id === orderId);
  if (!target) {
    return { orders, success: false, error: 'El pedido no existe.' };
  }

  if (!canClientCancelOrder(target.status)) {
    return {
      orders,
      success: false,
      error: `No es posible cancelar un pedido en estado "${ORDER_STATUS_LABELS[target.status]}".`,
    };
  }

  const nextOrders = orders.map((order) => {
    if (order.id !== orderId) return order;
    return {
      ...order,
      status: 'cancelado' as OrderStatus,
      updatedAt: nowIso,
      statusHistory: [
        ...order.statusHistory,
        {
          status: 'cancelado' as OrderStatus,
          timestamp: nowIso,
          actor: 'cliente' as const,
          note: reason,
        },
      ],
    };
  });

  return { orders: nextOrders, success: true };
}

export const ORDERS_STORAGE_KEY = 'verdego_orders_demo_v1';

export function loadPersistedOrders(): DemoOrder[] {
  if (typeof window === 'undefined') {
    return INITIAL_DEMO_ORDERS;
  }
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return INITIAL_DEMO_ORDERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return INITIAL_DEMO_ORDERS;
}

export function savePersistedOrders(orders: DemoOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage write errors
  }
}
