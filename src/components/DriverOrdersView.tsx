import React, { useState } from 'react';
import {
  Bike,
  CheckCircle2,
  MapPin,
  Package,
  Store,
  ArrowRight,
  Clock,
  Info,
  Navigation,
} from 'lucide-react';
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
      <div className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#078F68] text-white flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#078F68]">
                Motorizado activo (Simulación Demo)
              </p>
              <h1 className="font-display text-base font-bold text-[#102F27]">
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
                onClick={() => {
                  setErrorMessage('');
                  setStatusMessage('');
                  onSelectDemoDriver(drv);
                }}
                className={`h-9 px-2.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 truncate cursor-pointer ${
                  isCurrent
                    ? 'bg-[#078F68] text-white'
                    : 'bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2]'
                }`}
              >
                {shortName} · {drv.id}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-[#64877C] flex items-start gap-1.5 leading-snug">
          <Info
            className="w-3.5 h-3.5 text-[#078F68] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>
            Asignación exclusiva local: al aceptar un pedido disponible, deja de
            aparecer como disponible. En producción esto requerirá una operación
            atómica en el servidor.
          </span>
        </p>
      </div>

      {statusMessage && (
        <p
          role="status"
          className="text-xs font-semibold text-[#078F68] px-1"
        >
          {statusMessage}
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="text-xs font-semibold text-red-600 px-1">
          {errorMessage}
        </p>
      )}

      {/* SECTION 1: PEDIDOS DISPONIBLES */}
      <section className="space-y-3" aria-label="Pedidos disponibles para aceptar">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#102F27]">
            Pedidos disponibles ({availableOrders.length})
          </h2>
          <span className="text-xs text-[#64877C]">
            Tarifas demo en S/
          </span>
        </div>

        {availableOrders.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#DCECE5] p-5 text-center space-y-1">
            <p className="text-sm font-semibold text-[#102F27]">
              No hay pedidos disponibles en este momento
            </p>
            <p className="text-xs text-[#64877C]">
              Los pedidos aceptados pasan a la sección de Mis entregas asignadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableOrders.map((order) => {
              const TypeIcon =
                order.type === 'compra_negocio' ? Store : Package;

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
                        <span>
                          {order.type === 'compra_negocio'
                            ? 'Compra en negocio'
                            : 'Encargo personalizado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <TypeIcon
                          className="w-4 h-4 text-[#078F68] shrink-0"
                          aria-hidden="true"
                        />
                        <h3 className="font-display text-sm font-bold text-[#102F27]">
                          {order.type === 'compra_negocio'
                            ? order.businessName
                            : order.customDescription}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <span className="block text-[10px] text-[#64877C]">
                        Tarifa entrega (Demo)
                      </span>
                      <span className="font-display text-sm font-bold text-[#078F68]">
                        {formatPenCurrency(order.demoDeliveryFee)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-[#64877C] space-y-1">
                    <p>
                      <strong className="font-semibold text-[#102F27]">
                        Recogida:
                      </strong>{' '}
                      {order.pickup.address} ({order.pickup.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#102F27]">
                        Destino:
                      </strong>{' '}
                      {order.dropoff.address} ({order.dropoff.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#102F27]">
                        Instrucciones:
                      </strong>{' '}
                      {order.instructions}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#DCECE5] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#64877C] tabular-nums">
                      Total pedido: {formatPenCurrency(order.totalAmount)} ·{' '}
                      {order.paymentMethod}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAccept(order.id)}
                      className="h-10 px-4 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Aceptar pedido</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: MIS PEDIDOS ASIGNADOS */}
      <section className="space-y-3" aria-label="Mis pedidos asignados">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#102F27]">
            Mis pedidos asignados ({myAssignedOrders.length})
          </h2>
          <span className="text-xs font-semibold text-[#078F68]">
            {activeDriver.id}
          </span>
        </div>

        {myAssignedOrders.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#DCECE5] p-5 text-center">
            <p className="text-xs text-[#64877C]">
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
                  className="rounded-3xl bg-white border-2 border-[#078F68]/30 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-[#078F68] flex flex-wrap items-center gap-1.5 tabular-nums">
                        <span>{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#064B3C] font-bold">
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-[#102F27] mt-1">
                        {order.type === 'compra_negocio'
                          ? order.businessName
                          : order.customDescription}
                      </h3>
                    </div>

                    <span className="font-display text-sm font-bold text-[#078F68] tabular-nums shrink-0">
                      {formatPenCurrency(order.demoDeliveryFee)}
                    </span>
                  </div>

                  <div className="text-xs text-[#64877C] space-y-1">
                    <p>
                      <strong className="font-semibold text-[#102F27]">
                        Recogida:
                      </strong>{' '}
                      {order.pickup.address} ({order.pickup.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#102F27]">
                        Destino:
                      </strong>{' '}
                      {order.dropoff.address} ({order.dropoff.referencePoint})
                    </p>
                    <p>
                      <strong className="font-semibold text-[#102F27]">
                        Instrucciones:
                      </strong>{' '}
                      {order.instructions}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#DCECE5] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenOrderInMap(order.id)}
                        className="h-9 px-3 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Ver datos</span>
                      </button>

                      {onStartNavigation && (
                        <button
                          type="button"
                          onClick={() => onStartNavigation(order.id)}
                          className="h-9 px-3.5 rounded-full bg-[#9333EA] hover:bg-[#7E22CE] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Navegar 3D</span>
                        </button>
                      )}
                    </div>

                    {nextStatus && actionLabel ? (
                      <button
                        type="button"
                        onClick={() => handleAdvance(order.id)}
                        className="h-10 px-4 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#078F68]">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>{ORDER_STATUS_LABELS[order.status]}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Orders assigned to other drivers (Read-only, cannot be modified by current driver) */}
      {otherDriversOrders.length > 0 && (
        <section className="space-y-2 pt-2 border-t border-[#DCECE5]">
          <h3 className="text-xs font-bold text-[#64877C]">
            Pedidos asignados a otros motorizados (Solo lectura)
          </h3>
          {otherDriversOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-[#EAF8F2]/50 border border-[#DCECE5] p-3 flex items-center justify-between gap-2 text-xs text-[#64877C]"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#102F27] truncate">
                  {order.id} · Asignado a {order.assignedDriver?.name}
                </p>
                <p className="text-[11px] truncate">
                  Estado: {ORDER_STATUS_LABELS[order.status]}
                </p>
              </div>
              <span className="text-[11px] font-medium whitespace-nowrap shrink-0">
                No modificable
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
