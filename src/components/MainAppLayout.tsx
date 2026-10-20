import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Bike,
  ShoppingBag,
  MapPin,
  Navigation,
  Store,
  Package,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import {
  ROLE_OPTIONS,
  SERVICE_OPTIONS,
  UserRole,
  AppTab,
  OnboardingState,
} from '../utils/onboarding';
import {
  AssignedDriverInfo,
  CreateCustomOrderInput,
  ORDER_STATUS_LABELS,
  formatPenCurrency,
} from '../utils/ordersStore';
import { MainBottomNavigation } from './MainBottomNavigation';
import { PWAInstallButton } from './PWAInstallButton';
import { ClientOrdersView } from './ClientOrdersView';
import { DriverOrdersView } from './DriverOrdersView';
import { MapboxView } from './MapboxView';

interface MainAppLayoutProps {
  state: OnboardingState;
  onSelectTab: (tab: AppTab) => void;
  onSelectRole: (role: UserRole) => void;
  onSelectDemoDriver: (driver: AssignedDriverInfo) => void;
  onCreateOrder: (input: CreateCustomOrderInput) => {
    success: boolean;
    error?: string;
  };
  onCancelOrder: (orderId: string) => { success: boolean; error?: string };
  onAcceptOrder: (orderId: string) => { success: boolean; error?: string };
  onAdvanceOrder: (orderId: string) => { success: boolean; error?: string };
  onSelectMapOrder: (orderId: string) => void;
  onResetDemoOrders: () => void;
  onLogout: () => void;
}

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  state,
  onSelectTab,
  onSelectRole,
  onSelectDemoDriver,
  onCreateOrder,
  onCancelOrder,
  onAcceptOrder,
  onAdvanceOrder,
  onSelectMapOrder,
  onResetDemoOrders,
  onLogout,
}) => {
  const activeRoleOption = state.selectedRole
    ? ROLE_OPTIONS[state.selectedRole]
    : ROLE_OPTIONS.usuario;

  const activeOrdersCount = state.orders.filter(
    (o) => o.status !== 'entregado' && o.status !== 'cancelado'
  ).length;

  const currentMapOrder =
    state.orders.find((o) => o.id === state.activeOrderId) || state.orders[0];

  const headerSubtitle: Record<AppTab, string> = {
    inicio: `Modo ${activeRoleOption.title} (Demo)`,
    pedidos:
      state.selectedRole === 'motorizado'
        ? `Entregas · ${state.activeDriver.name}`
        : 'Tus compras y encargos (Demo)',
    mapa: 'Ruta de recogida y destino',
    perfil: 'Cambio de rol y configuración',
  };

  return (
    <div
      data-testid="main-app-layout"
      className="app-viewport flex flex-col bg-[#FFFFFF] text-[#102F27] select-none"
    >
      {/* FIXED TOP APP HEADER */}
      <header className="shrink-0 z-30 bg-[#078F68] text-white px-4 pt-3 pb-3.5 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white text-[#078F68] flex items-center justify-center font-display font-bold text-base shadow-xs shrink-0">
              V
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
                  VerdeGo
                </span>
                <span className="hidden sm:inline text-[11px] font-medium text-[#EAF8F2] whitespace-nowrap shrink-0">
                  · {state.selectedRole === 'motorizado' ? 'Motorizado' : 'Cliente'}
                </span>
              </div>
              <p className="text-[11px] text-[#EAF8F2] truncate">
                {headerSubtitle[state.activeTab]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                onSelectRole(
                  state.selectedRole === 'motorizado' ? 'usuario' : 'motorizado'
                )
              }
              className="px-2.5 py-1.5 rounded-full bg-[#064B3C] hover:bg-[#064B3C]/90 text-white text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[34px] cursor-pointer"
            >
              {state.selectedRole === 'motorizado'
                ? 'Modo Cliente'
                : 'Modo Motorizado'}
            </button>
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
                      <span>Modo Demostración Local</span>
                    </div>
                    <h1 className="font-display text-xl font-bold text-[#102F27]">
                      {state.selectedRole === 'motorizado'
                        ? `Motorizado: ${state.activeDriver.name}`
                        : 'Panel de Cliente'}
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
                    <span>
                      {state.selectedRole === 'motorizado'
                        ? 'Gestionar Entregas'
                        : 'Mis Pedidos'}
                    </span>
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
                  Operaciones de demostración
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

          {/* TAB 2: PEDIDOS (ClientOrdersView vs DriverOrdersView) */}
          {state.activeTab === 'pedidos' && (
            <>
              {state.selectedRole === 'motorizado' ? (
                <DriverOrdersView
                  orders={state.orders}
                  activeDriver={state.activeDriver}
                  onSelectDemoDriver={onSelectDemoDriver}
                  onAcceptOrder={onAcceptOrder}
                  onAdvanceOrder={onAdvanceOrder}
                  onOpenOrderInMap={(orderId) => {
                    onSelectMapOrder(orderId);
                    onSelectTab('mapa');
                  }}
                />
              ) : (
                <ClientOrdersView
                  orders={state.orders}
                  onCreateOrder={onCreateOrder}
                  onCancelOrder={onCancelOrder}
                  onOpenOrderInMap={(orderId) => {
                    onSelectMapOrder(orderId);
                    onSelectTab('mapa');
                  }}
                />
              )}
            </>
          )}

          {/* TAB 3: MAPA CON MAPBOX 3D */}
          {state.activeTab === 'mapa' && currentMapOrder && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-[#102F27]">
                    Mapa 3D Mapbox (Puno)
                  </h1>
                  <p className="text-xs text-[#64877C]">
                    Pedido {currentMapOrder.id} ·{' '}
                    {ORDER_STATUS_LABELS[currentMapOrder.status]}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#078F68] tabular-nums">
                  {formatPenCurrency(currentMapOrder.totalAmount)}
                </span>
              </div>

              {/* Interactive Mapbox GL JS 3D Map */}
              <MapboxView activeOrder={currentMapOrder} />

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
                            {order.id} · {ORDER_STATUS_LABELS[order.status]}
                          </p>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? 'text-[#EAF8F2]' : 'text-[#64877C]'
                            }`}
                          >
                            {order.pickup.address} → {order.dropoff.address}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold tabular-nums shrink-0 ${
                            isSelected ? 'text-white' : 'text-[#078F68]'
                          }`}
                        >
                          {formatPenCurrency(order.totalAmount)}
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
                  Mi Perfil (Modo Demo)
                </h1>
                <p className="text-xs text-[#64877C]">
                  Alterna entre la vista de Cliente y de Motorizado para probar el
                  flujo completo
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
                      Vista activa
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onResetDemoOrders}
                  className="w-full h-11 px-4 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Restaurar pedidos demo</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full h-11 px-4 rounded-full bg-white border border-[#DCECE5] hover:bg-[#EAF8F2] text-[#064B3C] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Volver al onboarding</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <MainBottomNavigation
        activeTab={state.activeTab}
        onSelectTab={onSelectTab}
        pendingOrdersCount={activeOrdersCount}
      />
    </div>
  );
};
