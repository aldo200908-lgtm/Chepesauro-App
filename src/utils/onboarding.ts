export type UserRole = 'usuario' | 'motorizado';
export type OnboardingStepNumber = 1 | 2 | 3;
export type AppViewMode = 'onboarding' | 'motorizado_auth' | 'main_app';
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

export interface ServiceOption {
  id: 'comprar' | 'enviar';
  title: string;
  description: string;
  badge: string;
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
  onboardingStep: OnboardingStepNumber;
  onboardingCompleted: boolean;
  viewMode: AppViewMode;
  selectedRole: UserRole | null;
  motorizadoVerified: boolean;
  step: 'selection' | 'confirmed';
  activeTab: AppTab;
  orders: DeliveryOrder[];
  activeOrderId: string;
}

export const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'comprar',
    title: 'Comprar en negocios',
    description: 'Encuentra tiendas, productos y restaurantes disponibles.',
    badge: 'Tiendas y comercios',
  },
  {
    id: 'enviar',
    title: 'Enviar por encargo',
    description: 'Solicita recoger un producto y llevarlo a otra dirección.',
    badge: 'Recogida y entrega',
  },
];

export const ROLE_OPTIONS: Record<UserRole, RoleOption> = {
  usuario: {
    id: 'usuario',
    title: 'Soy cliente',
    subtitle: 'Compras y envíos al instante',
    description: 'Compra productos, solicita envíos y sigue tus pedidos.',
    highlights: [
      'Compra en negocios locales',
      'Envíos por encargo',
      'Seguimiento en tiempo real',
    ],
    ctaLabel: 'Continuar',
    summaryText:
      'Has ingresado como Cliente. Puedes comprar en negocios, solicitar envíos por encargo y seguir tus pedidos en tiempo real.',
  },
  motorizado: {
    id: 'motorizado',
    title: 'Soy motorizado',
    subtitle: 'Gestión de entregas asignadas',
    description: 'Accede a tus entregas y gestiona tus pedidos asignados.',
    highlights: [
      'Órdenes asignadas por zona',
      'Rutas optimizadas en ciudad',
      'Control de entregas en curso',
    ],
    ctaLabel: 'Continuar',
    summaryText:
      'Has ingresado como Motorizado verificado. Puedes gestionar tus pedidos asignados y consultar las rutas activas.',
  },
};

export const INITIAL_ORDERS: DeliveryOrder[] = [
  {
    id: 'VG-104',
    title: 'Envío por encargo · Paquete y documentos',
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
    title: 'Compra en negocio · Mercado Verde',
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
    title: 'Compra en negocio · Farmacia Central',
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
  let onboardingStep: OnboardingStepNumber = 1;
  let onboardingCompleted = false;
  let viewMode: AppViewMode = 'onboarding';
  let selectedRole: UserRole | null = null;
  let motorizadoVerified = false;
  let step: 'selection' | 'confirmed' = 'selection';
  let activeTab: AppTab = 'inicio';

  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    const screenParam = params.get('screen');
    const roleParam = params.get('role');
    const autostart = params.get('autostart');
    const tabParam = params.get('tab');

    if (screenParam === '1') onboardingStep = 1;
    if (screenParam === '2') onboardingStep = 2;
    if (screenParam === '3') onboardingStep = 3;

    if (roleParam === 'usuario' || roleParam === 'motorizado') {
      selectedRole = roleParam;
      if (autostart === '1') {
        onboardingStep = 3;
        if (roleParam === 'usuario') {
          onboardingCompleted = true;
          viewMode = 'main_app';
          step = 'confirmed';
        } else {
          // Motorizado never gets automatic dashboard access without verification unless verified
          viewMode = 'motorizado_auth';
          step = 'confirmed';
        }
      }
    } else if (autostart === '1') {
      selectedRole = 'usuario';
      onboardingCompleted = true;
      viewMode = 'main_app';
      step = 'confirmed';
    }

    if (
      tabParam === 'inicio' ||
      tabParam === 'pedidos' ||
      tabParam === 'mapa' ||
      tabParam === 'perfil'
    ) {
      activeTab = tabParam;
      if (!selectedRole) {
        selectedRole = 'usuario';
      }
      onboardingCompleted = true;
      viewMode = 'main_app';
      step = 'confirmed';
    }
  }

  return {
    onboardingStep,
    onboardingCompleted,
    viewMode,
    selectedRole,
    motorizadoVerified,
    step,
    activeTab,
    orders: INITIAL_ORDERS,
    activeOrderId: INITIAL_ORDERS[0].id,
  };
}

export function goToNextOnboardingStep(state: OnboardingState): OnboardingState {
  if (state.onboardingStep === 1) {
    return { ...state, onboardingStep: 2 };
  }
  if (state.onboardingStep === 2) {
    return { ...state, onboardingStep: 3 };
  }
  return state;
}

export function goToPrevOnboardingStep(state: OnboardingState): OnboardingState {
  if (state.viewMode === 'motorizado_auth') {
    return {
      ...state,
      viewMode: 'onboarding',
      onboardingStep: 3,
      step: 'selection',
    };
  }
  if (state.onboardingStep === 3) {
    return { ...state, onboardingStep: 2 };
  }
  if (state.onboardingStep === 2) {
    return { ...state, onboardingStep: 1 };
  }
  return state;
}

export function skipToProfileSelection(state: OnboardingState): OnboardingState {
  return {
    ...state,
    onboardingStep: 3,
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
  if (state.selectedRole === 'usuario') {
    return {
      ...state,
      step: 'confirmed',
      onboardingCompleted: true,
      viewMode: 'main_app',
      activeTab: 'inicio',
    };
  }
  // Never grant motorizado permissions automatically: require motorizado access step
  return {
    ...state,
    step: 'confirmed',
    viewMode: 'motorizado_auth',
  };
}

export function verifyMotorizadoAccess(
  state: OnboardingState,
  driverCode: string
): OnboardingState {
  if (driverCode.trim().length < 4) {
    return state;
  }
  return {
    ...state,
    selectedRole: 'motorizado',
    motorizadoVerified: true,
    onboardingCompleted: true,
    viewMode: 'main_app',
    step: 'confirmed',
    activeTab: 'inicio',
  };
}

export function resetOnboardingSelection(state: OnboardingState): OnboardingState {
  return {
    ...state,
    onboardingStep: 1,
    onboardingCompleted: false,
    viewMode: 'onboarding',
    selectedRole: null,
    motorizadoVerified: false,
    step: 'selection',
    activeTab: 'inicio',
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
    title: `Envío por encargo · ${cleanDropoff}`,
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
    return 'Continuar';
  }
  return ROLE_OPTIONS[selectedRole].ctaLabel;
}
