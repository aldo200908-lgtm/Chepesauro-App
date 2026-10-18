import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Bike,
  ShoppingBag,
  MapPin,
  Navigation,
  Clock,
  Plus,
  Store,
  Package,
  LogOut,
} from 'lucide-react';
import {
  ROLE_OPTIONS,
  SERVICE_OPTIONS,
  UserRole,
  AppTab,
  OnboardingState,
} from '../utils/onboarding';
import { MainBottomNavigation } from './MainBottomNavigation';
import { PWAInstallButton } from './PWAInstallButton';

interface MainAppLayoutProps {
  state: OnboardingState;
  onSelectTab: (tab: AppTab) => void;
  onSelectRole: (role: UserRole) => void;
  onAdvanceOrder: (orderId: string) => void;
  onCreateOrder: (pickup: string, dropoff: string) => void;
  onSelectMapOrder: (orderId: string) => void;
  onLogout: () => void;
}

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  state,
  onSelectTab,
  onSelectRole,
  onAdvanceOrder,
  onCreateOrder,
  onSelectMapOrder,
  onLogout,
}) => {
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [formError, setFormError] = useState('');

  const activeRoleOption = state.selectedRole
    ? ROLE_OPTIONS[state.selectedRole]
    : ROLE_OPTIONS.usuario;

  const activeOrdersCount = state.orders.filter(
    (o) => o.status !== 'entregado'
  ).length;

  const currentMapOrder =
    state.orders.find((o) => o.id === state.activeOrderId) || state.orders[0];

  const headerSubtitle: Record<AppTab, string> = {
    inicio: `Modo ${activeRoleOption.title}`,
    pedidos: 'Gestión de envíos en tiempo real',
    mapa: 'Cobertura y ruta activa en ciudad',
    perfil: 'Configuración de perfil y aplicación',
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupInput.trim() || !dropoffInput.trim()) {
      setFormError('Ingresa la dirección de recogida y de entrega.');
      return;
    }
    setFormError('');
    onCreateOrder(pickupInput, dropoffInput);
    setPickupInput('');
    setDropoffInput('');
  };

  return (
    <div
      data-testid="main-app-layout"
      className="app-viewport flex flex-col bg-[#FFFFFF] text-[#102F27] select-none"
    >
      {/* FIXED TOP APP HEADER */}
      <header className="shrink-0 z-30 bg-[#078F68] text-white px-4 pt-3 pb-3.5 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white text-[#078F68] flex items-center justify-center font-display font-bold text-base shadow-xs shrink-0">
              V
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
                  VerdeGo
                </span>
                <span className="text-xs font-medium text-[#EAF8F2] whitespace-nowrap shrink-0">
                  · {state.selectedRole === 'motorizado' ? 'Motorizado' : 'Cliente'}
                </span>
              </div>
              <p className="text-[11px] text-[#EAF8F2] truncate">
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
          {/* TAB 1: INICIO */}
          {state.activeTab === 'inicio' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-5 space-y-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#078F68] text-white flex items-center justify-center shrink-0">
                    {state.selectedRole === 'motorizado' ? (
                      <Bike className="w-7 h-7" aria-hidden="true" />
                    ) : (
                      <ShoppingBag className="w-7 h-7" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#078F68]">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Sesión activa</span>
                    </div>
                    <h1 className="font-display text-xl font-bold text-[#102F27]">
                      {state.selectedRole === 'motorizado'
                        ? 'Panel de Motorizado'
                        : 'Hola, Cliente'}
                    </h1>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#64877C] leading-relaxed">
                  {activeRoleOption.summaryText}
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectTab('pedidos')}
                    className="h-11 px-4 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Ver Pedidos</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTab('mapa')}
                    className="h-11 px-4 rounded-full bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#078F68]" aria-hidden="true" />
                    <span>Abrir Mapa</span>
                  </button>
                </div>
              </div>

              {/* Services Quick Access */}
              <div className="space-y-2.5">
                <h2 className="font-display text-sm font-bold text-[#102F27]">
                  Servicios disponibles
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {SERVICE_OPTIONS.map((service) => {
                    const Icon = service.id === 'comprar' ? Store : Package;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => onSelectTab('pedidos')}
                        className="w-full text-left rounded-2xl bg-white border border-[#DCECE5] hover:border-[#078F68]/50 p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-[#EAF8F2] text-[#078F68] flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-display text-sm font-bold text-[#102F27] truncate">
                              {service.title}
                            </p>
                            <p className="text-xs text-[#64877C] truncate">
                              {service.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className="w-4 h-4 text-[#078F68] shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEDIDOS */}
          {state.activeTab === 'pedidos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-[#102F27]">
                    Mis Pedidos
                  </h1>
                  <p className="text-xs text-[#64877C]">
                    {state.selectedRole === 'motorizado'
                      ? 'Órdenes asignadas y disponibles en tu zona'
                      : 'Solicita y sigue tus envíos en curso'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#078F68] tabular-nums">
                  {activeOrdersCount} activos
                </span>
              </div>

              <form
                onSubmit={handleCreateSubmit}
                className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-4 space-y-3"
              >
                <p className="text-xs font-bold text-[#102F27]">
                  Nuevo envío rápido
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="pickup-input"
                      className="block text-[11px] font-medium text-[#064B3C] mb-1"
                    >
                      Punto de recogida
                    </label>
                    <input
                      id="pickup-input"
                      type="text"
                      value={pickupInput}
                      onChange={(e) => setPickupInput(e.target.value)}
                      placeholder="Ej. Av. Central 320"
                      className="w-full h-10 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dropoff-input"
                      className="block text-[11px] font-medium text-[#064B3C] mb-1"
                    >
                      Punto de entrega
                    </label>
                    <input
                      id="dropoff-input"
                      type="text"
                      value={dropoffInput}
                      onChange={(e) => setDropoffInput(e.target.value)}
                      placeholder="Ej. Calle Norte 140"
                      className="w-full h-10 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
                    />
                  </div>
                </div>
                {formError && (
                  <p className="text-xs font-medium text-red-600">{formError}</p>
                )}
                <button
                  type="submit"
                  className="w-full h-11 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Crear pedido ahora</span>
                </button>
              </form>

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
                      className="rounded-3xl bg-white border border-[#DCECE5] p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-[#078F68] flex items-center gap-1.5 tabular-nums">
                            <span>{order.id}</span>
                            <span aria-hidden="true">·</span>
                            <span>{statusLabel}</span>
                          </div>
                          <h2 className="font-display text-sm font-bold text-[#102F27] mt-0.5">
                            {order.title}
                          </h2>
                        </div>
                        <span className="font-display text-sm font-bold text-[#078F68] tabular-nums">
                          {order.priceFormatted}
                        </span>
                      </div>

                      <div className="text-xs text-[#64877C] space-y-1">
                        <p className="truncate">
                          <strong className="font-semibold text-[#102F27]">
                            Origen:
                          </strong>{' '}
                          {order.pickup}
                        </p>
                        <p className="truncate">
                          <strong className="font-semibold text-[#102F27]">
                            Destino:
                          </strong>{' '}
                          {order.dropoff}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#DCECE5] flex items-center justify-between gap-2">
                        <div className="text-[11px] text-[#64877C] tabular-nums flex items-center gap-1 whitespace-nowrap shrink-0">
                          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{order.etaMinutes} min</span>
                          <span aria-hidden="true">·</span>
                          <span>{order.distanceKm} km</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMapOrder(order.id);
                              onSelectTab('mapa');
                            }}
                            className="h-9 px-3 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Mapa
                          </button>

                          <button
                            type="button"
                            onClick={() => onAdvanceOrder(order.id)}
                            className="h-9 px-3.5 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

          {/* TAB 3: MAPA */}
          {state.activeTab === 'mapa' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-[#102F27]">
                    Mapa de Ruta
                  </h1>
                  <p className="text-xs text-[#64877C]">
                    Seguimiento activo del envío {currentMapOrder.id}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#078F68] tabular-nums">
                  {currentMapOrder.etaMinutes} min · {currentMapOrder.distanceKm}{' '}
                  km
                </span>
              </div>

              <div className="relative w-full h-56 rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] overflow-hidden flex flex-col justify-between p-4">
                <svg
                  viewBox="0 0 400 220"
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-label="Mapa de ruta entre origen y destino"
                >
                  <g stroke="#078F68" strokeOpacity="0.12" strokeWidth="2">
                    <line x1="0" y1="45" x2="400" y2="45" />
                    <line x1="0" y1="110" x2="400" y2="110" />
                    <line x1="0" y1="175" x2="400" y2="175" />
                    <line x1="80" y1="0" x2="80" y2="220" />
                    <line x1="200" y1="0" x2="200" y2="220" />
                    <line x1="320" y1="0" x2="320" y2="220" />
                  </g>

                  <path
                    d="M 70 165 Q 150 160 200 105 T 330 55"
                    fill="none"
                    stroke="#078F68"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                  />

                  <circle cx="70" cy="165" r="10" fill="#064B3C" />
                  <circle cx="70" cy="165" r="4" fill="#FFFFFF" />

                  <circle cx="200" cy="105" r="14" fill="#078F68" />
                  <circle cx="200" cy="105" r="6" fill="#FFFFFF" />

                  <circle cx="330" cy="55" r="10" fill="#078F68" />
                  <circle cx="330" cy="55" r="4" fill="#FFFFFF" />
                </svg>

                <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-[#102F27] bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-[#DCECE5]">
                  <span className="truncate">
                    Origen: {currentMapOrder.pickup}
                  </span>
                  <Navigation
                    className="w-4 h-4 text-[#078F68] shrink-0"
                    aria-hidden="true"
                  />
                </div>

                <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-[#102F27] bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-[#DCECE5]">
                  <span className="truncate">
                    Destino: {currentMapOrder.dropoff}
                  </span>
                  <span className="text-[#078F68] font-bold tabular-nums shrink-0 ml-2">
                    {currentMapOrder.priceFormatted}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#064B3C]">
                  Seleccionar pedido en el mapa
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {state.orders.map((order) => {
                    const isSelected = order.id === currentMapOrder.id;
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => onSelectMapOrder(order.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-[#078F68] text-white border-[#078F68]'
                            : 'bg-white text-[#102F27] border-[#DCECE5] hover:bg-[#EAF8F2]/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-white' : 'text-[#102F27]'
                            }`}
                          >
                            {order.id} · {order.title}
                          </p>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? 'text-[#EAF8F2]' : 'text-[#64877C]'
                            }`}
                          >
                            {order.pickup} → {order.dropoff}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold tabular-nums shrink-0 ${
                            isSelected ? 'text-white' : 'text-[#078F68]'
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

          {/* TAB 4: PERFIL */}
          {state.activeTab === 'perfil' && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-xl font-bold text-[#102F27]">
                  Mi Perfil
                </h1>
                <p className="text-xs text-[#64877C]">
                  Configuración de cuenta y bienvenida
                </p>
              </div>

              <div className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#078F68] text-white flex items-center justify-center shrink-0">
                    {state.selectedRole === 'motorizado' ? (
                      <Bike className="w-7 h-7" aria-hidden="true" />
                    ) : (
                      <ShoppingBag className="w-7 h-7" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#078F68]">
                      Perfil actual
                    </p>
                    <h2 className="font-display text-lg font-bold text-[#102F27]">
                      {activeRoleOption.title}
                    </h2>
                    <p className="text-xs text-[#64877C]">
                      {activeRoleOption.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectRole('usuario')}
                    className={`h-11 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      state.selectedRole === 'usuario'
                        ? 'bg-[#078F68] text-white'
                        : 'bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2]'
                    }`}
                  >
                    <span>Soy cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRole('motorizado')}
                    className={`h-11 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      state.selectedRole === 'motorizado'
                        ? 'bg-[#078F68] text-white'
                        : 'bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2]'
                    }`}
                  >
                    <span>Soy motorizado</span>
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-[#DCECE5] p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-[#102F27]">
                  Instalar como aplicación Android
                </h3>
                <p className="text-xs text-[#64877C] leading-relaxed">
                  Instala VerdeGo en la pantalla de inicio de tu celular para
                  abrirla a pantalla completa sin la barra del navegador.
                </p>
                <PWAInstallButton />
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full h-12 px-5 rounded-full bg-white border border-[#DCECE5] hover:bg-[#EAF8F2] text-[#064B3C] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Cerrar sesión y volver al onboarding</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR (Only rendered in MainAppLayout!) */}
      <MainBottomNavigation
        activeTab={state.activeTab}
        onSelectTab={onSelectTab}
        pendingOrdersCount={activeOrdersCount}
      />
    </div>
  );
};
