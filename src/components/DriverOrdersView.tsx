import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Motorcycle,
  CheckCircle,
  Package,
  Storefront,
  ArrowRight,
  Clock,
  Info,
  NavigationArrow,
} from '@phosphor-icons/react';
import {
  DemoOrder,
  AssignedDriverInfo,
  DEMO_DRIVERS,
  ORDER_STATUS_LABELS,
  DRIVER_ACTION_LABELS,
  formatPenCurrency,
  getNextDriverStatus,
} from '../utils/ordersStore';

interface DriverOrdersViewProps {
  orders: DemoOrder[];
  activeDriver: AssignedDriverInfo;
  onSelectDemoDriver: (driver: AssignedDriverInfo) => void;
  onAcceptOrder: (orderId: string) => { success: boolean; error?: string };
  onAdvanceOrder: (orderId: string) => { success: boolean; error?: string };
  onOpenOrderInMap: (orderId: string) => void;
  onStartNavigation?: (orderId: string) => void;
}

export const DriverOrdersView: React.FC<DriverOrdersViewProps> = ({
  orders,
  activeDriver,
  onSelectDemoDriver,
  onAcceptOrder,
  onAdvanceOrder,
  onOpenOrderInMap,
  onStartNavigation,
}) => {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const availableOrders = orders.filter((o) => o.status === 'disponible');
  const myAssignedOrders = orders.filter(
    (o) => o.assignedDriver?.id === activeDriver.id
  );
  const otherDriversOrders = orders.filter(
    (o) =>
      o.assignedDriver !== null && o.assignedDriver.id !== activeDriver.id
  );

  const handleAccept = (orderId: string) => {
    setErrorMessage('');
    const res = onAcceptOrder(orderId);
    if (!res.success) {
      setErrorMessage(res.error || 'No se pudo asignar el pedido.');
      return;
    }
    setStatusMessage(
      `Pedido ${orderId} aceptado y asignado a ${activeDriver.name}.`
    );
  };

  const handleAdvance = (orderId: string) => {
    setErrorMessage('');
    const res = onAdvanceOrder(orderId);
    if (!res.success) {
      setErrorMessage(res.error || 'No se pudo actualizar el estado.');
      return;
    }
    setStatusMessage(`Estado del pedido ${orderId} actualizado correctamente.`);
  };

  return (
    <div className="space-y-5">
      {/* Active Demo Driver Selector Header */}
      <div className="vg-card-hero p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#6DB35F] text-[#10230F] flex items-center justify-center shrink-0">
              <Motorcycle weight="fill" className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86C77A]">
                Motorizado activo · Demo
              </p>
              <h1 className="font-display text-base font-bold text-[#F6F3E6]">
                {activeDriver.name} · Placa {activeDriver.vehiclePlate}
              </h1>
            </div>
          </div>
        </div>

        {/* Switch between DRV-01 and DRV-02 to test exclusive assignment */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {DEMO_DRIVERS.map((drv) => {
            const isCurrent = drv.id === activeDriver.id;
            const shortName = drv.name.replace(' (Demo)', '');
            return (
              <button
                key={drv.id}
                type="button"
                aria-pressed={isCurrent}
                onClick={() => {
                  setErrorMessage('');
                  setStatusMessage('');
                  onSelectDemoDriver(drv);
                }}
                className={`h-11 px-3 rounded-full text-xs font-semibold transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 truncate cursor-pointer ${
                  isCurrent
                    ? 'bg-[#244A30] text-[#86C77A] border border-[#86C77A]'
                    : 'bg-[#1A3322] text-[#A9BDB0] border border-white/[0.06] hover:text-[#F6F3E6]'
                }`}
              >
                {shortName} · {drv.id}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-[#A9BDB0] flex items-start gap-1.5 leading-snug pt-1 border-t border-white/[0.06]">
          <Info
            weight="duotone"
            className="w-3.5 h-3.5 text-[#86C77A] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>
            Asignación exclusiva local: al aceptar un pedido disponible, deja de
            aparecer en la bolsa general.
          </span>
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="rounded-xl bg-[#244A30] border border-[#86C77A]/40 px-3.5 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#F6F3E6]"
        >
          <CheckCircle weight="fill" className="w-4 h-4 text-[#86C77A] shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl bg-red-950/50 border border-red-500/40 px-3.5 py-2.5 text-xs font-semibold text-red-300"
        >
          {errorMessage}
        </div>
      )}

      {/* SECTION 1: PEDIDOS DISPONIBLES */}
      <section className="space-y-3" aria-label="Pedidos disponibles para aceptar">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#F6F3E6]">
            Pedidos disponibles ({availableOrders.length})
          </h2>
          <span className="text-xs font-mono text-[#A9BDB0]">
            Tarifas en S/
          </span>
        </div>

        {availableOrders.length === 0 ? (
          <div className="vg-surface-flat rounded-[28px] p-5 text-center space-y-1">
            <p className="text-sm font-semibold text-[#F6F3E6]">
              No hay pedidos disponibles en este momento
            </p>
            <p className="text-xs text-[#A9BDB0]">
              Los pedidos aceptados pasan a la sección de Mis entregas asignadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableOrders.map((order, idx) => {
              const TypeIcon =
                order.type === 'compra_negocio' ? Storefront : Package;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 22, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.08 + Math.min(idx, 6) * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="vg-card-interactive rounded-[28px] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono font-semibold text-[#86C77A] flex items-center gap-1.5 tabular-nums">
                        <span>{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#A9BDB0]">
                          {order.type === 'compra_negocio'
                            ? 'Compra en negocio'
                            : 'Encargo personalizado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <TypeIcon
                          weight="duotone"
                          className="w-4 h-4 text-[#86C77A] shrink-0"
                          aria-hidden="true"
                        />
                        <h3 className="font-display text-sm font-bold text-[#F6F3E6]">
                          {order.type === 'compra_negocio'
                            ? order.businessName
                            : order.customDescription}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <span className="block text-[10px] font-mono text-[#A9BDB0]">
                        Tarifa entrega
                      </span>
                      <span className="font-display text-sm font-bold text-[#86C77A]">
                        {formatPenCurrency(order.demoDeliveryFee)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-[#A9BDB0] space-y-1">
                    <p>
                      <strong className="font-semibold text-[#CFE0D3]">
                        Recogida:
                      </strong>{' '}
                      {order.pickup.address} ({order.pickup.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#CFE0D3]">
                        Destino:
                      </strong>{' '}
                      {order.dropoff.address} ({order.dropoff.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#CFE0D3]">
                        Instrucciones:
                      </strong>{' '}
                      {order.instructions}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#A9BDB0] tabular-nums">
                      Total pedido: {formatPenCurrency(order.totalAmount)} ·{' '}
                      {order.paymentMethod}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAccept(order.id)}
                      className="h-10 px-4 rounded-full vg-btn-primary text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Aceptar pedido</span>
                      <ArrowRight weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: MIS PEDIDOS ASIGNADOS */}
      <section className="space-y-3" aria-label="Mis pedidos asignados">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#F6F3E6]">
            Mis pedidos asignados ({myAssignedOrders.length})
          </h2>
          <span className="text-xs font-mono font-semibold text-[#86C77A]">
            {activeDriver.id}
          </span>
        </div>

        {myAssignedOrders.length === 0 ? (
          <div className="vg-surface-flat rounded-[28px] p-5 text-center">
            <p className="text-xs text-[#A9BDB0]">
              Aún no tienes pedidos asignados a {activeDriver.name}. Acepta un
              pedido disponible arriba para comenzar el flujo de entrega.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myAssignedOrders.map((order) => {
              const nextStatus = getNextDriverStatus(order.status);
              const actionLabel = DRIVER_ACTION_LABELS[order.status];

              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-[#244A30] border border-[#86C77A]/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono font-semibold text-[#86C77A] flex flex-wrap items-center gap-1.5 tabular-nums">
                        <span>{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#F6F3E6] font-bold">
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-[#F6F3E6] mt-1">
                        {order.type === 'compra_negocio'
                          ? order.businessName
                          : order.customDescription}
                      </h3>
                    </div>

                    <span className="font-display text-sm font-bold text-[#86C77A] tabular-nums shrink-0">
                      {formatPenCurrency(order.demoDeliveryFee)}
                    </span>
                  </div>

                  <div className="text-xs text-[#CFE0D3] space-y-1">
                    <p>
                      <strong className="font-semibold text-[#A9BDB0]">
                        Recogida:
                      </strong>{' '}
                      {order.pickup.address} ({order.pickup.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#A9BDB0]">
                        Destino:
                      </strong>{' '}
                      {order.dropoff.address} ({order.dropoff.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#A9BDB0]">
                        Instrucciones:
                      </strong>{' '}
                      {order.instructions}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenOrderInMap(order.id)}
                        className="h-11 px-3.5 rounded-full bg-[#0F2016] hover:bg-[#1A3322] border border-white/10 text-[#F6F3E6] text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Info weight="duotone" className="w-4 h-4 text-[#86C77A]" aria-hidden="true" />
                        <span>Ver datos</span>
                      </button>

                      {onStartNavigation && (
                        <button
                          type="button"
                          onClick={() => onStartNavigation(order.id)}
                          className="h-11 px-3.5 rounded-full bg-[#1A3322] hover:bg-[#21402B] border border-[#86C77A]/40 text-[#86C77A] text-xs font-bold inline-flex items-center gap-1.5 transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <NavigationArrow weight="fill" className="w-4 h-4" aria-hidden="true" />
                          <span>Navegar 3D</span>
                        </button>
                      )}
                    </div>

                    {nextStatus && actionLabel ? (
                      <button
                        type="button"
                        onClick={() => handleAdvance(order.id)}
                        className="h-11 px-4 rounded-full vg-btn-primary text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#86C77A]">
                        <CheckCircle weight="fill" className="w-4 h-4" aria-hidden="true" />
                        <span>Entrega completada</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: OTROS MOTORIZADOS (EXCLUSIVITY PROOF) */}
      {otherDriversOrders.length > 0 && (
        <section
          className="space-y-2.5 pt-1"
          aria-label="Pedidos asignados a otros motorizados"
        >
          <h2 className="font-display text-xs font-bold text-[#A9BDB0]">
            Asignados a otros motorizados ({otherDriversOrders.length})
          </h2>

          <div className="space-y-2">
            {otherDriversOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl vg-surface-flat p-3 flex items-center justify-between gap-2 opacity-80"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A9BDB0]">
                    <Clock weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {order.id} · Asignado a {order.assignedDriver?.name}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#F6F3E6] truncate mt-0.5">
                    {order.type === 'compra_negocio'
                      ? order.businessName
                      : order.customDescription}
                  </p>
                </div>

                <span className="text-[11px] font-mono font-semibold text-[#86C77A] shrink-0">
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
