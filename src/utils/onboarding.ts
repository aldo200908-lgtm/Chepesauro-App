export type UserRole = 'usuario' | 'motorizado';
export type AppTab = 'inicio' | 'pedidos' | 'mapa' | 'perfil';
export type OrderStatus = 'pendiente' | 'en_camino' | 'entregado';

export interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  description: string;
  highlights: [string, string, string];
  ctaLabel: string;
  summaryText: string;
}

export interface DeliveryOrder {
  id: string;
  title: string;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  etaMinutes: number;
  priceFormatted: string;
  status: OrderStatus;
  roleOwner: UserRole;
}

export interface OnboardingState {
  selectedRole: UserRole | null;
  step: 'selection' | 'confirmed';
  activeTab: AppTab;
  orders: DeliveryOrder[];
  activeOrderId: string;
}

export const ROLE_OPTIONS: Record<UserRole, RoleOption> = {
  usuario: {
    id: 'usuario',
    title: 'Usuario',
    subtitle: 'Envía y recibe pedidos al instante',
    description:
      'Solicita envíos rápidos, sigue tu entrega en tiempo real y recibe tus compras en la puerta de tu casa con total tranquilidad.',
    highlights: [
      'Envíos rápidos en tu ciudad',
      'Seguimiento en tiempo real',
      'Atención directa y segura',
    ],
    ctaLabel: 'Continuar como Usuario',
    summaryText:
      'Has seleccionado el perfil de Usuario. Puedes gestionar tus envíos desde Pedidos, seguir la ruta en Mapa o ajustar tu cuenta en Perfil.',
  },
  motorizado: {
    id: 'motorizado',
    title: 'Motorizado',
    subtitle: 'Genera ingresos en tu propio horario',
    description:
      'Acepta órdenes cercanas, optimiza tus rutas de entrega en la ciudad y recibe tus ganancias de manera clara y directa.',
    highlights: [
      'Horarios 100% flexibles',
      'Rutas optimizadas por zona',
      'Ganancias transparentes',
    ],
    ctaLabel: 'Continuar como Motorizado',
    summaryText:
      'Has seleccionado el perfil de Motorizado. Puedes revisar entregas cercanas en Pedidos, ver la ruta activa en Mapa o configurar tu vehículo en Perfil.',
  },
};

export const INITIAL_ORDERS: DeliveryOrder[] = [
  {
    id: 'VG-104',
    title: 'Envío Express · Documentos y Paquete',
    pickup: 'Av. Principal 420, Centro',
    dropoff: 'Calle Los Pinos 185, Miraflores',
    distanceKm: 3.4,
    etaMinutes: 14,
    priceFormatted: '$4.50',
    status: 'en_camino',
    roleOwner: 'usuario',
  },
  {
    id: 'VG-105',
    title: 'Pedido Mercado Verde · 3 artículos',
    pickup: 'Av. Las Palmas 890, San Isidro',
    dropoff: 'Jr. Alcanfores 240, Surco',
    distanceKm: 2.1,
    etaMinutes: 11,
    priceFormatted: '$3.80',
    status: 'pendiente',
    roleOwner: 'motorizado',
  },
  {
    id: 'VG-102',
    title: 'Entrega Farmacia Central',
    pickup: 'Av. Arequipa 1120, Lince',
    dropoff: 'Calle Las Begonias 310, San Borja',
    distanceKm: 4.0,
    etaMinutes: 18,
    priceFormatted: '$5.20',
    status: 'entregado',
    roleOwner: 'usuario',
  },
];

export function createInitialOnboardingState(searchParams?: string): OnboardingState {
  let selectedRole: UserRole | null = null;
  let step: 'selection' | 'confirmed' = 'selection';
  let activeTab: AppTab = 'inicio';

  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    const roleParam = params.get('role');
    const autostart = params.get('autostart');
    const tabParam = params.get('tab');

    if (roleParam === 'usuario' || roleParam === 'motorizado') {
      selectedRole = roleParam;
      step = autostart === '1' ? 'confirmed' : 'selection';
    } else if (autostart === '1') {
      selectedRole = 'usuario';
      step = 'selection';
    }

    if (
      tabParam === 'inicio' ||
      tabParam === 'pedidos' ||
      tabParam === 'mapa' ||
      tabParam === 'perfil'
    ) {
      activeTab = tabParam;
    }
  }

  return {
    selectedRole,
    step,
    activeTab,
    orders: INITIAL_ORDERS,
    activeOrderId: INITIAL_ORDERS[0].id,
  };
}

export function selectRole(state: OnboardingState, role: UserRole): OnboardingState {
  return {
    ...state,
    selectedRole: role,
    step: 'selection',
  };
}

export function confirmRoleSelection(state: OnboardingState): OnboardingState {
  if (!state.selectedRole) {
    return state;
  }
  return {
    ...state,
    step: 'confirmed',
  };
}

export function resetOnboardingSelection(state: OnboardingState): OnboardingState {
  return {
    ...state,
    step: 'selection',
  };
}

export function switchTab(state: OnboardingState, tab: AppTab): OnboardingState {
  return {
    ...state,
    activeTab: tab,
  };
}

export function advanceOrderStatus(
  state: OnboardingState,
  orderId: string
): OnboardingState {
  const nextOrders = state.orders.map((order) => {
    if (order.id !== orderId) return order;
    const nextStatus: OrderStatus =
      order.status === 'pendiente'
        ? 'en_camino'
        : order.status === 'en_camino'
        ? 'entregado'
        : 'pendiente';
    return {
      ...order,
      status: nextStatus,
    };
  });
  return {
    ...state,
    orders: nextOrders,
    activeOrderId: orderId,
  };
}

export function createQuickOrder(
  state: OnboardingState,
  pickup: string,
  dropoff: string
): OnboardingState {
  const cleanPickup = pickup.trim();
  const cleanDropoff = dropoff.trim();
  if (!cleanPickup || !cleanDropoff) {
    return state;
  }
  const nextNumber = 106 + state.orders.length;
  const newOrder: DeliveryOrder = {
    id: `VG-${nextNumber}`,
    title: `Envío Rápido · ${cleanDropoff}`,
    pickup: cleanPickup,
    dropoff: cleanDropoff,
    distanceKm: 2.8,
    etaMinutes: 12,
    priceFormatted: '$4.20',
    status: 'pendiente',
    roleOwner: state.selectedRole || 'usuario',
  };
  return {
    ...state,
    orders: [newOrder, ...state.orders],
    activeOrderId: newOrder.id,
  };
}

export function getPrimaryActionLabel(selectedRole: UserRole | null): string {
  if (!selectedRole) {
    return 'Selecciona un perfil para continuar';
  }
  return ROLE_OPTIONS[selectedRole].ctaLabel;
}
