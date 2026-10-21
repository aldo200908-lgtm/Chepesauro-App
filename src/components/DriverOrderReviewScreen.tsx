import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Storefront,
  Package,
  NavigationArrow,
  CreditCard,
  CheckCircle,
  FileText,
  ArrowRight,
  Footprints,
} from '@phosphor-icons/react';
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
    <motion.div
      data-testid="driver-order-review-screen"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-40 vg-dark-canvas text-[#F3F7F5] flex flex-col select-none overflow-hidden"
    >
      {/* TOP BAR — RESTRAINED GLASS ARCHITECTURE */}
      <header className="shrink-0 vg-glass-restrained border-b border-white/[0.08] px-4 pt-3 pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-11 px-3.5 rounded-xl bg-[#0F1B14] hover:bg-[#16221D] border border-white/10 text-[#F3F7F5] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft weight="bold" className="w-4 h-4" aria-hidden="true" />
            <span>Volver al inicio</span>
          </button>

          <div className="text-right min-w-0">
            <p className="font-display text-sm font-bold text-[#F3F7F5] truncate">
              Datos del Pedido {order.id}
            </p>
            <p className="text-[11px] font-mono text-[#86C77A] truncate">
              {ORDER_STATUS_LABELS[order.status]}
            </p>
          </div>
        </div>
      </header>

      {/* SCROLLABLE ORDER DETAILS BODY */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4 pb-6">
          {/* STATUS CONFIRMATION BANNER */}
          <div className="vg-surface-flat rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#4F9A45] text-[#050E0A] flex items-center justify-center shrink-0">
                {isStorePurchase ? (
                  <Storefront weight="fill" className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Package weight="fill" className="w-6 h-6" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#86C77A]">
                  <CheckCircle weight="fill" className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isStorePurchase
                      ? 'Compra en tienda / restaurante'
                      : 'Envío de agente / encargo'}
                  </span>
                </div>
                <h1 className="font-display text-base font-bold text-[#F3F7F5] truncate mt-0.5">
                  {originName}
                </h1>
              </div>
            </div>

            <div className="text-right shrink-0 pl-3 border-l border-white/[0.06]">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#8A9E95]">
                Total pedido
              </p>
              <p className="font-display text-lg font-extrabold text-[#86C77A] tabular-nums">
                {formatPenCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          {/* 2-STAGE ROUTE BREAKDOWN (PICKUP -> DROPOFF) */}
          <section className="vg-surface-flat rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <h2 className="font-display text-sm font-bold text-[#F3F7F5]">
                Recorrido en 2 etapas (Puno)
              </h2>
              <span className="text-xs font-mono text-[#8A9E95] tabular-nums">
                Tramo aprox. {routeDistanceKm} km
              </span>
            </div>

            <div className="space-y-3">
              {/* STAGE 1: STORE / AGENT PICKUP */}
              <div
                className={`rounded-xl p-3.5 border transition-colors ${
                  defaultStage === 'pickup'
                    ? 'bg-[#101E18] border-[#86C77A]'
                    : 'bg-[#0F1B14] border-white/[0.06]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#4F9A45] text-[#050E0A] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#86C77A]">
                        Etapa 1 · Punto de recogida (Tienda / Agente)
                      </span>
                      {defaultStage === 'pickup' && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#86C77A]">
                          Siguiente destino
                        </span>
                      )}
                    </div>
                    <p className="font-display text-sm font-bold text-[#F3F7F5]">
                      {originName}
                    </p>
                    <p className="text-xs text-[#C8D6D0] font-medium">
                      {order.pickup.address}
                    </p>
                    {order.pickup.referencePoint && (
                      <p className="text-xs text-[#8A9E95]">
                        Ref: {order.pickup.referencePoint}
                      </p>
                    )}
                    {pickupAccess?.isSnappedToCorner && (
                      <p className="text-[11px] font-semibold text-[#F59E0B] flex items-center gap-1 pt-0.5">
                        <Footprints weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Acceso moto: {pickupAccess.cornerLabel} (+
                          {pickupAccess.walkingDistanceMeters} m a pie por zona
                          peatonal)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* STAGE 2: CUSTOMER DROPOFF */}
              <div
                className={`rounded-xl p-3.5 border transition-colors ${
                  defaultStage === 'dropoff'
                    ? 'bg-[#101E18] border-[#86C77A]'
                    : 'bg-[#0F1B14] border-white/[0.06]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#F59E0B] text-[#050E0A] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#F59E0B]">
                        Etapa 2 · Punto de entrega (Cliente final)
                      </span>
                      {defaultStage === 'dropoff' && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#86C77A]">
                          Siguiente destino
                        </span>
                      )}
                    </div>
                    <p className="font-display text-sm font-bold text-[#F3F7F5]">
                      {order.dropoff.address}
                    </p>
                    {order.dropoff.referencePoint && (
                      <p className="text-xs text-[#8A9E95]">
                        Ref: {order.dropoff.referencePoint}
                      </p>
                    )}
                    {dropoffAccess?.isSnappedToCorner && (
                      <p className="text-[11px] font-semibold text-[#F59E0B] flex items-center gap-1 pt-0.5">
                        <Footprints weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Acceso moto: {dropoffAccess.cornerLabel} (+
                          {dropoffAccess.walkingDistanceMeters} m a pie por zona
                          peatonal)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ORDER ITEMS / PACKAGE CONTENTS */}
          <section className="vg-surface-flat rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <FileText weight="duotone" className="w-4 h-4 text-[#86C77A]" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-[#F3F7F5]">
                {isStorePurchase
                  ? 'Productos solicitados en la tienda'
                  : 'Descripción del paquete / encargo'}
              </h2>
            </div>

            {isStorePurchase && order.items && order.items.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {order.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#F3F7F5]">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#8A9E95] tabular-nums">
                        Precio unitario: {formatPenCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#F3F7F5] tabular-nums shrink-0">
                      {formatPenCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-[#0F1B14] border border-white/[0.06] p-3 text-xs text-[#F3F7F5] leading-relaxed">
                {order.customDescription ||
                  'Paquete verificado listo para recoger en el punto de origen.'}
              </div>
            )}

            {/* Driver Instructions */}
            <div className="pt-2 border-t border-white/[0.06] space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#86C77A]">
                Instrucciones para el motorizado
              </p>
              <p className="text-xs text-[#C8D6D0] leading-relaxed">
                {order.instructions}
              </p>
            </div>
          </section>

          {/* PRICE & PAYMENT SUMMARY */}
          <section className="vg-surface-flat rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h2 className="font-display text-sm font-bold text-[#F3F7F5]">
                Resumen económico y pago
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C8D6D0]">
                <CreditCard weight="duotone" className="w-4 h-4 text-[#86C77A]" />
                <span>{order.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-[#8A9E95]">
                <span>Costo de productos en tienda</span>
                <span className="font-mono tabular-nums font-medium text-[#F3F7F5]">
                  {formatPenCurrency(order.productsCost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#8A9E95]">
                <span>Tarifa de entrega (ganancia motorizado)</span>
                <span className="font-mono tabular-nums font-semibold text-[#86C77A]">
                  {formatPenCurrency(order.demoDeliveryFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-sm font-bold text-[#F3F7F5]">
                <span>Total del pedido</span>
                <span className="font-display text-base text-[#86C77A] tabular-nums">
                  {formatPenCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* STICKY BOTTOM CTA BAR */}
      <footer className="shrink-0 vg-glass-restrained border-t border-white/[0.08] px-4 py-3.5 onboarding-safe-bottom">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => onContinueToNavigation(order, defaultStage)}
            className="w-full h-14 px-5 rounded-xl vg-btn-primary font-display text-sm sm:text-base font-bold inline-flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#050E0A]/15 flex items-center justify-center shrink-0">
                <NavigationArrow weight="fill" className="w-5 h-5 text-[#050E0A]" aria-hidden="true" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-bold text-[#050E0A] truncate">
                  Continuar a Navegación Guiada 3D
                </p>
                <p className="text-[11px] font-medium text-[#050E0A]/80 truncate">
                  {defaultStage === 'pickup'
                    ? 'Etapa 1: Ruta 3D hacia la tienda / agente'
                    : 'Etapa 2: Ruta 3D hacia el cliente final'}
                </p>
              </div>
            </div>
            <ArrowRight weight="bold" className="w-5 h-5 shrink-0 text-[#050E0A]" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </motion.div>
  );
};
