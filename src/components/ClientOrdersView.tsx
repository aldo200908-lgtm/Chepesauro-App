import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Clock,
  Motorcycle,
  XCircle,
  CaretDown,
  CaretUp,
  Storefront,
  Package,
  NavigationArrow,
} from '@phosphor-icons/react';
import {
  DemoOrder,
  OrderServiceType,
  DemoPaymentMethod,
  CreateCustomOrderInput,
  ORDER_STATUS_LABELS,
  formatPenCurrency,
  canClientCancelOrder,
} from '../utils/ordersStore';

interface ClientOrdersViewProps {
  orders: DemoOrder[];
  onCreateOrder: (input: CreateCustomOrderInput) => {
    success: boolean;
    error?: string;
  };
  onCancelOrder: (orderId: string) => { success: boolean; error?: string };
  onOpenOrderInMap: (orderId: string) => void;
  onStartNavigation?: (orderId: string) => void;
}

export const ClientOrdersView: React.FC<ClientOrdersViewProps> = ({
  orders,
  onCreateOrder,
  onCancelOrder,
  onStartNavigation,
}) => {
  const [serviceType, setServiceType] = useState<OrderServiceType>(
    'encargo_personalizado'
  );
  const [businessName, setBusinessName] = useState('');
  const [itemName, setItemName] = useState('Menú ejecutivo / Producto demo');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('18.00');
  const [customDescription, setCustomDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupReference, setPickupReference] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffReference, setDropoffReference] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<DemoPaymentMethod>('Yape / Plin (Demo)');
  const [formError, setFormError] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    orders[0]?.id || null
  );

  const demoDeliveryFee = serviceType === 'compra_negocio' ? 6.0 : 7.5;
  const parsedQty = Math.max(1, parseInt(itemQty, 10) || 1);
  const parsedPrice = Math.max(0, parseFloat(itemPrice) || 0);
  const previewProductsCost =
    serviceType === 'compra_negocio' ? parsedQty * parsedPrice : 0;
  const previewTotal = previewProductsCost + demoDeliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFeedbackBanner('');

    const result = onCreateOrder({
      type: serviceType,
      businessName: serviceType === 'compra_negocio' ? businessName : undefined,
      items:
        serviceType === 'compra_negocio'
          ? [
              {
                name: itemName.trim() || 'Producto de demostración',
                quantity: parsedQty,
                unitPrice: parsedPrice,
              },
            ]
          : undefined,
      customDescription:
        serviceType === 'encargo_personalizado' ? customDescription : undefined,
      pickupAddress,
      pickupReference,
      dropoffAddress,
      dropoffReference,
      instructions,
      paymentMethod,
      demoDeliveryFee,
    });

    if (!result.success) {
      setFormError(result.error || 'Verifica los datos del pedido.');
      return;
    }

    setBusinessName('');
    setCustomDescription('');
    setPickupAddress('');
    setPickupReference('');
    setDropoffAddress('');
    setDropoffReference('');
    setInstructions('');
    setFeedbackBanner(
      'Pedido creado en estado "Disponible". Ya puede ser aceptado desde la vista de Motorizado.'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Demo Notice */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-xl font-bold text-[#F6F3E6]">
            Pedidos de Cliente
          </h1>
          <span className="text-xs font-mono font-semibold text-[#86C77A] tabular-nums">
            {orders.length} registrados
          </span>
        </div>
        <p className="text-xs text-[#A9BDB0]">
          Flujo de demostración · Tarifas e importes en soles (S/)
        </p>
      </div>

      {/* Create Order Form (Encargo Personalizado o Compra en Negocio) */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] vg-surface-flat p-4 space-y-3.5"
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
          <h2 className="font-display text-sm font-bold text-[#F6F3E6]">
            Crear nuevo pedido (Demo)
          </h2>
          <span className="text-[11px] font-mono text-[#86C77A] tabular-nums">
            Tarifa demo: {formatPenCurrency(demoDeliveryFee)}
          </span>
        </div>

        {/* Service Type Toggle */}
        <div
          role="group"
          aria-label="Tipo de pedido"
          className="grid grid-cols-2 gap-2 p-1 bg-[#0A150E] rounded-full border border-white/[0.08]"
        >
          <button
            type="button"
            aria-pressed={serviceType === 'encargo_personalizado'}
            onClick={() => setServiceType('encargo_personalizado')}
            className={`h-10 px-3 rounded-full text-xs font-semibold transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
              serviceType === 'encargo_personalizado'
                ? 'bg-[#6DB35F] text-[#10230F] font-bold'
                : 'text-[#A9BDB0] hover:text-[#F6F3E6]'
            }`}
          >
            Encargo personalizado
          </button>
          <button
            type="button"
            aria-pressed={serviceType === 'compra_negocio'}
            onClick={() => setServiceType('compra_negocio')}
            className={`h-10 px-3 rounded-full text-xs font-semibold transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
              serviceType === 'compra_negocio'
                ? 'bg-[#6DB35F] text-[#10230F] font-bold'
                : 'text-[#A9BDB0] hover:text-[#F6F3E6]'
            }`}
          >
            Compra en negocio
          </button>
        </div>

        {serviceType === 'compra_negocio' ? (
          <div className="space-y-2.5">
            <div>
              <label
                htmlFor="business-name-input"
                className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
              >
                Nombre del negocio de recogida
              </label>
              <input
                id="business-name-input"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Bodega y Panadería San Martín"
                className="w-full h-11 px-3.5 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] placeholder:text-[#84998B] focus:outline-none focus:border-[#86C77A]"
              />
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <label
                  htmlFor="item-name-input"
                  className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
                >
                  Producto (Demo)
                </label>
                <input
                  id="item-name-input"
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] focus:outline-none focus:border-[#86C77A]"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="item-qty-input"
                  className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
                >
                  Cant.
                </label>
                <input
                  id="item-qty-input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] tabular-nums focus:outline-none focus:border-[#86C77A]"
                />
              </div>
              <div className="col-span-4">
                <label
                  htmlFor="item-price-input"
                  className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
                >
                  Precio (S/)
                </label>
                <input
                  id="item-price-input"
                  type="number"
                  inputMode="decimal"
                  step="0.50"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] tabular-nums focus:outline-none focus:border-[#86C77A]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="custom-desc-input"
              className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
            >
              Descripción del encargo
            </label>
            <input
              id="custom-desc-input"
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Ej. Enviar llaves y sobre con documentos"
              className="w-full h-11 px-3.5 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] placeholder:text-[#84998B] focus:outline-none focus:border-[#86C77A]"
            />
          </div>
        )}

        {/* Pickup & Dropoff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="pickup-address-input"
              className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
            >
              Dirección de recogida
            </label>
            <input
              id="pickup-address-input"
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Ej. Jr. Lima 415, Puno"
              className="w-full h-11 px-3.5 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] placeholder:text-[#84998B] focus:outline-none focus:border-[#86C77A]"
            />
          </div>

          <div>
            <label
              htmlFor="dropoff-address-input"
              className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
            >
              Dirección de destino
            </label>
            <input
              id="dropoff-address-input"
              type="text"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="Ej. Av. La Torre 240, Puno"
              className="w-full h-11 px-3.5 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] placeholder:text-[#84998B] focus:outline-none focus:border-[#86C77A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="instructions-input"
              className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
            >
              Instrucciones y referencias
            </label>
            <input
              id="instructions-input"
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej. Portón negro, tocar timbre 2"
              className="w-full h-11 px-3.5 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] placeholder:text-[#84998B] focus:outline-none focus:border-[#86C77A]"
            />
          </div>

          <div>
            <label
              htmlFor="payment-method-select"
              className="block text-[11px] font-semibold text-[#A9BDB0] mb-1"
            >
              Método de pago (Demo)
            </label>
            <select
              id="payment-method-select"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as DemoPaymentMethod)
              }
              className="w-full h-11 px-3 rounded-2xl bg-[#1A3322] border border-white/10 text-xs text-[#F6F3E6] focus:outline-none focus:border-[#86C77A]"
            >
              <option value="Yape / Plin (Demo)">Yape / Plin (Demo)</option>
              <option value="Efectivo (Demo)">Efectivo (Demo)</option>
              <option value="Tarjeta (Demo)">Tarjeta (Demo)</option>
            </select>
          </div>
        </div>

        {/* Cost Summary Preview */}
        <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#A9BDB0] tabular-nums">
          <span>
            {serviceType === 'compra_negocio'
              ? `Productos: ${formatPenCurrency(previewProductsCost)} · Envío demo: ${formatPenCurrency(demoDeliveryFee)}`
              : `Tarifa de entrega demo: ${formatPenCurrency(demoDeliveryFee)}`}
          </span>
          <strong className="font-bold text-[#86C77A]">
            Total: {formatPenCurrency(previewTotal)}
          </strong>
        </div>

        {formError && (
          <p role="alert" className="text-xs font-semibold text-red-400">
            {formError}
          </p>
        )}

        {feedbackBanner && (
          <p role="status" className="text-xs font-semibold text-[#86C77A]">
            {feedbackBanner}
          </p>
        )}

        <button
          type="submit"
          className="w-full h-11 rounded-full vg-btn-primary text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus weight="bold" className="w-4 h-4" aria-hidden="true" />
          <span>Registrar pedido de demostración</span>
        </button>
      </form>

      {/* Created Orders List */}
      <div className="space-y-3" role="list" aria-label="Lista de pedidos del cliente">
        {orders.map((order, idx) => {
          const isCancellable = canClientCancelOrder(order.status);
          const isHistoryOpen = expandedHistoryId === order.id;
          const TypeIcon =
            order.type === 'compra_negocio' ? Storefront : Package;

          return (
            <motion.div
              key={order.id}
              role="listitem"
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: Math.min(idx, 6) * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-[28px] vg-surface-flat p-4 space-y-3"
            >
              {/* Order Header: ID, Type & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-mono text-[#A9BDB0] flex flex-wrap items-center gap-1.5 tabular-nums">
                    <span className="text-[#86C77A] font-bold">{order.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {order.type === 'compra_negocio'
                        ? 'Compra en negocio'
                        : 'Encargo personalizado'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        order.status === 'cancelado'
                          ? 'text-red-400 font-bold'
                          : 'text-[#F6F3E6] font-bold'
                      }
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <TypeIcon
                      weight="duotone"
                      className="w-4 h-4 text-[#86C77A] shrink-0"
                      aria-hidden="true"
                    />
                    <h3 className="font-display text-sm font-bold text-[#F6F3E6] truncate">
                      {order.type === 'compra_negocio'
                        ? order.businessName
                        : order.customDescription}
                    </h3>
                  </div>
                </div>

                <span className="font-display text-sm font-bold text-[#86C77A] tabular-nums shrink-0">
                  {formatPenCurrency(order.totalAmount)}
                </span>
              </div>

              {/* Items breakdown if Compra en negocio */}
              {order.type === 'compra_negocio' &&
                order.items &&
                order.items.length > 0 && (
                  <div className="text-xs text-[#CFE0D3] pt-1 border-t border-white/[0.06] space-y-0.5 tabular-nums">
                    {order.items.map((item, idx) => (
                      <p key={idx}>
                        {item.quantity}x {item.name} ({formatPenCurrency(item.unitPrice)})
                      </p>
                    ))}
                  </div>
                )}

              {/* Pickup, Dropoff & Instructions */}
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

              {/* Assigned Driver & Cost Breakdown */}
              <div className="pt-2.5 border-t border-white/[0.06] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#F6F3E6]">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Motorcycle
                      weight="duotone"
                      className="w-3.5 h-3.5 text-[#86C77A] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {order.assignedDriver
                        ? `Motorizado: ${order.assignedDriver.name} · Placa ${order.assignedDriver.vehiclePlate}`
                        : 'Sin motorizado asignado aún'}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#A9BDB0] tabular-nums">
                  <span>
                    {order.productsCost > 0
                      ? `Productos: ${formatPenCurrency(order.productsCost)} · `
                      : ''}
                    Envío demo: {formatPenCurrency(order.demoDeliveryFee)} · Pago:{' '}
                    {order.paymentMethod}
                  </span>
                  <strong className="text-[#F6F3E6]">
                    Total: {formatPenCurrency(order.totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Actions: History Toggle, Map & Valid Cancellation */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedHistoryId(isHistoryOpen ? null : order.id)
                  }
                  className="h-9 px-3 rounded-full bg-[#1A3322] hover:bg-[#21402B] border border-white/[0.08] text-[#CFE0D3] text-xs font-semibold inline-flex items-center gap-1 transition-all duration-200 active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Clock weight="duotone" className="w-3.5 h-3.5 text-[#86C77A]" aria-hidden="true" />
                  <span>Historial ({order.statusHistory.length})</span>
                  {isHistoryOpen ? (
                    <CaretUp weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <CaretDown weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {onStartNavigation &&
                    order.status !== 'cancelado' &&
                    order.status !== 'entregado' && (
                      <button
                        type="button"
                        onClick={() => onStartNavigation(order.id)}
                        className="h-9 px-3 rounded-full vg-btn-primary text-xs font-bold inline-flex items-center gap-1 transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <NavigationArrow weight="fill" className="w-3 h-3" aria-hidden="true" />
                        <span>Seguimiento 3D</span>
                      </button>
                    )}

                  {isCancellable && (
                    <button
                      type="button"
                      onClick={() => onCancelOrder(order.id)}
                      className="h-9 px-3 rounded-full bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 text-red-300 text-xs font-semibold inline-flex items-center gap-1 transition-all duration-200 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <XCircle weight="duotone" className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cancelar pedido</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status History Log */}
              {isHistoryOpen && (
                <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
                  <p className="text-[11px] font-semibold text-[#86C77A]">
                    Historial de cambios de estado
                  </p>
                  <ol className="space-y-1.5 text-[11px] text-[#A9BDB0]">
                    {order.statusHistory.map((entry, idx) => (
                      <li
                        key={`${entry.status}-${idx}`}
                        className="flex items-start justify-between gap-2"
                      >
                        <div>
                          <strong className="text-[#F6F3E6] font-semibold">
                            {ORDER_STATUS_LABELS[entry.status]}:
                          </strong>{' '}
                          <span>{entry.note}</span>
                        </div>
                        <span className="font-mono tabular-nums shrink-0 text-[10px]">
                          {new Date(entry.timestamp).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
