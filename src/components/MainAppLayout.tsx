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
  FileText,
} from 'lucide-react';
import {
  ROLE_OPTIONS,
  SERVICE_OPTIONS,
  UserRole,
  AppTab,
  OnboardingState,
} from '../utils/onboarding';
import {
  DemoOrder,
  AssignedDriverInfo,
  DEMO_DRIVERS,
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
  onReviewOrder: (orderId: string) => void;
  onStartNavigation: (
    order: DemoOrder,
    targetType?: 'pickup' | 'dropoff'
  ) => void;
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
  onReviewOrder,
  onStartNavigation,
  onResetDemoOrders,
  onLogout,
}) => {
  const activeRoleOption = state.selectedRole
    ? ROLE_OPTIONS[state.selectedRole]
    : ROLE_OPTIONS.usuario;

  const activeOrdersCount = state.orders.filter(
    (o) => o.status !== 'entregado' && o.status !== 'cancelado'
  ).length;

  const availableOrders = state.orders.filter((o) => o.status === 'disponible');
  const myDriverOrders = state.orders.filter(
    (o) =>
      o.assignedDriver?.id === state.activeDriver.id &&
      o.status !== 'entregado' &&
      o.status !== 'cancelado'
  );

  // Kept intact for future reuse as requested
  const currentMapOrder =
    state.orders.find((o) => o.id === state.activeOrderId) || state.orders[0];

  const headerSubtitle: Record<AppTab, string> = {
    inicio:
      state.selectedRole === 'motorizado'
        ? `Panel de Pedidos · ${state.activeDriver.name}`
        : `Modo ${activeRoleOption.title} (Demo)`,
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
            <>
              {state.selectedRole === 'motorizado' ? (
                /* PANEL DE INICIO PARA MOTORIZADO: ESCOGER PEDIDOS Y PASAR A DATOS + NAVEGACIÓN 3D */
                <div className="space-y-5">
                  {/* Driver Header & Quick Switcher */}
                  <div className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#078F68] text-white flex items-center justify-center shrink-0">
                          <Bike className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#078F68]">
                            Panel de Inicio · Motorizado
                          </p>
                          <h1 className="font-display text-lg font-bold text-[#102F27] truncate">
                            {state.activeDriver.name}
                          </h1>
                          <p className="text-xs text-[#64877C]">
                            Placa: {state.activeDriver.vehiclePlate} · Puno
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {DEMO_DRIVERS.map((drv) => {
                        const isCurrent = drv.id === state.activeDriver.id;
                        return (
                          <button
                            key={drv.id}
                            type="button"
                            onClick={() => onSelectDemoDriver(drv)}
                            className={`h-9 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer truncate ${
                              isCurrent
                                ? 'bg-[#078F68] text-white'
                                : 'bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2]'
                            }`}
                          >
                            {drv.name.replace(' (Demo)', '')} ({drv.id})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION A: BOLSA DE PEDIDOS DISPONIBLES PARA ESCOGER */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-base font-bold text-[#102F27]">
                          Escoger pedido disponible ({availableOrders.length})
                        </h2>
                        <p className="text-xs text-[#64877C]">
                          Acepta un pedido de agente o tienda para revisar sus
                          datos e iniciar el GPS 3D
                        </p>
                      </div>
                    </div>

                    {availableOrders.length === 0 ? (
                      <div className="rounded-3xl bg-white border border-[#DCECE5] p-5 text-center space-y-2">
                        <p className="text-xs text-[#64877C]">
                          Todos los pedidos de demostración han sido aceptados.
                        </p>
                        <button
                          type="button"
                          onClick={onResetDemoOrders}
                          className="h-9 px-4 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Cargar nuevos pedidos demo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableOrders.map((order) => {
                          const isStore = order.type === 'compra_negocio';
                          const originTitle =
                            order.businessName ||
                            (isStore
                              ? 'Tienda / Comercio en Puno'
                              : 'Agente / Encargo en Puno');

                          return (
                            <div
                              key={order.id}
                              className="rounded-3xl bg-white border border-[#DCECE5] hover:border-[#078F68] p-4 space-y-3.5 shadow-xs transition-all"
                            >
                              {/* Card Header: Origin Store/Agent & Price */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-2xl bg-[#EAF8F2] text-[#078F68] flex items-center justify-center shrink-0 mt-0.5">
                                    {isStore ? (
                                      <Store className="w-5 h-5" />
                                    ) : (
                                      <Package className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs text-[#64877C]">
                                      <span className="font-bold text-[#078F68]">
                                        {order.id}
                                      </span>
                                      <span aria-hidden="true">·</span>
                                      <span>
                                        {isStore
                                          ? 'Compra en tienda'
                                          : 'Envío de agente'}
                                      </span>
                                    </div>
                                    <h3 className="font-display text-sm font-bold text-[#102F27] truncate mt-0.5">
                                      {originTitle}
                                    </h3>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <p className="font-display text-base font-extrabold text-[#078F68] tabular-nums">
                                    {formatPenCurrency(order.totalAmount)}
                                  </p>
                                  <p className="text-[11px] text-[#64877C] tabular-nums">
                                    Envío: {formatPenCurrency(order.demoDeliveryFee)}
                                  </p>
                                </div>
                              </div>

                              {/* Origin -> Destination Route Box */}
                              <div className="rounded-2xl bg-[#F8FCFA] border border-[#DCECE5] p-3 space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-[#078F68] shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-[#102F27]">
                                      De (Recogida):{' '}
                                    </span>
                                    <span className="text-[#102F27]">
                                      {order.pickup.address}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <Navigation className="w-4 h-4 text-[#9333EA] shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-[#102F27]">
                                      A (Entrega):{' '}
                                    </span>
                                    <span className="text-[#102F27]">
                                      {order.dropoff.address}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Brief Content Summary */}
                              <p className="text-xs text-[#64877C] truncate">
                                {isStore && order.items
                                  ? `Pedido: ${order.items
                                      .map((i) => `${i.quantity}x ${i.name}`)
                                      .join(', ')}`
                                  : `Encargo: ${order.customDescription}`}
                              </p>

                              {/* Accept Action -> Automatically opens Order Detail Screen */}
                              <button
                                type="button"
                                onClick={() => onAcceptOrder(order.id)}
                                className="w-full h-11 px-4 rounded-2xl bg-[#078F68] hover:bg-[#064B3C] active:scale-[0.99] text-white font-display text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                <span>Aceptar pedido y revisar datos</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* SECTION B: MIS PEDIDOS ACEPTADOS / EN CURSO */}
                  {myDriverOrders.length > 0 && (
                    <section className="space-y-3 pt-1">
                      <h2 className="font-display text-base font-bold text-[#102F27]">
                        Tus entregas activas ({myDriverOrders.length})
                      </h2>
                      <div className="space-y-3">
                        {myDriverOrders.map((order) => (
                          <div
                            key={order.id}
                            className="rounded-3xl bg-[#EAF8F2]/60 border-2 border-[#078F68]/40 p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#078F68]">
                                  <span>{order.id}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{ORDER_STATUS_LABELS[order.status]}</span>
                                </div>
                                <h3 className="font-display text-sm font-bold text-[#102F27] truncate mt-0.5">
                                  {order.businessName || order.customDescription}
                                </h3>
                              </div>
                              <span className="font-display text-sm font-extrabold text-[#078F68] tabular-nums shrink-0">
                                {formatPenCurrency(order.totalAmount)}
                              </span>
                            </div>

                            <div className="text-xs text-[#64877C] space-y-1">
                              <p className="truncate">
                                <strong className="text-[#102F27]">De:</strong>{' '}
                                {order.pickup.address}
                              </p>
                              <p className="truncate">
                                <strong className="text-[#102F27]">A:</strong>{' '}
                                {order.dropoff.address}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => onReviewOrder(order.id)}
                                className="h-10 px-3 rounded-xl bg-white border border-[#DCECE5] hover:bg-[#EAF8F2] text-[#102F27] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#078F68]" />
                                <span>Ver datos</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  onStartNavigation(
                                    order,
                                    order.status === 'recogido' ||
                                      order.status === 'en_camino_cliente'
                                      ? 'dropoff'
                                      : 'pickup'
                                  )
                                }
                                className="h-10 px-3 rounded-xl bg-[#9333EA] hover:bg-[#7E22CE] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Navegar 3D</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                /* PANEL DE INICIO PARA CLIENTE */
                <div className="space-y-4">
                  <div className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-5 space-y-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-[#078F68] text-white flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-7 h-7" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#078F68]">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Modo Demostración Local</span>
                        </div>
                        <h1 className="font-display text-xl font-bold text-[#102F27]">
                          Panel de Cliente
                        </h1>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#64877C] leading-relaxed">
                      {activeRoleOption.summaryText}
                    </p>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectTab('pedidos')}
                        className="w-full h-11 px-4 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Ver y crear mis pedidos</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
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
            </>
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
                    onReviewOrder(orderId);
                  }}
                  onStartNavigation={(orderId) => {
                    const target = state.orders.find((o) => o.id === orderId);
                    if (target) {
                      onStartNavigation(
                        target,
                        target.status === 'recogido' ||
                          target.status === 'en_camino_cliente'
                          ? 'dropoff'
                          : 'pickup'
                      );
                    }
                  }}
                />
              ) : (
                <ClientOrdersView
                  orders={state.orders}
                  onCreateOrder={onCreateOrder}
                  onCancelOrder={onCancelOrder}
                  onOpenOrderInMap={(orderId) => {
                    onSelectMapOrder(orderId);
                  }}
                  onStartNavigation={(orderId) => {
                    const target = state.orders.find((o) => o.id === orderId);
                    if (target) {
                      onStartNavigation(target, 'dropoff');
                    }
                  }}
                />
              )}
            </>
          )}

          {/* REUSABLE MAPBOX 3D MODULE (Preserved in codebase for future reuse) */}
          {state.activeTab === 'mapa' && currentMapOrder && (
            <div className="space-y-3.5">
              <MapboxView
                activeOrder={currentMapOrder}
                onStartNavigation={(ord) =>
                  onStartNavigation(
                    ord,
                    ord.status === 'en_camino_cliente' ? 'dropoff' : 'pickup'
                  )
                }
              />
            </div>
          )}

          {/* TAB 3: PERFIL */}
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

      {/* FIXED BOTTOM NAVIGATION BAR (3 TABS: INICIO, PEDIDOS, PERFIL) */}
      <MainBottomNavigation
        activeTab={state.activeTab}
        onSelectTab={onSelectTab}
        pendingOrdersCount={activeOrdersCount}
      />
    </div>
  );
};
