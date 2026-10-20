import React from 'react';
import {
  ArrowLeft,
  Store,
  Package,
  MapPin,
  Navigation,
  CreditCard,
  CheckCircle2,
  Bike,
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  DemoOrder,
  ORDER_STATUS_LABELS,
  formatPenCurrency,
} from '../utils/ordersStore';
import {
  calculateDistanceMeters,
  resolveVehicularAccessPoint,
} from '../utils/mapboxDirections';

interface DriverOrderReviewScreenProps {
  order: DemoOrder;
  onBack: () => void;
  onContinueToNavigation: (
    order: DemoOrder,
    initialStage: 'pickup' | 'dropoff'
  ) => void;
}

export const DriverOrderReviewScreen: React.FC<DriverOrderReviewScreenProps> = ({
  order,
  onBack,
  onContinueToNavigation,
}) => {
  const isStorePurchase = order.type === 'compra_negocio';
  const originName =
    order.businessName ||
    (isStorePurchase ? 'Comercio afiliado en Puno' : 'Agente / Punto de envío');

  // Determine which stage of the 2-stage delivery is active next
  const defaultStage: 'pickup' | 'dropoff' =
    order.status === 'recogido' || order.status === 'en_camino_cliente'
      ? 'dropoff'
      : 'pickup';

  const pickupAccess = order.pickup.coordinates
    ? resolveVehicularAccessPoint(
        order.pickup.coordinates,
        order.dropoff.coordinates
      )
    : null;

  const dropoffAccess = order.dropoff.coordinates
    ? resolveVehicularAccessPoint(
        order.dropoff.coordinates,
        order.pickup.coordinates
      )
    : null;

  // Calculate approximate straight-line distance between pickup and dropoff
  const routeDistanceKm =
    order.pickup.coordinates && order.dropoff.coordinates
      ? (
          calculateDistanceMeters(
            order.pickup.coordinates,
            order.dropoff.coordinates
          ) / 1000
        ).toFixed(2)
      : '1.40';

  return (
    <div
      data-testid="driver-order-review-screen"
      className="fixed inset-0 z-40 bg-[#FFFFFF] text-[#102F27] flex flex-col select-none overflow-hidden"
    >
      {/* TOP BAR */}
      <header className="shrink-0 bg-[#078F68] text-white px-4 pt-3 pb-3.5 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-3 rounded-full bg-[#064B3C] hover:bg-[#064B3C]/90 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Volver al inicio</span>
          </button>

          <div className="text-right min-w-0">
            <p className="font-display text-sm font-bold text-white truncate">
              Datos del Pedido {order.id}
            </p>
            <p className="text-[11px] text-[#EAF8F2] truncate">
              {ORDER_STATUS_LABELS[order.status]}
            </p>
          </div>
        </div>
      </header>

      {/* SCROLLABLE ORDER DETAILS BODY */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4 pb-6">
          {/* STATUS CONFIRMATION BANNER */}
          <div className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#078F68] text-white flex items-center justify-center shrink-0">
                {isStorePurchase ? (
                  <Store className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Package className="w-6 h-6" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#078F68]">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isStorePurchase
                      ? 'Compra en tienda / restaurante'
                      : 'Envío de agente / encargo'}
                  </span>
                </div>
                <h1 className="font-display text-base font-bold text-[#102F27] truncate">
                  {originName}
                </h1>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[11px] text-[#64877C]">Total pedido</p>
              <p className="font-display text-lg font-extrabold text-[#078F68] tabular-nums">
                {formatPenCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          {/* 2-STAGE ROUTE BREAKDOWN (PICKUP -> DROPOFF) */}
          <section className="rounded-3xl bg-white border border-[#DCECE5] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#102F27]">
                Recorrido en 2 etapas (Puno)
              </h2>
              <span className="text-xs text-[#64877C] tabular-nums">
                Tramo aprox. {routeDistanceKm} km
              </span>
            </div>

            <div className="space-y-3.5">
              {/* STAGE 1: STORE / AGENT PICKUP */}
              <div
                className={`rounded-2xl p-3.5 border transition-colors ${
                  defaultStage === 'pickup'
                    ? 'bg-[#EAF8F2]/80 border-[#078F68]'
                    : 'bg-[#F8FCFA] border-[#DCECE5]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#078F68] text-white font-display text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#064B3C]">
                        Etapa 1 · Punto de recogida (Tienda / Agente)
                      </span>
                      {defaultStage === 'pickup' && (
                        <span className="text-[11px] font-semibold text-[#078F68]">
                          Siguiente destino
                        </span>
                      )}
                    </div>
                    <p className="font-display text-sm font-bold text-[#102F27]">
                      {originName}
                    </p>
                    <p className="text-xs text-[#102F27] font-medium">
                      {order.pickup.address}
                    </p>
                    {order.pickup.referencePoint && (
                      <p className="text-xs text-[#64877C]">
                        Ref: {order.pickup.referencePoint}
                      </p>
                    )}
                    {pickupAccess?.isSnappedToCorner && (
                      <p className="text-[11px] font-semibold text-[#078F68] pt-0.5">
                        Acceso moto: {pickupAccess.cornerLabel} (+
                        {pickupAccess.walkingDistanceMeters} m a pie por zona
                        peatonal)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* STAGE 2: CUSTOMER DROPOFF */}
              <div
                className={`rounded-2xl p-3.5 border transition-colors ${
                  defaultStage === 'dropoff'
                    ? 'bg-[#EAF8F2]/80 border-[#078F68]'
                    : 'bg-[#F8FCFA] border-[#DCECE5]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#064B3C] text-white font-display text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#064B3C]">
                        Etapa 2 · Punto de entrega (Cliente final)
                      </span>
                      {defaultStage === 'dropoff' && (
                        <span className="text-[11px] font-semibold text-[#078F68]">
                          Siguiente destino
                        </span>
                      )}
                    </div>
                    <p className="font-display text-sm font-bold text-[#102F27]">
                      {order.dropoff.address}
                    </p>
                    {order.dropoff.referencePoint && (
                      <p className="text-xs text-[#64877C]">
                        Ref: {order.dropoff.referencePoint}
                      </p>
                    )}
                    {dropoffAccess?.isSnappedToCorner && (
                      <p className="text-[11px] font-semibold text-[#078F68] pt-0.5">
                        Acceso moto: {dropoffAccess.cornerLabel} (+
                        {dropoffAccess.walkingDistanceMeters} m a pie por zona
                        peatonal)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ORDER ITEMS / PACKAGE CONTENTS */}
          <section className="rounded-3xl bg-white border border-[#DCECE5] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#078F68]" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-[#102F27]">
                {isStorePurchase
                  ? 'Productos solicitados en la tienda'
                  : 'Descripción del paquete / encargo'}
              </h2>
            </div>

            {isStorePurchase && order.items && order.items.length > 0 ? (
              <div className="divide-y divide-[#DCECE5]">
                {order.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#102F27]">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="text-[11px] text-[#64877C] tabular-nums">
                        Precio unitario: {formatPenCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold text-[#102F27] tabular-nums shrink-0">
                      {formatPenCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#F8FCFA] border border-[#DCECE5] p-3 text-xs text-[#102F27] leading-relaxed">
                {order.customDescription ||
                  'Paquete verificado listo para recoger en el punto de origen.'}
              </div>
            )}

            {/* Driver Instructions */}
            <div className="pt-2 border-t border-[#DCECE5] space-y-1">
              <p className="text-[11px] font-bold text-[#064B3C]">
                Instrucciones para el motorizado:
              </p>
              <p className="text-xs text-[#64877C] leading-relaxed">
                {order.instructions}
              </p>
            </div>
          </section>

          {/* PRICE & PAYMENT SUMMARY */}
          <section className="rounded-3xl bg-white border border-[#DCECE5] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#102F27]">
                Resumen económico y pago
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064B3C]">
                <CreditCard className="w-3.5 h-3.5 text-[#078F68]" />
                <span>{order.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-[#64877C]">
                <span>Costo de productos en tienda</span>
                <span className="tabular-nums font-medium text-[#102F27]">
                  {formatPenCurrency(order.productsCost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#64877C]">
                <span>Tarifa de entrega (ganancia motorizado)</span>
                <span className="tabular-nums font-semibold text-[#078F68]">
                  {formatPenCurrency(order.demoDeliveryFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DCECE5] flex items-center justify-between text-sm font-bold text-[#102F27]">
                <span>Total del pedido</span>
                <span className="font-display text-base text-[#078F68] tabular-nums">
                  {formatPenCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* STICKY BOTTOM CTA BAR — LAUNCH FULL-SCREEN 3D GTA V NAVIGATION */}
      <footer className="shrink-0 bg-white border-t border-[#DCECE5] px-4 py-3.5 bottom-nav-safe">
        <div className="max-w-lg mx-auto space-y-2">
          <button
            type="button"
            onClick={() => onContinueToNavigation(order, defaultStage)}
            className="w-full h-14 px-6 rounded-2xl bg-[#078F68] hover:bg-[#064B3C] active:scale-[0.99] text-white font-display text-sm sm:text-base font-bold inline-flex items-center justify-between gap-3 shadow-lg shadow-[#078F68]/25 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  Continuar a Navegación Guiada 3D
                </p>
                <p className="text-[11px] font-medium text-[#EAF8F2] truncate">
                  {defaultStage === 'pickup'
                    ? 'Etapa 1: Ruta 3D hacia la tienda / agente'
                    : 'Etapa 2: Ruta 3D hacia el cliente final'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
};
