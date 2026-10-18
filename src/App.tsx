/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Bike,
  ShoppingBag,
} from 'lucide-react';
import {
  ROLE_OPTIONS,
  UserRole,
  createInitialOnboardingState,
  selectRole,
  confirmRoleSelection,
  resetOnboardingSelection,
  getPrimaryActionLabel,
} from './utils/onboarding';
import { RoleCard } from './components/RoleCard';

export default function App() {
  const [state, setState] = useState(() =>
    createInitialOnboardingState(
      typeof window !== 'undefined' ? window.location.search : ''
    )
  );

  const handleSelectRole = (role: UserRole) => {
    setState((prev) => selectRole(prev, role));
  };

  const handleConfirm = () => {
    setState((prev) => confirmRoleSelection(prev));
  };

  const handleReset = () => {
    setState((prev) => resetOnboardingSelection(prev));
  };

  const activeRoleOption = state.selectedRole
    ? ROLE_OPTIONS[state.selectedRole]
    : null;

  return (
    <div className="min-h-[100dvh] w-full bg-emerald-950/5 sm:py-6 sm:px-4 flex items-center justify-center">
      {/* Mobile App Container */}
      <div className="w-full max-w-[420px] min-h-[100dvh] sm:min-h-[812px] sm:max-h-[860px] bg-white sm:rounded-[44px] sm:shadow-2xl sm:shadow-emerald-950/15 sm:border-[6px] sm:border-emerald-950 flex flex-col justify-between overflow-hidden relative">
        {/* Top Green Curved App Header */}
        <header className="bg-emerald-600 text-white px-6 pt-5 pb-7 rounded-b-[36px] shadow-sm shrink-0">
          {/* App Top Bar: Back button or Brand + Step Progress */}
          <div className="flex items-center justify-between gap-4 min-h-[44px]">
            {state.step === 'confirmed' ? (
              <button
                type="button"
                onClick={handleReset}
                aria-label="Volver a elegir perfil"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-display font-bold text-lg shadow-sm">
                  V
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-white">
                  VerdeGo
                </span>
              </div>
            )}

            {/* Step progress bars */}
            <div
              className="flex items-center gap-1.5"
              aria-label={
                state.step === 'selection' ? 'Paso 1 de 2' : 'Paso 2 de 2'
              }
            >
              <span className="w-7 h-1.5 rounded-full bg-white" />
              <span
                className={`w-7 h-1.5 rounded-full transition-colors duration-200 ${
                  state.step === 'confirmed' ? 'bg-white' : 'bg-white/35'
                }`}
              />
            </div>
          </div>

          {/* App Header Greeting */}
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-emerald-100">
              {state.step === 'selection'
                ? 'Bienvenido a la app'
                : 'Perfil configurado'}
            </p>
            <h1
              className="font-display text-2xl font-bold tracking-tight text-white leading-snug"
              style={{ textWrap: 'balance' }}
            >
              {state.step === 'selection'
                ? '¿Cómo quieres ingresar hoy?'
                : `Hola, ${activeRoleOption?.title}`}
            </h1>
          </div>
        </header>

        {/* Scrollable App Content Area */}
        <main className="flex-1 px-5 py-5 flex flex-col justify-between overflow-y-auto">
          {state.step === 'selection' ? (
            <div className="space-y-4 my-auto">
              {/* Segmented Quick Role Switcher (Rounded Pill Toggle) */}
              <div
                role="group"
                aria-label="Cambio rápido de perfil"
                className="grid grid-cols-2 p-1.5 bg-emerald-50 rounded-full border border-emerald-900/8"
              >
                <button
                  type="button"
                  onClick={() => handleSelectRole('usuario')}
                  className={`py-2.5 px-4 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                    state.selectedRole === 'usuario'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-900/75 hover:text-emerald-950'
                  }`}
                >
                  Soy Usuario
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRole('motorizado')}
                  className={`py-2.5 px-4 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                    state.selectedRole === 'motorizado'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-900/75 hover:text-emerald-950'
                  }`}
                >
                  Soy Motorizado
                </button>
              </div>

              {/* Interactive Role Cards */}
              <div
                role="group"
                aria-label="Selección de perfil entre Usuario y Motorizado"
                className="space-y-3.5"
              >
                <RoleCard
                  option={ROLE_OPTIONS.usuario}
                  isSelected={state.selectedRole === 'usuario'}
                  onSelect={() => handleSelectRole('usuario')}
                />

                <RoleCard
                  option={ROLE_OPTIONS.motorizado}
                  isSelected={state.selectedRole === 'motorizado'}
                  onSelect={() => handleSelectRole('motorizado')}
                />
              </div>
            </div>
          ) : (
            /* Mobile App Confirmation Screen */
            <div className="my-auto py-4 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-600/20 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                {state.selectedRole === 'usuario' ? (
                  <ShoppingBag className="w-10 h-10 stroke-[1.8]" aria-hidden="true" />
                ) : (
                  <Bike className="w-10 h-10 stroke-[1.8]" aria-hidden="true" />
                )}
              </div>

              <div className="space-y-2 px-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Selección lista</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-emerald-950">
                  Modo {activeRoleOption?.title}
                </h2>
                <p className="text-sm text-emerald-900/70 leading-relaxed">
                  {activeRoleOption?.summaryText}
                </p>
              </div>

              <div className="py-4 border-t border-b border-emerald-900/10 space-y-2">
                <p className="text-xs font-semibold text-emerald-800">
                  Tu cuenta incluye
                </p>
                <div className="text-xs text-emerald-900/80 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  {activeRoleOption?.highlights.map((item, idx) => (
                    <React.Fragment key={item}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span>{item}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Thumb-Zone Action Area */}
        <div className="px-5 pt-3 pb-5 bg-white border-t border-emerald-900/6 shrink-0 space-y-3">
          {state.step === 'selection' ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!state.selectedRole}
              className={`w-full h-14 px-6 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-all duration-200 whitespace-nowrap shrink-0 ${
                state.selectedRole
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-600/25 cursor-pointer'
                  : 'bg-emerald-950/8 text-emerald-950/35 cursor-not-allowed'
              }`}
            >
              <span>{getPrimaryActionLabel(state.selectedRole)}</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const nextRole =
                    state.selectedRole === 'usuario' ? 'motorizado' : 'usuario';
                  setState({
                    selectedRole: nextRole,
                    step: 'confirmed',
                  });
                }}
                className="w-full h-13 px-6 rounded-full text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  Cambiar a{' '}
                  {state.selectedRole === 'usuario' ? 'Motorizado' : 'Usuario'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full h-12 px-6 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.98] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Volver a elegir perfil</span>
              </button>
            </div>
          )}

          {/* Mobile Home Indicator Pill */}
          <div className="w-32 h-1 bg-emerald-950/15 rounded-full mx-auto mt-2" />
        </div>
      </div>
    </div>
  );
}
