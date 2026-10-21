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
import {
  calculateDistanceMeters,
  resolveVehicularAccessPoint,
} from '../utils/mapboxDirections';
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
      className="app-viewport vg-dark-canvas flex flex-col text-[#F3F7F5] select-none"
    >
      {/* FIXED TOP APP HEADER — RESTRAINED DARK GLASS ARCHITECTURE */}
      <header className="shrink-0 z-30 vg-glass-restrained border-b border-white/[0.08] px-4 pt-3 pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#10B981] text-[#050E0A] flex items-center justify-center font-display font-extrabold text-sm shrink-0">
              V
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold tracking-tight text-[#F3F7F5] whitespace-nowrap shrink-0">
                  VerdeGo
                </span>
                <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-wider text-[#22C58B] whitespace-nowrap shrink-0">
                  · {state.selectedRole === 'motorizado' ? 'Motorizado' : 'Cliente'}
                </span>
              </div>
              <p className="text-[11px] text-[#8A9E95] truncate">
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
              className="px-3.5 py-2 rounded-xl bg-[#111A16] hover:bg-[#16221D] border border-white/10 text-[#F3F7F5] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[44px] inline-flex items-center gap-1.5 cursor-pointer"
            >
              {state.selectedRole === 'motorizado' ? (
                <>
                  <ShoppingBagOpen
                    weight="duotone"
                    className="w-3.5 h-3.5 text-[#22C58B]"
                  />
                  <span>Modo Cliente</span>
                </>
              ) : (
                <>
                  <Motorcycle
                    weight="duotone"
                    className="w-3.5 h-3.5 text-[#22C58B]"
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {state.selectedRole === 'motorizado' ? (
                  /* PANEL DE INICIO PARA MOTORIZADO: ESCOGER PEDIDOS Y PASAR A DATOS + NAVEGACIÓN 3D */
                  <div className="space-y-5">
                    {/* Driver Header & Quick Switcher */}
                    <div className="rounded-2xl vg-surface-flat p-4 space-y-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-[#10B981] text-[#050E0A] flex items-center justify-center shrink-0">
                            <Motorcycle
                              weight="fill"
                              className="w-6 h-6"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-[#22C58B]">
                              Unidad activa · Puno
                            </p>
                            <h1 className="font-display text-lg font-bold text-[#F3F7F5] truncate">
                              {state.activeDriver.name}
                            </h1>
                            <p className="text-xs font-mono text-[#8A9E95] tabular-nums">
                              Placa: {state.activeDriver.vehiclePlate} · ID:{' '}
                              {state.activeDriver.id}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3 border-l border-white/[0.06]">
                          <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8A9E95]">
                            Disponibles
                          </span>
                          <span className="font-display text-xl font-extrabold text-[#22C58B] tabular-nums">
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
                              className={`h-11 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer truncate ${
                                isCurrent
                                  ? 'bg-[#101E18] text-[#22C58B] border border-[#22C58B]'
                                  : 'bg-[#111A16] text-[#8A9E95] border border-white/[0.06] hover:text-[#F3F7F5]'
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
                          <h2 className="font-display text-base font-bold text-[#F3F7F5]">
                            Escoger pedido disponible ({availableOrders.length})
                          </h2>
                          <p className="text-xs text-[#8A9E95]">
                            Acepta un pedido de agente o tienda para revisar sus
                            datos e iniciar el GPS 3D
                          </p>
                        </div>
                      </div>

                      {availableOrders.length === 0 ? (
                        <div className="rounded-2xl vg-surface-flat p-6 text-center space-y-3">
                          <div className="w-11 h-11 rounded-xl bg-[#111A16] border border-white/10 text-[#22C58B] flex items-center justify-center mx-auto">
                            <CheckCircle weight="duotone" className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-[#F3F7F5]">
                            Bolsa de pedidos al día
                          </p>
                          <p className="text-xs text-[#8A9E95]">
                            Todos los pedidos de demostración han sido aceptados.
                          </p>
                          <button
                            type="button"
                            onClick={onResetDemoOrders}
                            className="h-11 px-4 rounded-xl bg-[#111A16] hover:bg-[#16221D] border border-white/10 text-[#F3F7F5] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ArrowCounterClockwise
                              weight="bold"
                              className="w-3.5 h-3.5 text-[#22C58B]"
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
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.16,
                                  delay: idx * 0.04,
                                  ease: 'easeOut',
                                }}
                                className="vg-card-interactive rounded-2xl p-4 space-y-3.5"
                              >
                                {/* Card Header: Origin Store/Agent & Price */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[#111A16] border border-white/[0.08] text-[#22C58B] flex items-center justify-center shrink-0 mt-0.5">
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
                                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8A9E95] tabular-nums">
                                        <span className="font-bold text-[#22C58B]">
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
                                      <h3 className="font-display text-[15px] font-bold text-[#F3F7F5] truncate mt-0.5">
                                        {originTitle}
                                      </h3>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <p className="font-display text-base font-extrabold text-[#22C58B] tabular-nums">
                                      {formatPenCurrency(order.totalAmount)}
                                    </p>
                                    <p className="text-[11px] font-mono text-[#8A9E95] tabular-nums">
                                      Envío:{' '}
                                      {formatPenCurrency(order.demoDeliveryFee)}
                                    </p>
                                  </div>
                                </div>

                                {/* Origin -> Destination Route Box */}
                                <div className="rounded-xl bg-[#111A16] border border-white/[0.06] p-3 space-y-2 text-xs">
                                  <div className="flex items-start gap-2">
                                    <MapPinLine
                                      weight="duotone"
                                      className="w-4 h-4 text-[#22C58B] shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-semibold text-[#8A9E95]">
                                        De (Recogida):{' '}
                                      </span>
                                      <span className="text-[#F3F7F5]">
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
                                      <span className="font-semibold text-[#8A9E95]">
                                        A (Entrega):{' '}
                                      </span>
                                      <span className="text-[#F3F7F5]">
                                        {order.dropoff.address}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Brief Content Summary */}
                                <p className="text-xs text-[#8A9E95] truncate">
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
                                    className="h-11 px-3.5 rounded-xl bg-[#111A16] hover:bg-[#16221D] border border-white/10 text-[#C8D6D0] font-display text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                                  >
                                    <Eye
                                      weight="duotone"
                                      className="w-4 h-4 text-[#22C58B]"
                                    />
                                    <span>Vista rápida</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onAcceptOrder(order.id)}
                                    className="flex-1 h-11 px-4 rounded-xl vg-btn-primary font-display text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
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
                        <h2 className="font-display text-base font-bold text-[#F3F7F5]">
                          Tus entregas activas ({myDriverOrders.length})
                        </h2>
                        <div className="space-y-3">
                          {myDriverOrders.map((order) => (
                            <div
                              key={order.id}
                              className="rounded-2xl bg-[#101E18] border border-[#22C58B]/50 p-4 space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#22C58B] tabular-nums">
                                    <span>{order.id}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                      {ORDER_STATUS_LABELS[order.status]}
                                    </span>
                                  </div>
                                  <h3 className="font-display text-sm font-bold text-[#F3F7F5] truncate mt-0.5">
                                    {order.businessName ||
                                      order.customDescription}
                                  </h3>
                                </div>
                                <span className="font-display text-sm font-extrabold text-[#22C58B] tabular-nums shrink-0">
                                  {formatPenCurrency(order.totalAmount)}
                                </span>
                              </div>

                              <div className="text-xs text-[#C8D6D0] space-y-1">
                                <p className="truncate">
                                  <strong className="text-[#8A9E95]">
                                    De:
                                  </strong>{' '}
                                  {order.pickup.address}
                                </p>
                                <p className="truncate">
                                  <strong className="text-[#8A9E95]">A:</strong>{' '}
                                  {order.dropoff.address}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => onReviewOrder(order.id)}
                                  className="h-11 px-3 rounded-xl bg-[#0C1310] border border-white/10 hover:bg-[#111A16] text-[#F3F7F5] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <FileText
                                    weight="duotone"
                                    className="w-4 h-4 text-[#22C58B]"
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
                                  className="h-11 px-3 rounded-xl vg-btn-primary text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
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
                  /* PANEL DE INICIO PARA CLIENTE */
                  <div className="space-y-4">
                    <div className="rounded-2xl vg-surface-flat p-5 space-y-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#10B981] text-[#050E0A] flex items-center justify-center shrink-0">
                          <ShoppingBagOpen
                            weight="fill"
                            className="w-6 h-6"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#22C58B]">
                            <CheckCircle
                              weight="fill"
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                            <span>Entorno de Cliente Activo</span>
                          </div>
                          <h1 className="font-display text-xl font-bold text-[#F3F7F5]">
                            Panel de Cliente
                          </h1>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#8A9E95] leading-relaxed">
                        {activeRoleOption.summaryText}
                      </p>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onSelectTab('pedidos')}
                          className="w-full h-11 px-4 rounded-xl vg-btn-primary text-xs font-bold inline-flex items-center justify-between cursor-pointer whitespace-nowrap"
                        >
                          <span>Ver y crear mis pedidos</span>
                          <ArrowRight
                            weight="bold"
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Services Quick Access */}
                    <div className="space-y-2.5">
                      <h2 className="font-display text-sm font-bold text-[#F3F7F5]">
                        Operaciones disponibles
                      </h2>
                      <div className="grid grid-cols-1 gap-2.5">
                        {SERVICE_OPTIONS.map((service) => {
                          const Icon =
                            service.id === 'comprar' ? Storefront : Package;
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => onSelectTab('pedidos')}
                              className="vg-card-interactive w-full text-left rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-[#111A16] border border-white/[0.08] text-[#22C58B] flex items-center justify-center shrink-0">
                                  <Icon
                                    weight="duotone"
                                    className="w-5 h-5"
                                    aria-hidden="true"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-display text-sm font-bold text-[#F3F7F5] truncate">
                                    {service.title}
                                  </p>
                                  <p className="text-xs text-[#8A9E95] truncate">
                                    {service.description}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight
                                weight="bold"
                                className="w-4 h-4 text-[#22C58B] shrink-0"
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: PEDIDOS (ClientOrdersView vs DriverOrdersView) */}
            {state.activeTab === 'pedidos' && (
              <motion.div
                key={`pedidos-${state.selectedRole}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div>
                  <h1 className="font-display text-xl font-bold text-[#F3F7F5]">
                    Mi Perfil (Modo Demo)
                  </h1>
                  <p className="text-xs text-[#8A9E95]">
                    Alterna entre la vista de Cliente y de Motorizado para
                    probar el flujo completo
                  </p>
                </div>

                <div className="rounded-2xl vg-surface-flat p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#10B981] text-[#050E0A] flex items-center justify-center shrink-0">
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
                      <p className="text-[11px] font-mono uppercase tracking-wider text-[#22C58B]">
                        Vista activa
                      </p>
                      <h2 className="font-display text-lg font-bold text-[#F3F7F5]">
                        {activeRoleOption.title}
                      </h2>
                      <p className="text-xs text-[#8A9E95]">
                        {activeRoleOption.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectRole('usuario')}
                      className={`h-11 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        state.selectedRole === 'usuario'
                          ? 'bg-[#101E18] text-[#22C58B] border border-[#22C58B]'
                          : 'bg-[#111A16] text-[#8A9E95] border border-white/[0.06] hover:text-[#F3F7F5]'
                      }`}
                    >
                      <span>Soy cliente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectRole('motorizado')}
                      className={`h-11 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        state.selectedRole === 'motorizado'
                          ? 'bg-[#101E18] text-[#22C58B] border border-[#22C58B]'
                          : 'bg-[#111A16] text-[#8A9E95] border border-white/[0.06] hover:text-[#F3F7F5]'
                      }`}
                    >
                      <span>Soy motorizado</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl vg-surface-flat p-5 space-y-3">
                  <h3 className="font-display text-sm font-bold text-[#F3F7F5]">
                    Instalar como aplicación Android
                  </h3>
                  <p className="text-xs text-[#8A9E95] leading-relaxed">
                    Instala VerdeGo en la pantalla de inicio de tu celular para
                    abrirla a pantalla completa sin la barra del navegador.
                  </p>
                  <PWAInstallButton />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onResetDemoOrders}
                    className="w-full h-11 px-4 rounded-xl bg-[#111A16] hover:bg-[#16221D] border border-white/10 text-[#F3F7F5] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowCounterClockwise
                      weight="bold"
                      className="w-4 h-4 text-[#22C58B]"
                      aria-hidden="true"
                    />
                    <span>Restaurar pedidos demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full h-11 px-4 rounded-xl bg-[#0C1310] border border-white/10 hover:bg-[#111A16] text-[#8A9E95] hover:text-[#F3F7F5] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-3xl bg-[#0C1310] border-t border-white/12 text-[#F3F7F5] shadow-2xl focus:outline-none">
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />

            {quickPreviewOrder && (
              <div className="overflow-y-auto px-5 pt-4 pb-6 space-y-4 max-w-lg mx-auto w-full onboarding-safe-bottom">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Drawer.Title className="font-display text-lg font-bold text-[#F3F7F5]">
                      {quickPreviewOrder.businessName ||
                        'Detalle rápido del pedido'}
                    </Drawer.Title>
                    <Drawer.Description className="text-xs font-mono text-[#8A9E95] tabular-nums">
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
                    className="w-9 h-9 rounded-xl bg-[#111A16] hover:bg-[#16221D] border border-white/10 text-[#8A9E95] hover:text-[#F3F7F5] flex items-center justify-center cursor-pointer"
                  >
                    <X weight="bold" className="w-4 h-4" />
                  </button>
                </div>

                {/* 2-Stage Route Summary */}
                <div className="rounded-2xl bg-[#111A16] border border-white/[0.08] p-3.5 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#10B981] text-[#050E0A] font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#22C58B]">
                        Etapa 1 · Recogida en origen
                      </p>
                      <p className="text-[#F3F7F5] font-medium mt-0.5">
                        {quickPreviewOrder.pickup.address}
                      </p>
                      {quickPreviewOrder.pickup.referencePoint && (
                        <p className="text-[#8A9E95]">
                          Ref: {quickPreviewOrder.pickup.referencePoint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2.5 border-t border-white/[0.06]">
                    <div className="w-6 h-6 rounded-md bg-[#F59E0B] text-[#050E0A] font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#F59E0B]">
                        Etapa 2 · Entrega al cliente
                      </p>
                      <p className="text-[#F3F7F5] font-medium mt-0.5">
                        {quickPreviewOrder.dropoff.address}
                      </p>
                      {quickPreviewOrder.dropoff.referencePoint && (
                        <p className="text-[#8A9E95]">
                          Ref: {quickPreviewOrder.dropoff.referencePoint}
                        </p>
                      )}
                      {quickPreviewOrder.dropoff.coordinates &&
                        resolveVehicularAccessPoint(
                          quickPreviewOrder.dropoff.coordinates,
                          quickPreviewOrder.pickup.coordinates
                        ).isSnappedToCorner && (
                          <p className="text-[11px] font-semibold text-[#22C58B] flex items-center gap-1 pt-1">
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
                <div className="rounded-2xl bg-[#111A16] border border-white/[0.08] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#8A9E95]">
                    <span>Método de pago</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#F3F7F5]">
                      <CreditCard
                        weight="duotone"
                        className="w-3.5 h-3.5 text-[#22C58B]"
                      />
                      {quickPreviewOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#8A9E95]">
                    <span>Ganancia de entrega (motorizado)</span>
                    <span className="font-mono font-bold text-[#22C58B] tabular-nums">
                      {formatPenCurrency(quickPreviewOrder.demoDeliveryFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-sm font-bold text-[#F3F7F5]">
                    <span>Importe total del pedido</span>
                    <span className="font-display text-base text-[#22C58B] tabular-nums">
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
                  className="w-full h-12 px-5 rounded-xl vg-btn-primary font-display text-sm font-bold inline-flex items-center justify-between cursor-pointer"
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
