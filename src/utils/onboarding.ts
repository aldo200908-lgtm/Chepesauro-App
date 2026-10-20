import type {
  DemoOrder,
  AssignedDriverInfo,
} from './ordersStore.ts';
import {
  DEMO_DRIVERS,
  INITIAL_DEMO_ORDERS,
  loadPersistedOrders,
} from './ordersStore.ts';

export type UserRole = 'usuario' | 'motorizado';
export type OnboardingStepNumber = 1 | 2 | 3;
export type AppViewMode = 'onboarding' | 'motorizado_auth' | 'main_app';
export type AppTab = 'inicio' | 'pedidos' | 'mapa' | 'perfil';

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

export interface OnboardingState {
  onboardingStep: OnboardingStepNumber;
  onboardingCompleted: boolean;
  viewMode: AppViewMode;
  selectedRole: UserRole | null;
  motorizadoVerified: boolean;
  activeDriver: AssignedDriverInfo;
  step: 'selection' | 'confirmed';
  activeTab: AppTab;
  orders: DemoOrder[];
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
      'Has ingresado como Cliente (Modo Demostración). Crea encargos personalizados o compras en negocios y consulta el estado de tus envíos en tiempo real.',
  },
  motorizado: {
    id: 'motorizado',
    title: 'Soy motorizado',
    subtitle: 'Gestión de entregas asignadas',
    description: 'Accede a tus entregas y gestiona tus pedidos asignados.',
    highlights: [
      'Órdenes disponibles por zona',
      'Asignación y ruta de recogida',
      'Control de entregas paso a paso',
    ],
    ctaLabel: 'Continuar',
    summaryText:
      'Has ingresado como Motorizado (Modo Demostración). Acepta pedidos disponibles y actualiza cada etapa de recogida y entrega.',
  },
};

export function createInitialOnboardingState(
  searchParams?: string,
  preloadedOrders?: DemoOrder[]
): OnboardingState {
  let onboardingStep: OnboardingStepNumber = 1;
  let onboardingCompleted = false;
  let viewMode: AppViewMode = 'onboarding';
  let selectedRole: UserRole | null = null;
  let motorizadoVerified = false;
  let step: 'selection' | 'confirmed' = 'selection';
  let activeTab: AppTab = 'inicio';

  const orders = preloadedOrders || loadPersistedOrders() || INITIAL_DEMO_ORDERS;

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
      if (selectedRole === 'motorizado') {
        motorizadoVerified = true;
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
    activeDriver: DEMO_DRIVERS[0],
    step,
    activeTab,
    orders,
    activeOrderId: orders[0]?.id || 'VG-1001',
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
      activeTab: 'pedidos',
    };
  }
  return {
    ...state,
    step: 'confirmed',
    viewMode: 'motorizado_auth',
  };
}

export function activateDemoMotorizadoSession(
  state: OnboardingState,
  driver: AssignedDriverInfo = DEMO_DRIVERS[0]
): OnboardingState {
  return {
    ...state,
    selectedRole: 'motorizado',
    motorizadoVerified: true,
    activeDriver: driver,
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

export function getPrimaryActionLabel(selectedRole: UserRole | null): string {
  if (!selectedRole) {
    return 'Continuar';
  }
  return ROLE_OPTIONS[selectedRole].ctaLabel;
}
