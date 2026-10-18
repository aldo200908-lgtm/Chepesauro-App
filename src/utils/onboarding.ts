export type UserRole = 'usuario' | 'motorizado';

export interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  description: string;
  highlights: [string, string, string];
  ctaLabel: string;
  summaryText: string;
}

export interface OnboardingState {
  selectedRole: UserRole | null;
  step: 'selection' | 'confirmed';
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
      'Has seleccionado el perfil de Usuario. En el siguiente paso configuraremos tu dirección principal para pedir y recibir envíos.',
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
      'Has seleccionado el perfil de Motorizado. En el siguiente paso registraremos los datos de tu vehículo para comenzar a recibir pedidos.',
  },
};

export function createInitialOnboardingState(searchParams?: string): OnboardingState {
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    const roleParam = params.get('role');
    const autostart = params.get('autostart');
    if (roleParam === 'usuario' || roleParam === 'motorizado') {
      return {
        selectedRole: roleParam,
        step: autostart === '1' ? 'confirmed' : 'selection',
      };
    }
    if (autostart === '1') {
      return {
        selectedRole: 'usuario',
        step: 'selection',
      };
    }
  }
  return {
    selectedRole: null,
    step: 'selection',
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
    selectedRole: state.selectedRole,
    step: 'selection',
  };
}

export function getPrimaryActionLabel(selectedRole: UserRole | null): string {
  if (!selectedRole) {
    return 'Selecciona un perfil para continuar';
  }
  return ROLE_OPTIONS[selectedRole].ctaLabel;
}
