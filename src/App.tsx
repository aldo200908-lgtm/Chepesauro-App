/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Motorcycle,
  Info,
  ArrowRight,
  CheckCircle,
  IdentificationBadge,
} from '@phosphor-icons/react';
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
import { DriverOrderReviewScreen } from './components/DriverOrderReviewScreen';
import { GPSNavigationView } from './components/GPSNavigationView';

const ONBOARDING_STORAGE_KEY = 'verdego_onboarding_v2';

export default function App() {
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [activeNavigationSession, setActiveNavigationSession] = useState<{
    order: (typeof INITIAL_DEMO_ORDERS)[number];
    targetType: 'pickup' | 'dropoff';
  } | null>(null);

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
    setReviewingOrderId(null);
    setActiveNavigationSession(null);
    setState((prev) => resetOnboardingSelection(prev));
  };

  const handleSwitchRoleInApp = (role: UserRole) => {
    setReviewingOrderId(null);
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
      activeTab: role === 'motorizado' ? 'inicio' : 'pedidos',
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
    // Automatically take the motorizado to the Order Details Review Screen
    setReviewingOrderId(orderId);
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

  // Advance order through the 2-stage navigation lifecycle
  const handleAdvanceNavigationStage = (
    orderId: string,
    nextStage?: 'pickup' | 'dropoff'
  ) => {
    let updatedOrders = state.orders;
    const currentOrder = updatedOrders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    if (nextStage === 'dropoff' && currentOrder.status !== 'en_camino_cliente') {
      // Advance through pickup steps up to 'en_camino_cliente'
      let stepOrder = currentOrder;
      while (
        stepOrder &&
        stepOrder.status !== 'en_camino_cliente' &&
        stepOrder.status !== 'entregado'
      ) {
        const res = advanceDriverOrderStatus(
          updatedOrders,
          orderId,
          state.activeDriver.id
        );
        if (!res.success) break;
        updatedOrders = res.orders;
        stepOrder = updatedOrders.find((o) => o.id === orderId)!;
      }
    } else {
      // Final stage completion -> 'entregado'
      let stepOrder = currentOrder;
      while (stepOrder && stepOrder.status !== 'entregado') {
        const res = advanceDriverOrderStatus(
          updatedOrders,
          orderId,
          state.activeDriver.id
        );
        if (!res.success) break;
        updatedOrders = res.orders;
        stepOrder = updatedOrders.find((o) => o.id === orderId)!;
      }
      setReviewingOrderId(null);
    }

    setState((prev) => ({
      ...prev,
      orders: updatedOrders,
      activeOrderId: orderId,
    }));

    const latestOrder = updatedOrders.find((o) => o.id === orderId);
    if (latestOrder && latestOrder.status !== 'entregado') {
      setActiveNavigationSession({
        order: latestOrder,
        targetType: nextStage || 'dropoff',
      });
    }
  };

  const handleResetDemoOrders = () => {
    savePersistedOrders(INITIAL_DEMO_ORDERS);
    setReviewingOrderId(null);
    setActiveNavigationSession(null);
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
        selectedRole={state.selectedRole}
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

  // 2. DEMO MOTORIZADO ACCESS GATE
  if (state.viewMode === 'motorizado_auth') {
    return (
      <div
        data-testid="motorizado-auth-screen"
        className="app-viewport vg-dark-canvas flex flex-col justify-between text-[#F2F5F3] select-none px-6 relative overflow-hidden"
      >
        <header className="relative z-10 shrink-0 onboarding-safe-top">
          <div className="max-w-md mx-auto flex items-center justify-between min-h-[52px]">
            <button
              type="button"
              onClick={handlePrevStep}
              aria-label="Volver a elegir perfil"
              className="w-11 h-11 -ml-2 rounded-xl bg-transparent hover:bg-white/[0.04] active:bg-white/[0.08] text-[#F2F5F3] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} weight="regular" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#10B981] text-[#06110C] flex items-center justify-center font-display font-extrabold text-xs tracking-tight">
                V
              </div>
              <span className="font-display text-[17px] font-semibold tracking-tight text-[#F2F5F3]">
                VerdeGo
              </span>
            </div>
            <div className="w-11" />
          </div>
        </header>

        <main className="relative z-10 flex-1 min-h-0 max-w-md w-full mx-auto flex flex-col justify-between pt-2 onboarding-safe-bottom">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="my-auto space-y-7 py-2"
          >
            <div className="space-y-2.5 text-left">
              <h1
                className="font-display text-[28px] sm:text-[32px] font-bold text-[#F2F5F3] tracking-tight leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Elige tu perfil de motorizado
              </h1>
              <p className="text-[15px] text-[#8E9893] leading-relaxed">
                Selecciona una unidad de demostración para recibir pedidos y navegar en 3D.
              </p>
            </div>

            <form
              id="motorizado-auth-form"
              onSubmit={handleEnterDemoMotorizado}
              className="space-y-3"
            >
              {DEMO_DRIVERS.map((drv) => {
                const isSelected = drv.id === selectedDemoDriver.id;
                return (
                  <button
                    key={drv.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDemoDriver(drv)}
                    className={`w-full text-left p-5 rounded-2xl transition-colors flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-[#121D18] border border-[#22C58B]/70'
                        : 'vg-surface-flat hover:bg-[#151B19] hover:border-white/12 text-[#F2F5F3]'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#22C58B] text-[#06110C]'
                            : 'bg-[#161C1A] text-[#22C58B]'
                        }`}
                      >
                        <Motorcycle
                          size={22}
                          weight={isSelected ? 'fill' : 'duotone'}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-[16px] font-semibold truncate text-[#F2F5F3]">
                          {drv.name}
                        </p>
                        <p className="text-xs font-mono tabular-nums mt-0.5 text-[#8E9893]">
                          {drv.vehiclePlate} · {drv.id}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle
                        size={20}
                        weight="fill"
                        className="shrink-0 text-[#22C58B]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </form>
          </motion.div>

          <div className="pt-6">
            <button
              type="submit"
              form="motorizado-auth-form"
              className="w-full h-[52px] px-6 rounded-xl vg-btn-primary font-display text-[15px] font-semibold inline-flex items-center justify-between cursor-pointer"
            >
              <span>Ingresar como motorizado</span>
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 3. FULL-SCREEN IMMERSIVE 3D NAVIGATION (GOOGLE MAPS HUD + GTA V ROUTE LINE)
  if (activeNavigationSession) {
    const liveOrder =
      state.orders.find((o) => o.id === activeNavigationSession.order.id) ||
      activeNavigationSession.order;

    return (
      <GPSNavigationView
        order={liveOrder}
        targetType={activeNavigationSession.targetType}
        onExit={() => setActiveNavigationSession(null)}
        onAdvanceOrderStatus={handleAdvanceNavigationStage}
      />
    );
  }

  // 4. DEDICATED ORDER DETAILS REVIEW SCREEN (OPENED AUTOMATICALLY AFTER ACCEPTING AN ORDER)
  const reviewingOrder = reviewingOrderId
    ? state.orders.find((o) => o.id === reviewingOrderId) || null
    : null;

  if (reviewingOrder) {
    return (
      <DriverOrderReviewScreen
        order={reviewingOrder}
        onBack={() => setReviewingOrderId(null)}
        onContinueToNavigation={(order, initialStage) => {
          setActiveNavigationSession({
            order,
            targetType: initialStage,
          });
        }}
      />
    );
  }

  // 5. MAIN APPLICATION LAYOUT (3 TABS: INICIO, PEDIDOS, PERFIL)
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
      onReviewOrder={(orderId: string) => setReviewingOrderId(orderId)}
      onStartNavigation={(order, targetType = 'pickup') =>
        setActiveNavigationSession({ order, targetType })
      }
      onResetDemoOrders={handleResetDemoOrders}
      onLogout={handleLogout}
    />
  );
}
