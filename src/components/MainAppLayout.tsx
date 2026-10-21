import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Drawer } from 'vaul';
import {
  ArrowRight,
  CheckCircle,
  Motorcycle,
  ShoppingBagOpen,
  MapPinLine,
  NavigationArrow,
  Storefront,
  Package,
  SignOut,
  ArrowCounterClockwise,
  FileText,
  Eye,
  CreditCard,
  Footprints,
  X,
} from '@phosphor-icons/react';
import {
  ROLE_OPTIONS,
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
import {
  calculateDistanceMeters,
  resolveVehicularAccessPoint,
} from '../utils/mapboxDirections';
import { MainBottomNavigation } from './MainBottomNavigation';
import { PWAInstallButton } from './PWAInstallButton';
import { ClientOrdersView } from './ClientOrdersView';
import { DriverOrdersView } from './DriverOrdersView';
import { MapboxView } from './MapboxView';
import { ClientHomeScreen } from './ClientHomeScreen';
import logoUrl from '../assets/chepesaurio-logo.png';

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
  const [quickPreviewOrder, setQuickPreviewOrder] = useState<DemoOrder | null>(
    null
  );

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

  const currentMapOrder =
    state.orders.find((o) => o.id === state.activeOrderId) || state.orders[0];

  const isClientHome =
    state.selectedRole !== 'motorizado' && state.activeTab === 'inicio';

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
      className={`app-viewport flex flex-col select-none ${
        isClientHome
          ? 'vg-light-canvas'
          : 'vg-dark-canvas text-[#F6F3E6]'
      }`}
    >
      {/* FIXED TOP APP HEADER — RESTRAINED DARK GLASS ARCHITECTURE */}
      <header className={`${isClientHome ? 'hidden' : ''} shrink-0 z-30 vg-glass-restrained border-b border-white/[0.08] px-4 pt-3 pb-3`}>
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src={logoUrl} alt="" className="w-7 h-7 object-contain" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold tracking-tight text-[#F6F3E6] whitespace-nowrap shrink-0">
                  Chepesaurio
                </span>
                <span className="hidden sm:inline text-[11px] font-semibold text-[#86C77A] whitespace-nowrap shrink-0">
                  · {state.selectedRole === 'motorizado' ? 'Motorizado' : 'Cliente'}
                </span>
              </div>
              <p className="text-[11px] text-[#A9BDB0] truncate">
                {headerSubtitle[state.activeTab]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                onSelectRole(
                  state.selectedRole === 'motorizado' ? 'usuario' : 'motorizado'
                )
              }
              className="px-3.5 py-2 rounded-full bg-[#1A3322] hover:bg-[#21402B] border border-white/10 text-[#F6F3E6] text-xs font-semibold transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 min-h-[44px] inline-flex items-center gap-1.5 cursor-pointer"
            >
              {state.selectedRole === 'motorizado' ? (
                <>
                  <ShoppingBagOpen
                    weight="duotone"
                    className="w-3.5 h-3.5 text-[#86C77A]"
                  />
                  <span>Modo Cliente</span>
                </>
              ) : (
                <>
                  <Motorcycle
                    weight="duotone"
                    className="w-3.5 h-3.5 text-[#86C77A]"
                  />
                  <span>Modo Motorizado</span>
                </>
              )}
            </button>
            <PWAInstallButton compact />
          </div>
        </div>
      </header>

      {/* INDEPENDENT SCROLLABLE CENTER AREA */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden pb-24">
        <div className="max-w-lg mx-auto px-4 py-4">
          <AnimatePresence mode="wait" initial={false}>
            {/* TAB 1: INICIO */}
            {state.activeTab === 'inicio' && (
              <motion.div
                key={`inicio-${state.selectedRole}`}
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                {state.selectedRole === 'motorizado' ? (
                  /* PANEL DE INICIO PARA MOTORIZADO: ESCOGER PEDIDOS Y PASAR A DATOS + NAVEGACIÓN 3D */
                  <div className="space-y-5">
                    {/* Driver Header & Quick Switcher */}
                    <div className="vg-card-hero p-5 space-y-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-[#6DB35F] text-[#10230F] flex items-center justify-center shrink-0">
                            <Motorcycle
                              weight="fill"
                              className="w-6 h-6"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#86C77A]">
                              Unidad activa · Puno
                            </p>
                            <h1 className="font-display text-lg font-bold text-[#F6F3E6] truncate">
                              {state.activeDriver.name}
                            </h1>
                            <p className="text-xs font-mono text-[#A9BDB0] tabular-nums">
                              Placa: {state.activeDriver.vehiclePlate} · ID:{' '}
                              {state.activeDriver.id}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3 border-l border-white/[0.06]">
                          <span className="block text-[10px] font-semibold text-[#A9BDB0]">
                            Disponibles
                          </span>
                          <span className="font-display text-xl font-extrabold text-[#86C77A] tabular-nums">
                            {availableOrders.length}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
                        {DEMO_DRIVERS.map((drv) => {
                          const isCurrent = drv.id === state.activeDriver.id;
                          return (
                            <button
                              key={drv.id}
                              type="button"
                              aria-pressed={isCurrent}
                              onClick={() => onSelectDemoDriver(drv)}
                              className={`h-11 px-3 rounded-full text-xs font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer truncate ${
                                isCurrent
                                  ? 'bg-[#244A30] text-[#86C77A] border border-[#86C77A]'
                                  : 'bg-[#1A3322] text-[#A9BDB0] border border-white/[0.06] hover:text-[#F6F3E6]'
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
                      <div className="flex items-baseline justify-between">
                        <div>
                          <h2 className="font-display text-base font-bold text-[#F6F3E6]">
                            Escoger pedido disponible ({availableOrders.length})
                          </h2>
                          <p className="text-xs text-[#A9BDB0]">
                            Acepta un pedido de agente o tienda para revisar sus
                            datos e iniciar el GPS 3D
                          </p>
                        </div>
                      </div>

                      {availableOrders.length === 0 ? (
                        <div className="rounded-[28px] vg-surface-flat p-6 text-center space-y-3">
                          <div className="w-11 h-11 rounded-full bg-[#1A3322] border border-white/10 text-[#86C77A] flex items-center justify-center mx-auto">
                            <CheckCircle weight="duotone" className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-[#F6F3E6]">
                            Bolsa de pedidos al día
                          </p>
                          <p className="text-xs text-[#A9BDB0]">
                            Todos los pedidos de demostración han sido aceptados.
                          </p>
                          <button
                            type="button"
                            onClick={onResetDemoOrders}
                            className="h-11 px-4 rounded-full bg-[#1A3322] hover:bg-[#21402B] border border-white/10 text-[#F6F3E6] text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                          >
                            <ArrowCounterClockwise
                              weight="bold"
                              className="w-3.5 h-3.5 text-[#86C77A]"
                            />
                            <span>Cargar nuevos pedidos demo</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableOrders.map((order, idx) => {
                            const isStore = order.type === 'compra_negocio';
                            const originTitle =
                              order.businessName ||
                              (isStore
                                ? 'Tienda / Comercio en Puno'
                                : 'Agente / Encargo en Puno');

                            const distanceKm =
                              order.pickup.coordinates &&
                              order.dropoff.coordinates
                                ? (
                                    calculateDistanceMeters(
                                      order.pickup.coordinates,
                                      order.dropoff.coordinates
                                    ) / 1000
                                  ).toFixed(1)
                                : '1.4';

                            return (
                              <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                  duration: 0.5,
                                  delay: 0.08 + idx * 0.07,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="vg-card-interactive rounded-[28px] p-4 space-y-3.5"
                              >
                                {/* Card Header: Origin Store/Agent & Price */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-[#1A3322] border border-white/[0.08] text-[#86C77A] flex items-center justify-center shrink-0 mt-0.5">
                                      {isStore ? (
                                        <Storefront
                                          weight="duotone"
                                          className="w-5 h-5"
                                        />
                                      ) : (
                                        <Package
                                          weight="duotone"
                                          className="w-5 h-5"
                                        />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A9BDB0] tabular-nums">
                                        <span className="font-bold text-[#86C77A]">
                                          {order.id}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span>
                                          {isStore
                                            ? 'Compra en tienda'
                                            : 'Envío de agente'}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span>~{distanceKm} km</span>
                                      </div>
                                      <h3 className="font-display text-[15px] font-bold text-[#F6F3E6] truncate mt-0.5">
                                        {originTitle}
                                      </h3>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <p className="font-display text-base font-extrabold text-[#86C77A] tabular-nums">
                                      {formatPenCurrency(order.totalAmount)}
                                    </p>
                                    <p className="text-[11px] font-mono text-[#A9BDB0] tabular-nums">
                                      Envío:{' '}
                                      {formatPenCurrency(order.demoDeliveryFee)}
                                    </p>
                                  </div>
                                </div>

                                {/* Origin -> Destination Route Box */}
                                <div className="rounded-xl bg-[#1A3322] border border-white/[0.06] p-3 space-y-2 text-xs">
                                  <div className="flex items-start gap-2">
                                    <MapPinLine
                                      weight="duotone"
                                      className="w-4 h-4 text-[#86C77A] shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-semibold text-[#A9BDB0]">
                                        De (Recogida):{' '}
                                      </span>
                                      <span className="text-[#F6F3E6]">
                                        {order.pickup.address}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <NavigationArrow
                                      weight="duotone"
                                      className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-semibold text-[#A9BDB0]">
                                        A (Entrega):{' '}
                                      </span>
                                      <span className="text-[#F6F3E6]">
                                        {order.dropoff.address}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Brief Content Summary */}
                                <p className="text-xs text-[#A9BDB0] truncate">
                                  {isStore && order.items
                                    ? `Pedido: ${order.items
                                        .map((i) => `${i.quantity}x ${i.name}`)
                                        .join(', ')}`
                                    : `Encargo: ${order.customDescription}`}
                                </p>

                                {/* Action Row: Quick Bottom Sheet Preview + Primary Accept CTA */}
                                <div className="flex items-center gap-2 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setQuickPreviewOrder(order)}
                                    className="h-11 px-3.5 rounded-full bg-[#1A3322] hover:bg-[#21402B] border border-white/10 text-[#CFE0D3] font-display text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] shrink-0 cursor-pointer"
                                  >
                                    <Eye
                                      weight="duotone"
                                      className="w-4 h-4 text-[#86C77A]"
                                    />
                                    <span>Vista rápida</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onAcceptOrder(order.id)}
                                    className="flex-1 h-11 px-4 rounded-full vg-btn-primary font-display text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <span>Aceptar pedido y revisar datos</span>
                                    <ArrowRight
                                      weight="bold"
                                      className="w-4 h-4 shrink-0"
                                    />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {/* SECTION B: MIS PEDIDOS ACEPTADOS / EN CURSO */}
                    {myDriverOrders.length > 0 && (
                      <section className="space-y-3 pt-1">
                        <h2 className="font-display text-base font-bold text-[#F6F3E6]">
                          Tus entregas activas ({myDriverOrders.length})
                        </h2>
                        <div className="space-y-3">
                          {myDriverOrders.map((order) => (
                            <div
                              key={order.id}
                              className="rounded-2xl bg-[#244A30] border border-[#86C77A]/50 p-4 space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#86C77A] tabular-nums">
                                    <span>{order.id}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                      {ORDER_STATUS_LABELS[order.status]}
                                    </span>
                                  </div>
                                  <h3 className="font-display text-sm font-bold text-[#F6F3E6] truncate mt-0.5">
                                    {order.businessName ||
                                      order.customDescription}
                                  </h3>
                                </div>
                                <span className="font-display text-sm font-extrabold text-[#86C77A] tabular-nums shrink-0">
                                  {formatPenCurrency(order.totalAmount)}
                                </span>
                              </div>

                              <div className="text-xs text-[#CFE0D3] space-y-1">
                                <p className="truncate">
                                  <strong className="text-[#A9BDB0]">
                                    De:
                                  </strong>{' '}
                                  {order.pickup.address}
                                </p>
                                <p className="truncate">
                                  <strong className="text-[#A9BDB0]">A:</strong>{' '}
                                  {order.dropoff.address}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => onReviewOrder(order.id)}
                                  className="h-11 px-3 rounded-full bg-[#0F2016] border border-white/10 hover:bg-[#1A3322] text-[#F6F3E6] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                                >
                                  <FileText
                                    weight="duotone"
                                    className="w-4 h-4 text-[#86C77A]"
                                    aria-hidden="true"
                                  />
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
                                  className="h-11 px-3 rounded-full vg-btn-primary text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <NavigationArrow
                                    weight="fill"
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
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
                  /* PANEL DE INICIO PARA CLIENTE (estilo de la referencia) */
                  <ClientHomeScreen onOpenOrders={() => onSelectTab('pedidos')} />
                )}
              </motion.div>
            )}

            {/* TAB 2: PEDIDOS (ClientOrdersView vs DriverOrdersView) */}
            {state.activeTab === 'pedidos' && (
              <motion.div
                key={`pedidos-${state.selectedRole}`}
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
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
              </motion.div>
            )}

            {/* REUSABLE MAPBOX 3D MODULE */}
            {state.activeTab === 'mapa' && currentMapOrder && (
              <motion.div
                key="mapa"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                <MapboxView
                  activeOrder={currentMapOrder}
                  onStartNavigation={(ord) =>
                    onStartNavigation(
                      ord,
                      ord.status === 'en_camino_cliente' ? 'dropoff' : 'pickup'
                    )
                  }
                />
              </motion.div>
            )}

            {/* TAB 3: PERFIL */}
            {state.activeTab === 'perfil' && (
              <motion.div
                key="perfil"
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div>
                  <h1 className="font-display text-xl font-bold text-[#F6F3E6]">
                    Mi Perfil (Modo Demo)
                  </h1>
                  <p className="text-xs text-[#A9BDB0]">
                    Alterna entre la vista de Cliente y de Motorizado para
                    probar el flujo completo
                  </p>
                </div>

                <div className="rounded-[28px] vg-surface-flat p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#6DB35F] text-[#10230F] flex items-center justify-center shrink-0">
                      {state.selectedRole === 'motorizado' ? (
                        <Motorcycle
                          weight="fill"
                          className="w-6 h-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <ShoppingBagOpen
                          weight="fill"
                          className="w-6 h-6"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#86C77A]">
                        Vista activa
                      </p>
                      <h2 className="font-display text-lg font-bold text-[#F6F3E6]">
                        {activeRoleOption.title}
                      </h2>
                      <p className="text-xs text-[#A9BDB0]">
                        {activeRoleOption.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectRole('usuario')}
                      className={`h-11 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
                        state.selectedRole === 'usuario'
                          ? 'bg-[#244A30] text-[#86C77A] border border-[#86C77A]'
                          : 'bg-[#1A3322] text-[#A9BDB0] border border-white/[0.06] hover:text-[#F6F3E6]'
                      }`}
                    >
                      <span>Soy cliente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectRole('motorizado')}
                      className={`h-11 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
                        state.selectedRole === 'motorizado'
                          ? 'bg-[#244A30] text-[#86C77A] border border-[#86C77A]'
                          : 'bg-[#1A3322] text-[#A9BDB0] border border-white/[0.06] hover:text-[#F6F3E6]'
                      }`}
                    >
                      <span>Soy motorizado</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] vg-surface-flat p-5 space-y-3">
                  <h3 className="font-display text-sm font-bold text-[#F6F3E6]">
                    Instalar como aplicación Android
                  </h3>
                  <p className="text-xs text-[#A9BDB0] leading-relaxed">
                    Instala Chepesaurio en la pantalla de inicio de tu celular para
                    abrirla a pantalla completa sin la barra del navegador.
                  </p>
                  <PWAInstallButton />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onResetDemoOrders}
                    className="w-full h-11 px-4 rounded-full bg-[#1A3322] hover:bg-[#21402B] border border-white/10 text-[#F6F3E6] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                  >
                    <ArrowCounterClockwise
                      weight="bold"
                      className="w-4 h-4 text-[#86C77A]"
                      aria-hidden="true"
                    />
                    <span>Restaurar pedidos demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full h-11 px-4 rounded-full bg-[#0F2016] border border-white/10 hover:bg-[#1A3322] text-[#A9BDB0] hover:text-[#F6F3E6] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                  >
                    <SignOut
                      weight="bold"
                      className="w-4 h-4"
                      aria-hidden="true"
                    />
                    <span>Volver al onboarding</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* VAUL TACTILE BOTTOM SHEET FOR QUICK ORDER PREVIEW */}
      <Drawer.Root
        open={Boolean(quickPreviewOrder)}
        onOpenChange={(open) => {
          if (!open) setQuickPreviewOrder(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-[36px] bg-[#0F2016] border-t border-white/12 text-[#F6F3E6] shadow-2xl focus:outline-none">
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />

            {quickPreviewOrder && (
              <div className="overflow-y-auto px-5 pt-4 pb-6 space-y-4 max-w-lg mx-auto w-full onboarding-safe-bottom">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Drawer.Title className="font-display text-lg font-bold text-[#F6F3E6]">
                      {quickPreviewOrder.businessName ||
                        'Detalle rápido del pedido'}
                    </Drawer.Title>
                    <Drawer.Description className="text-xs font-mono text-[#A9BDB0] tabular-nums">
                      Orden {quickPreviewOrder.id} ·{' '}
                      {quickPreviewOrder.type === 'compra_negocio'
                        ? 'Compra en tienda / restaurante'
                        : 'Envío de agente / encargo'}
                    </Drawer.Description>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickPreviewOrder(null)}
                    aria-label="Cerrar vista rápida"
                    className="w-9 h-9 rounded-full bg-[#1A3322] hover:bg-[#21402B] border border-white/10 text-[#A9BDB0] hover:text-[#F6F3E6] flex items-center justify-center cursor-pointer"
                  >
                    <X weight="bold" className="w-4 h-4" />
                  </button>
                </div>

                {/* 2-Stage Route Summary */}
                <div className="rounded-2xl bg-[#1A3322] border border-white/[0.08] p-3.5 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#6DB35F] text-[#10230F] font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#86C77A]">
                        Etapa 1 · Recogida en origen
                      </p>
                      <p className="text-[#F6F3E6] font-medium mt-0.5">
                        {quickPreviewOrder.pickup.address}
                      </p>
                      {quickPreviewOrder.pickup.referencePoint && (
                        <p className="text-[#A9BDB0]">
                          Ref: {quickPreviewOrder.pickup.referencePoint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2.5 border-t border-white/[0.06]">
                    <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-[#10230F] font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#F59E0B]">
                        Etapa 2 · Entrega al cliente
                      </p>
                      <p className="text-[#F6F3E6] font-medium mt-0.5">
                        {quickPreviewOrder.dropoff.address}
                      </p>
                      {quickPreviewOrder.dropoff.referencePoint && (
                        <p className="text-[#A9BDB0]">
                          Ref: {quickPreviewOrder.dropoff.referencePoint}
                        </p>
                      )}
                      {quickPreviewOrder.dropoff.coordinates &&
                        resolveVehicularAccessPoint(
                          quickPreviewOrder.dropoff.coordinates,
                          quickPreviewOrder.pickup.coordinates
                        ).isSnappedToCorner && (
                          <p className="text-[11px] font-semibold text-[#86C77A] flex items-center gap-1 pt-1">
                            <Footprints weight="duotone" className="w-3.5 h-3.5" />
                            <span>
                              Destino en zona peatonal: parada en esquina
                              vehicular cercana
                            </span>
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                {/* Items / Package & Payment Breakdown */}
                <div className="rounded-2xl bg-[#1A3322] border border-white/[0.08] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#A9BDB0]">
                    <span>Método de pago</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#F6F3E6]">
                      <CreditCard
                        weight="duotone"
                        className="w-3.5 h-3.5 text-[#86C77A]"
                      />
                      {quickPreviewOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#A9BDB0]">
                    <span>Ganancia de entrega (motorizado)</span>
                    <span className="font-mono font-bold text-[#86C77A] tabular-nums">
                      {formatPenCurrency(quickPreviewOrder.demoDeliveryFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-sm font-bold text-[#F6F3E6]">
                    <span>Importe total del pedido</span>
                    <span className="font-display text-base text-[#86C77A] tabular-nums">
                      {formatPenCurrency(quickPreviewOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const id = quickPreviewOrder.id;
                    setQuickPreviewOrder(null);
                    onAcceptOrder(id);
                  }}
                  className="w-full h-12 px-5 rounded-full vg-btn-primary font-display text-sm font-bold inline-flex items-center justify-between cursor-pointer"
                >
                  <span>Aceptar pedido y abrir hoja completa</span>
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <MainBottomNavigation
        activeTab={state.activeTab}
        onSelectTab={onSelectTab}
        pendingOrdersCount={activeOrdersCount}
      />
    </div>
  );
};
