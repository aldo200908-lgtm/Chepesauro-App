/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bike, ShieldCheck, ArrowRight } from 'lucide-react';
import {
  UserRole,
  AppTab,
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
} from './utils/onboarding';
import { OnboardingLayout } from './components/OnboardingLayout';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ServicesIntroScreen } from './components/ServicesIntroScreen';
import { ProfileSelectionScreen } from './components/ProfileSelectionScreen';
import { MainAppLayout } from './components/MainAppLayout';

const STORAGE_KEY = 'verdego_onboarding_v2';

export default function App() {
  const [state, setState] = useState(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    if (params.get('reset') === '1' && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
    const initial = createInitialOnboardingState(search);
    if (
      typeof window !== 'undefined' &&
      !search
    ) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
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

  const [driverCode, setDriverCode] = useState('MOTO-2026');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    try {
      if (state.onboardingCompleted && state.selectedRole === 'usuario') {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            onboardingCompleted: true,
            selectedRole: 'usuario',
          })
        );
      } else if (!state.onboardingCompleted) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [state.onboardingCompleted, state.selectedRole]);

  const handleNextStep = () => {
    setState((prev) => goToNextOnboardingStep(prev));
  };

  const handlePrevStep = () => {
    setAuthError('');
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

  const handleVerifyMotorizado = (e: React.FormEvent) => {
    e.preventDefault();
    if (driverCode.trim().length < 4) {
      setAuthError('Ingresa tu código de motorizado (mínimo 4 caracteres).');
      return;
    }
    setAuthError('');
    setState((prev) => verifyMotorizadoAccess(prev, driverCode));
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
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

  // 2. MOTORIZADO ACCESS GATE (Never grant motorizado permissions automatically)
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
              Acceso de Motorizado
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
                Acceso para motorizados
              </h1>
              <p className="text-sm text-[#64877C] leading-relaxed">
                Verifica tu código de repartidor autorizado para consultar y
                gestionar tus pedidos asignados.
              </p>
            </div>

            <form
              id="motorizado-auth-form"
              onSubmit={handleVerifyMotorizado}
              className="space-y-4 rounded-3xl bg-[#EAF8F2]/60 border border-[#DCECE5] p-5"
            >
              <div>
                <label
                  htmlFor="driver-code-input"
                  className="block text-xs font-semibold text-[#102F27] mb-1.5"
                >
                  Código de motorizado asignado
                </label>
                <input
                  id="driver-code-input"
                  type="text"
                  value={driverCode}
                  onChange={(e) => setDriverCode(e.target.value)}
                  placeholder="Ej. MOTO-2026"
                  className="w-full h-12 px-4 rounded-2xl bg-white border border-[#DCECE5] text-sm font-semibold text-[#102F27] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
                />
              </div>

              {authError && (
                <p className="text-xs font-medium text-red-600">{authError}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-[#64877C]">
                <ShieldCheck
                  className="w-4 h-4 text-[#078F68] shrink-0"
                  aria-hidden="true"
                />
                <span>Verificación requerida antes de habilitar entregas</span>
              </div>
            </form>
          </div>

          <div className="pt-4 space-y-2.5">
            <button
              type="submit"
              form="motorizado-auth-form"
              className="w-full h-14 px-6 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white font-display text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-md shadow-[#078F68]/20 transition-all cursor-pointer"
            >
              <span>Ingresar como motorizado</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 3. MAIN APPLICATION LAYOUT (Only after completing onboarding)
  return (
    <MainAppLayout
      state={state}
      onSelectTab={(tab: AppTab) => setState((prev) => switchTab(prev, tab))}
      onSelectRole={handleSwitchRoleInApp}
      onAdvanceOrder={(orderId: string) =>
        setState((prev) => advanceOrderStatus(prev, orderId))
      }
      onCreateOrder={(pickup: string, dropoff: string) =>
        setState((prev) => createQuickOrder(prev, pickup, dropoff))
      }
      onSelectMapOrder={(orderId: string) =>
        setState((prev) => ({ ...prev, activeOrderId: orderId }))
      }
      onLogout={handleLogout}
    />
  );
}
