/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bike, Info, ArrowRight, Check } from 'lucide-react';
import {
  UserRole,
  AppTab,
  createInitialOnboardingState,
  goToNextOnboardingStep,
  goToPrevOnboardingStep,
  skipToProfileSelection,
  selectRole,
  confirmRoleSelection,
  activateDemoMotorizadoSession,
  resetOnboardingSelection,
  switchTab,
} from './utils/onboarding';
import {
  DEMO_DRIVERS,
  INITIAL_DEMO_ORDERS,
  ORDERS_STORAGE_KEY,
  AssignedDriverInfo,
  CreateCustomOrderInput,
  createDemoOrder,
  assignOrderToDriver,
  advanceDriverOrderStatus,
  cancelClientOrder,
  savePersistedOrders,
  loadPersistedOrders,
} from './utils/ordersStore';
import { OnboardingLayout } from './components/OnboardingLayout';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ServicesIntroScreen } from './components/ServicesIntroScreen';
import { ProfileSelectionScreen } from './components/ProfileSelectionScreen';
import { MainAppLayout } from './components/MainAppLayout';

const ONBOARDING_STORAGE_KEY = 'verdego_onboarding_v2';

export default function App() {
  const [state, setState] = useState(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    if (params.get('reset') === '1' && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        window.localStorage.removeItem(ORDERS_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }

    const initial = createInitialOnboardingState(search);
    if (typeof window !== 'undefined' && !search) {
      try {
        const saved = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.onboardingCompleted === true) {
            if (parsed.selectedRole === 'usuario') {
              return {
                ...initial,
                onboardingCompleted: true,
                selectedRole: 'usuario' as UserRole,
                viewMode: 'main_app' as const,
                step: 'confirmed' as const,
              };
            }
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    return initial;
  });

  const [selectedDemoDriver, setSelectedDemoDriver] =
    useState<AssignedDriverInfo>(DEMO_DRIVERS[0]);

  // Persist onboarding completion state
  useEffect(() => {
    try {
      if (state.onboardingCompleted && state.selectedRole === 'usuario') {
        window.localStorage.setItem(
          ONBOARDING_STORAGE_KEY,
          JSON.stringify({
            onboardingCompleted: true,
            selectedRole: 'usuario',
          })
        );
      } else if (!state.onboardingCompleted) {
        window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [state.onboardingCompleted, state.selectedRole]);

  // Persist orders to localStorage whenever they change
  useEffect(() => {
    savePersistedOrders(state.orders);
  }, [state.orders]);

  // Synchronize orders across tabs of the same browser via storage event
  useEffect(() => {
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === ORDERS_STORAGE_KEY) {
        const syncedOrders = loadPersistedOrders();
        setState((prev) => ({
          ...prev,
          orders: syncedOrders,
        }));
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const handleNextStep = () => {
    setState((prev) => goToNextOnboardingStep(prev));
  };

  const handlePrevStep = () => {
    setState((prev) => goToPrevOnboardingStep(prev));
  };

  const handleSkipToProfile = () => {
    setState((prev) => skipToProfileSelection(prev));
  };

  const handleSelectRole = (role: UserRole) => {
    setState((prev) => selectRole(prev, role));
  };

  const handleConfirmProfile = () => {
    setState((prev) => confirmRoleSelection(prev));
  };

  const handleEnterDemoMotorizado = (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => activateDemoMotorizadoSession(prev, selectedDemoDriver));
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setState((prev) => resetOnboardingSelection(prev));
  };

  const handleSwitchRoleInApp = (role: UserRole) => {
    if (role === 'motorizado' && !state.motorizadoVerified) {
      setState((prev) => ({
        ...prev,
        selectedRole: 'motorizado',
        viewMode: 'motorizado_auth',
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      selectedRole: role,
      viewMode: 'main_app',
      activeTab: 'pedidos',
    }));
  };

  const handleCreateOrder = (input: CreateCustomOrderInput) => {
    const res = createDemoOrder(state.orders, input);
    if (!res.createdOrder) {
      return { success: false, error: res.error };
    }
    setState((prev) => ({
      ...prev,
      orders: res.orders,
      activeOrderId: res.createdOrder!.id,
    }));
    return { success: true };
  };

  const handleCancelOrder = (orderId: string) => {
    const res = cancelClientOrder(state.orders, orderId);
    if (!res.success) {
      return { success: false, error: res.error };
    }
    setState((prev) => ({
      ...prev,
      orders: res.orders,
    }));
    return { success: true };
  };

  const handleAcceptOrder = (orderId: string) => {
    const res = assignOrderToDriver(
      state.orders,
      orderId,
      state.activeDriver
    );
    if (!res.success) {
      return { success: false, error: res.error };
    }
    setState((prev) => ({
      ...prev,
      orders: res.orders,
      activeOrderId: orderId,
    }));
    return { success: true };
  };

  const handleAdvanceOrder = (orderId: string) => {
    const res = advanceDriverOrderStatus(
      state.orders,
      orderId,
      state.activeDriver.id
    );
    if (!res.success) {
      return { success: false, error: res.error };
    }
    setState((prev) => ({
      ...prev,
      orders: res.orders,
      activeOrderId: orderId,
    }));
    return { success: true };
  };

  const handleResetDemoOrders = () => {
    savePersistedOrders(INITIAL_DEMO_ORDERS);
    setState((prev) => ({
      ...prev,
      orders: INITIAL_DEMO_ORDERS,
      activeOrderId: INITIAL_DEMO_ORDERS[0].id,
    }));
  };

  // 1. ONBOARDING FLOW (Screens 1, 2, 3) — Zero bottom nav, zero dashboard clutter
  if (state.viewMode === 'onboarding') {
    return (
      <OnboardingLayout
        step={state.onboardingStep}
        onBack={state.onboardingStep > 1 ? handlePrevStep : undefined}
      >
        {state.onboardingStep === 1 && (
          <WelcomeScreen onStart={handleNextStep} />
        )}

        {state.onboardingStep === 2 && (
          <ServicesIntroScreen
            onContinue={handleNextStep}
            onSkip={handleSkipToProfile}
          />
        )}

        {state.onboardingStep === 3 && (
          <ProfileSelectionScreen
            selectedRole={state.selectedRole}
            onSelectRole={handleSelectRole}
            onContinue={handleConfirmProfile}
          />
        )}
      </OnboardingLayout>
    );
  }

  // 2. DEMO MOTORIZADO ACCESS GATE (Clearly labeled as simulation mode, separate from future server auth)
  if (state.viewMode === 'motorizado_auth') {
    return (
      <div
        data-testid="motorizado-auth-screen"
        className="app-viewport flex flex-col justify-between bg-[#FFFFFF] text-[#102F27] select-none px-5"
      >
        <header className="shrink-0 onboarding-safe-top">
          <div className="max-w-md mx-auto flex items-center justify-between min-h-[48px]">
            <button
              type="button"
              onClick={handlePrevStep}
              aria-label="Volver a elegir perfil"
              className="w-10 h-10 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <span className="text-xs font-semibold text-[#078F68]">
              Simulación de Motorizado (Demo)
            </span>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 min-h-0 max-w-md w-full mx-auto flex flex-col justify-between py-4 onboarding-safe-bottom">
          <div className="my-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] text-[#078F68] flex items-center justify-center">
              <Bike className="w-8 h-8 stroke-[2]" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-[#102F27] tracking-tight">
                Acceso de demostración para motorizado
              </h1>
              <p className="text-sm text-[#64877C] leading-relaxed">
                Selecciona un perfil de motorizado de prueba para simular la
                recepción, asignación exclusiva y entrega de pedidos.
              </p>
            </div>

            <form
              id="motorizado-auth-form"
              onSubmit={handleEnterDemoMotorizado}
              className="space-y-3 rounded-3xl bg-[#EAF8F2]/60 border border-[#DCECE5] p-5"
            >
              <p className="text-xs font-semibold text-[#102F27]">
                Elige el motorizado de prueba:
              </p>

              <div className="space-y-2.5">
                {DEMO_DRIVERS.map((drv) => {
                  const isSelected = drv.id === selectedDemoDriver.id;
                  return (
                    <button
                      key={drv.id}
                      type="button"
                      onClick={() => setSelectedDemoDriver(drv)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#078F68] text-white border-[#078F68]'
                          : 'bg-white text-[#102F27] border-[#DCECE5] hover:bg-[#EAF8F2]'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-xs font-bold ${
                            isSelected ? 'text-white' : 'text-[#102F27]'
                          }`}
                        >
                          {drv.name}
                        </p>
                        <p
                          className={`text-[11px] ${
                            isSelected ? 'text-[#EAF8F2]' : 'text-[#64877C]'
                          }`}
                        >
                          ID: {drv.id} · Placa: {drv.vehiclePlate}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-start gap-2 text-xs text-[#64877C] pt-1">
                <Info
                  className="w-4 h-4 text-[#078F68] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  Modo de demostración local: esta selección simula la sesión del
                  repartidor en el navegador y no sustituye la autenticación del
                  servidor en producción.
                </span>
              </div>
            </form>
          </div>

          <div className="pt-4 space-y-2.5">
            <button
              type="submit"
              form="motorizado-auth-form"
              className="w-full h-14 px-6 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white font-display text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-md shadow-[#078F68]/20 transition-all cursor-pointer"
            >
              <span>Entrar al panel de motorizado (Demo)</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 3. MAIN APPLICATION LAYOUT
  return (
    <MainAppLayout
      state={state}
      onSelectTab={(tab: AppTab) => setState((prev) => switchTab(prev, tab))}
      onSelectRole={handleSwitchRoleInApp}
      onSelectDemoDriver={(drv: AssignedDriverInfo) =>
        setState((prev) => ({ ...prev, activeDriver: drv }))
      }
      onCreateOrder={handleCreateOrder}
      onCancelOrder={handleCancelOrder}
      onAcceptOrder={handleAcceptOrder}
      onAdvanceOrder={handleAdvanceOrder}
      onSelectMapOrder={(orderId: string) =>
        setState((prev) => ({ ...prev, activeOrderId: orderId }))
      }
      onResetDemoOrders={handleResetDemoOrders}
      onLogout={handleLogout}
    />
  );
}
