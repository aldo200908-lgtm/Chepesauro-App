/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Bike,
  ShoppingBag,
  MapPin,
  Navigation,
  Clock,
  Plus,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  ROLE_OPTIONS,
  UserRole,
  AppTab,
  createInitialOnboardingState,
  selectRole,
  confirmRoleSelection,
  resetOnboardingSelection,
  getPrimaryActionLabel,
  switchTab,
  advanceOrderStatus,
  createQuickOrder,
} from './utils/onboarding';
import { RoleCard } from './components/RoleCard';
import { BottomNav } from './components/BottomNav';
import { PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEY = 'verdego_app_state_v1';

export default function App() {
  const [state, setState] = useState(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const initial = createInitialOnboardingState(search);
    if (typeof window !== 'undefined' && !search) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return {
              ...initial,
              selectedRole:
                parsed.selectedRole === 'usuario' ||
                parsed.selectedRole === 'motorizado'
                  ? parsed.selectedRole
                  : initial.selectedRole,
              step:
                parsed.step === 'confirmed' && parsed.selectedRole
                  ? 'confirmed'
                  : initial.step,
            };
          }
        }
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
    return initial;
  });

  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRole: state.selectedRole,
          step: state.step,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [state.selectedRole, state.step]);

  const handleSelectRole = (role: UserRole) => {
    setState((prev) => selectRole(prev, role));
  };

  const handleConfirm = () => {
    setState((prev) => confirmRoleSelection(prev));
  };

  const handleReset = () => {
    setState((prev) => resetOnboardingSelection(prev));
  };

  const handleSelectTab = (tab: AppTab) => {
    setState((prev) => switchTab(prev, tab));
  };

  const handleAdvanceOrder = (orderId: string) => {
    setState((prev) => advanceOrderStatus(prev, orderId));
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupInput.trim() || !dropoffInput.trim()) {
      setFormError('Ingresa la dirección de recogida y de entrega.');
      return;
    }
    setFormError('');
    setState((prev) => createQuickOrder(prev, pickupInput, dropoffInput));
    setPickupInput('');
    setDropoffInput('');
  };

  const activeRoleOption = state.selectedRole
    ? ROLE_OPTIONS[state.selectedRole]
    : null;

  const activeOrdersCount = state.orders.filter(
    (o) => o.status !== 'entregado'
  ).length;

  const currentMapOrder =
    state.orders.find((o) => o.id === state.activeOrderId) || state.orders[0];

  const headerSubtitle: Record<AppTab, string> = {
    inicio:
      state.step === 'selection'
        ? 'Elige tu perfil para comenzar'
        : `Modo ${activeRoleOption?.title ?? 'Activo'}`,
    pedidos: 'Gestión de envíos en tiempo real',
    mapa: 'Cobertura y ruta activa en ciudad',
    perfil: 'Configuración de rol y aplicación',
  };

  return (
    <div className="app-viewport flex flex-col bg-white text-emerald-950 select-none">
      {/* FIXED TOP APP HEADER */}
      <header className="shrink-0 z-30 bg-emerald-600 text-white px-4 pt-3 pb-3.5 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {state.activeTab === 'inicio' && state.step === 'confirmed' ? (
              <button
                type="button"
                onClick={handleReset}
                aria-label="Volver a elegir perfil"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors active:scale-95 shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-display font-bold text-base shadow-xs shrink-0">
                V
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
                  VerdeGo
                </span>
                {activeRoleOption && (
                  <span className="text-xs font-medium text-emerald-100 whitespace-nowrap shrink-0">
                    · {activeRoleOption.title}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-100 truncate">
                {headerSubtitle[state.activeTab]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton compact />
          </div>
        </div>
      </header>

      {/* INDEPENDENT SCROLLABLE CENTER AREA */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden pb-safe-nav">
        <div className="max-w-lg mx-auto px-4 py-4">
          {/* TAB 1: INICIO (Onboarding Role Selection & Confirmation) */}
          {state.activeTab === 'inicio' && (
            <>
              {state.step === 'selection' ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="font-display text-xl font-bold tracking-tight text-emerald-950">
                      ¿Cómo quieres ingresar hoy?
                    </h1>
                    <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                      Paso 1 · 2
                    </span>
                  </div>

                  {/* Segmented Quick Role Switcher (Rounded Pill Toggle) */}
                  <div
                    role="group"
                    aria-label="Cambio rápido de perfil"
                    className="grid grid-cols-2 p-1 bg-emerald-50 rounded-full border border-emerald-900/8"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectRole('usuario')}
                      className={`py-2 px-4 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                        state.selectedRole === 'usuario'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-emerald-900/75 hover:text-emerald-950'
                      }`}
                    >
                      Soy Usuario
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRole('motorizado')}
                      className={`py-2 px-4 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                        state.selectedRole === 'motorizado'
                          ? 'bg-emerald-600 text-white shadow-xs'
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
                    className="space-y-3"
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

                  {/* Primary Rounded Confirm CTA */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={!state.selectedRole}
                      className={`w-full h-13 px-6 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-all duration-150 whitespace-nowrap shrink-0 ${
                        state.selectedRole
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer'
                          : 'bg-emerald-950/8 text-emerald-950/35 cursor-not-allowed'
                      }`}
                    >
                      <span>{getPrimaryActionLabel(state.selectedRole)}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Confirmed Role Home Screen */
                <div className="space-y-4 py-2">
                  <div className="rounded-3xl bg-emerald-50/70 border border-emerald-900/10 p-5 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                      {state.selectedRole === 'usuario' ? (
                        <ShoppingBag className="w-8 h-8" aria-hidden="true" />
                      ) : (
                        <Bike className="w-8 h-8" aria-hidden="true" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>Perfil activo</span>
                      </div>
                      <h1 className="font-display text-2xl font-bold text-emerald-950">
                        Hola, {activeRoleOption?.title}
                      </h1>
                      <p className="text-xs sm:text-sm text-emerald-900/75 leading-relaxed">
                        {activeRoleOption?.summaryText}
                      </p>
                    </div>

                    <div className="py-3.5 border-t border-b border-emerald-900/10 text-xs text-emerald-900/80 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                      {activeRoleOption?.highlights.map((item, idx) => (
                        <React.Fragment key={item}>
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <span>{item}</span>
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTab('pedidos')}
                        className="h-11 px-4 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-98 inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>Ver Pedidos</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('mapa')}
                        className="h-11 px-4 rounded-full bg-white text-emerald-800 border border-emerald-900/15 text-xs font-semibold hover:bg-emerald-50 active:scale-98 inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Abrir Mapa</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 h-11 px-4 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Volver a elegir perfil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nextRole =
                          state.selectedRole === 'usuario'
                            ? 'motorizado'
                            : 'usuario';
                        setState((prev) => ({
                          ...prev,
                          selectedRole: nextRole,
                          step: 'confirmed',
                        }));
                      }}
                      className="flex-1 h-11 px-4 rounded-full text-xs font-semibold text-emerald-700 bg-white border border-emerald-900/15 hover:bg-emerald-50 inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        Cambiar a{' '}
                        {state.selectedRole === 'usuario'
                          ? 'Motorizado'
                          : 'Usuario'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: PEDIDOS (Scrollable Order List + Quick New Order Form) */}
          {state.activeTab === 'pedidos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-emerald-950">
                    Mis Pedidos
                  </h1>
                  <p className="text-xs text-emerald-800/75">
                    {state.selectedRole === 'motorizado'
                      ? 'Órdenes asignadas y disponibles en tu zona'
                      : 'Solicita y sigue tus envíos en curso'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  {activeOrdersCount} activos
                </span>
              </div>

              {/* Quick New Delivery Form */}
              <form
                onSubmit={handleCreateOrder}
                className="rounded-3xl bg-emerald-50/60 border border-emerald-900/10 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-emerald-900">
                  Nuevo envío rápido
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="pickup-input"
                      className="block text-[11px] font-medium text-emerald-800 mb-1"
                    >
                      Punto de recogida
                    </label>
                    <input
                      id="pickup-input"
                      type="text"
                      value={pickupInput}
                      onChange={(e) => setPickupInput(e.target.value)}
                      placeholder="Ej. Av. Central 320"
                      className="w-full h-10 px-3.5 rounded-2xl bg-white border border-emerald-900/15 text-xs text-emerald-950 placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dropoff-input"
                      className="block text-[11px] font-medium text-emerald-800 mb-1"
                    >
                      Punto de entrega
                    </label>
                    <input
                      id="dropoff-input"
                      type="text"
                      value={dropoffInput}
                      onChange={(e) => setDropoffInput(e.target.value)}
                      placeholder="Ej. Calle Norte 140"
                      className="w-full h-10 px-3.5 rounded-2xl bg-white border border-emerald-900/15 text-xs text-emerald-950 placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
                {formError && (
                  <p className="text-xs font-medium text-red-600">{formError}</p>
                )}
                <button
                  type="submit"
                  className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Crear pedido ahora</span>
                </button>
              </form>

              {/* Orders List */}
              <div className="space-y-3">
                {state.orders.map((order) => {
                  const statusLabel =
                    order.status === 'pendiente'
                      ? 'Pendiente de recogida'
                      : order.status === 'en_camino'
                      ? 'En camino'
                      : 'Entregado';

                  const actionText =
                    order.status === 'pendiente'
                      ? state.selectedRole === 'motorizado'
                        ? 'Iniciar ruta'
                        : 'Confirmar recogida'
                      : order.status === 'en_camino'
                      ? 'Marcar entregado'
                      : 'Reactivar envío';

                  return (
                    <div
                      key={order.id}
                      className="rounded-3xl bg-white border border-emerald-900/12 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 tabular-nums">
                            <span>{order.id}</span>
                            <span aria-hidden="true">·</span>
                            <span>{statusLabel}</span>
                          </div>
                          <h2 className="font-display text-sm font-bold text-emerald-950 mt-0.5">
                            {order.title}
                          </h2>
                        </div>
                        <span className="font-display text-sm font-bold text-emerald-700 tabular-nums">
                          {order.priceFormatted}
                        </span>
                      </div>

                      <div className="text-xs text-emerald-900/75 space-y-1">
                        <p className="truncate">
                          <strong className="font-semibold text-emerald-950">
                            Origen:
                          </strong>{' '}
                          {order.pickup}
                        </p>
                        <p className="truncate">
                          <strong className="font-semibold text-emerald-950">
                            Destino:
                          </strong>{' '}
                          {order.dropoff}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-emerald-900/8 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-emerald-800/75 tabular-nums flex items-center gap-1 whitespace-nowrap shrink-0">
                          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{order.etaMinutes} min</span>
                          <span aria-hidden="true">·</span>
                          <span>{order.distanceKm} km</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setState((prev) => ({
                                ...prev,
                                activeOrderId: order.id,
                                activeTab: 'mapa',
                              }));
                            }}
                            className="h-9 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Mapa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAdvanceOrder(order.id)}
                            className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {actionText}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MAPA (Interactive Route & Zone Tracker) */}
          {state.activeTab === 'mapa' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-emerald-950">
                    Mapa de Ruta
                  </h1>
                  <p className="text-xs text-emerald-800/75">
                    Seguimiento activo del envío {currentMapOrder.id}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  {currentMapOrder.etaMinutes} min · {currentMapOrder.distanceKm}{' '}
                  km
                </span>
              </div>

              {/* Interactive SVG City Route Map */}
              <div className="relative w-full h-56 rounded-3xl bg-emerald-50 border border-emerald-900/12 overflow-hidden flex flex-col justify-between p-4">
                <svg
                  viewBox="0 0 400 220"
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-label="Mapa de ruta entre origen y destino"
                >
                  {/* Subtle street grid */}
                  <g stroke="#059669" strokeOpacity="0.1" strokeWidth="2">
                    <line x1="0" y1="45" x2="400" y2="45" />
                    <line x1="0" y1="110" x2="400" y2="110" />
                    <line x1="0" y1="175" x2="400" y2="175" />
                    <line x1="80" y1="0" x2="80" y2="220" />
                    <line x1="200" y1="0" x2="200" y2="220" />
                    <line x1="320" y1="0" x2="320" y2="220" />
                  </g>

                  {/* Route path */}
                  <path
                    d="M 70 165 Q 150 160 200 105 T 330 55"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                  />

                  {/* Origin Marker */}
                  <circle cx="70" cy="165" r="10" fill="#064e3b" />
                  <circle cx="70" cy="165" r="4" fill="#ffffff" />

                  {/* Active Rider Position */}
                  <circle cx="200" cy="105" r="14" fill="#059669" />
                  <circle cx="200" cy="105" r="6" fill="#ffffff" />

                  {/* Destination Marker */}
                  <circle cx="330" cy="55" r="10" fill="#059669" />
                  <circle cx="330" cy="55" r="4" fill="#ffffff" />
                </svg>

                <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-emerald-950 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-emerald-900/10">
                  <span className="truncate">
                    Origen: {currentMapOrder.pickup}
                  </span>
                  <Navigation
                    className="w-4 h-4 text-emerald-600 shrink-0"
                    aria-hidden="true"
                  />
                </div>

                <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-emerald-950 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-emerald-900/10">
                  <span className="truncate">
                    Destino: {currentMapOrder.dropoff}
                  </span>
                  <span className="text-emerald-700 font-bold tabular-nums shrink-0 ml-2">
                    {currentMapOrder.priceFormatted}
                  </span>
                </div>
              </div>

              {/* Order Selector for Map */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-800">
                  Seleccionar pedido en el mapa
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {state.orders.map((order) => {
                    const isSelected = order.id === currentMapOrder.id;
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            activeOrderId: order.id,
                          }))
                        }
                        className={`w-full text-left p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-950 border-emerald-900/12 hover:bg-emerald-50/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-white' : 'text-emerald-950'
                            }`}
                          >
                            {order.id} · {order.title}
                          </p>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected
                                ? 'text-emerald-100'
                                : 'text-emerald-800/75'
                            }`}
                          >
                            {order.pickup} → {order.dropoff}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold tabular-nums shrink-0 ${
                            isSelected ? 'text-white' : 'text-emerald-700'
                          }`}
                        >
                          {order.etaMinutes} min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERFIL (Role Configuration & App Installation) */}
          {state.activeTab === 'perfil' && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-xl font-bold text-emerald-950">
                  Mi Perfil
                </h1>
                <p className="text-xs text-emerald-800/75">
                  Cambia entre Usuario y Motorizado cuando lo necesites
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50/70 border border-emerald-900/10 p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    {state.selectedRole === 'motorizado' ? (
                      <Bike className="w-7 h-7" aria-hidden="true" />
                    ) : (
                      <ShoppingBag className="w-7 h-7" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">
                      Rol actual en la aplicación
                    </p>
                    <h2 className="font-display text-lg font-bold text-emerald-950">
                      {activeRoleOption
                        ? activeRoleOption.title
                        : 'Sin rol seleccionado'}
                    </h2>
                    <p className="text-xs text-emerald-800/75">
                      {activeRoleOption
                        ? activeRoleOption.subtitle
                        : 'Elige Usuario o Motorizado abajo'}
                    </p>
                  </div>
                </div>

                {/* Role Switcher Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        selectedRole: 'usuario',
                        step: 'confirmed',
                      }));
                    }}
                    className={`h-11 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      state.selectedRole === 'usuario'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-900 border border-emerald-900/15 hover:bg-emerald-50'
                    }`}
                  >
                    {state.selectedRole === 'usuario' && (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Modo Usuario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        selectedRole: 'motorizado',
                        step: 'confirmed',
                      }));
                    }}
                    className={`h-11 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      state.selectedRole === 'motorizado'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-900 border border-emerald-900/15 hover:bg-emerald-50'
                    }`}
                  >
                    {state.selectedRole === 'motorizado' && (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Modo Motorizado</span>
                  </button>
                </div>
              </div>

              {/* PWA Install Section */}
              <div className="rounded-3xl bg-white border border-emerald-900/12 p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-emerald-950">
                  Experiencia como App Android
                </h3>
                <p className="text-xs text-emerald-900/75 leading-relaxed">
                  Instala VerdeGo en la pantalla de inicio de tu celular para
                  abrirla a pantalla completa sin la barra del navegador.
                </p>
                <PWAInstallButton />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <BottomNav
        activeTab={state.activeTab}
        onSelectTab={handleSelectTab}
        pendingOrdersCount={activeOrdersCount}
      />
    </div>
  );
}
