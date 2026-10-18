import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Bike,
  XCircle,
  ChevronDown,
  ChevronUp,
  Store,
  Package,
} from 'lucide-react';
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
}

export const ClientOrdersView: React.FC<ClientOrdersViewProps> = ({
  orders,
  onCreateOrder,
  onCancelOrder,
  onOpenOrderInMap,
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
          <h1 className="font-display text-xl font-bold text-[#102F27]">
            Pedidos de Cliente
          </h1>
          <span className="text-xs font-semibold text-[#078F68] tabular-nums">
            {orders.length} registrados
          </span>
        </div>
        <p className="text-xs text-[#64877C]">
          Flujo de demostración · Tarifas e importes ficticios en soles (S/)
        </p>
      </div>

      {/* Create Order Form (Encargo Personalizado o Compra en Negocio) */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-4 space-y-3.5"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[#102F27]">
            Crear nuevo pedido (Demo)
          </h2>
          <span className="text-[11px] font-semibold text-[#078F68] tabular-nums">
            Tarifa demo: {formatPenCurrency(demoDeliveryFee)}
          </span>
        </div>

        {/* Service Type Toggle */}
        <div
          role="group"
          aria-label="Tipo de pedido"
          className="grid grid-cols-2 gap-2 p-1 bg-white rounded-full border border-[#DCECE5]"
        >
          <button
            type="button"
            onClick={() => setServiceType('encargo_personalizado')}
            className={`py-2 px-3 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              serviceType === 'encargo_personalizado'
                ? 'bg-[#078F68] text-white'
                : 'text-[#64877C] hover:text-[#102F27]'
            }`}
          >
            Encargo personalizado
          </button>
          <button
            type="button"
            onClick={() => setServiceType('compra_negocio')}
            className={`py-2 px-3 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              serviceType === 'compra_negocio'
                ? 'bg-[#078F68] text-white'
                : 'text-[#64877C] hover:text-[#102F27]'
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
                className="block text-[11px] font-semibold text-[#064B3C] mb-1"
              >
                Nombre del negocio de recogida
              </label>
              <input
                id="business-name-input"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Bodega y Panadería San Martín"
                className="w-full h-10 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
              />
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <label
                  htmlFor="item-name-input"
                  className="block text-[11px] font-semibold text-[#064B3C] mb-1"
                >
                  Producto (Demo)
                </label>
                <input
                  id="item-name-input"
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full h-10 px-3 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="item-qty-input"
                  className="block text-[11px] font-semibold text-[#064B3C] mb-1"
                >
                  Cant.
                </label>
                <input
                  id="item-qty-input"
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#078F68]"
                />
              </div>
              <div className="col-span-4">
                <label
                  htmlFor="item-price-input"
                  className="block text-[11px] font-semibold text-[#064B3C] mb-1"
                >
                  Precio (S/)
                </label>
                <input
                  id="item-price-input"
                  type="number"
                  step="0.50"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#078F68]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="custom-desc-input"
              className="block text-[11px] font-semibold text-[#064B3C] mb-1"
            >
              Descripción del encargo
            </label>
            <input
              id="custom-desc-input"
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Ej. Enviar llaves y sobre con documentos"
              className="w-full h-10 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
            />
          </div>
        )}

        {/* Pickup & Dropoff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="pickup-address-input"
              className="block text-[11px] font-semibold text-[#064B3C] mb-1"
            >
              Dirección de recogida
            </label>
            <input
              id="pickup-address-input"
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Ej. Av. Arequipa 520, Lince"
              className="w-full h-10 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
            />
          </div>

          <div>
            <label
              htmlFor="dropoff-address-input"
              className="block text-[11px] font-semibold text-[#064B3C] mb-1"
            >
              Dirección de destino
            </label>
            <input
              id="dropoff-address-input"
              type="text"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="Ej. Calle Schell 240, Miraflores"
              className="w-full h-10 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="instructions-input"
              className="block text-[11px] font-semibold text-[#064B3C] mb-1"
            >
              Instrucciones y referencias
            </label>
            <input
              id="instructions-input"
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej. Portón negro, tocar timbre 2"
              className="w-full h-10 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
            />
          </div>

          <div>
            <label
              htmlFor="payment-method-select"
              className="block text-[11px] font-semibold text-[#064B3C] mb-1"
            >
              Método de pago (Demo)
            </label>
            <select
              id="payment-method-select"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as DemoPaymentMethod)
              }
              className="w-full h-10 px-3 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
            >
              <option value="Yape / Plin (Demo)">Yape / Plin (Demo)</option>
              <option value="Efectivo (Demo)">Efectivo (Demo)</option>
              <option value="Tarjeta (Demo)">Tarjeta (Demo)</option>
            </select>
          </div>
        </div>

        {/* Cost Summary Preview */}
        <div className="pt-2 border-t border-[#DCECE5] flex items-center justify-between text-xs text-[#064B3C] tabular-nums">
          <span>
            {serviceType === 'compra_negocio'
              ? `Productos: ${formatPenCurrency(previewProductsCost)} · Envío demo: ${formatPenCurrency(demoDeliveryFee)}`
              : `Tarifa de entrega demo: ${formatPenCurrency(demoDeliveryFee)}`}
          </span>
          <strong className="font-bold text-[#102F27]">
            Total: {formatPenCurrency(previewTotal)}
          </strong>
        </div>

        {formError && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            {formError}
          </p>
        )}

        {feedbackBanner && (
          <p
            role="status"
            className="text-xs font-semibold text-[#078F68]"
          >
            {feedbackBanner}
          </p>
        )}

        <button
          type="submit"
          className="w-full h-11 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Registrar pedido de demostración</span>
        </button>
      </form>

      {/* Created Orders List */}
      <div className="space-y-3" role="list" aria-label="Lista de pedidos del cliente">
        {orders.map((order) => {
          const isCancellable = canClientCancelOrder(order.status);
          const isHistoryOpen = expandedHistoryId === order.id;
          const TypeIcon = order.type === 'compra_negocio' ? Store : Package;

          return (
            <div
              key={order.id}
              role="listitem"
              className="rounded-3xl bg-white border border-[#DCECE5] p-4 space-y-3"
            >
              {/* Order Header: ID, Type & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#078F68] flex flex-wrap items-center gap-1.5 tabular-nums">
                    <span>{order.id}</span>
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
                          ? 'text-red-600 font-bold'
                          : 'text-[#064B3C] font-bold'
                      }
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <TypeIcon
                      className="w-4 h-4 text-[#078F68] shrink-0"
                      aria-hidden="true"
                    />
                    <h3 className="font-display text-sm font-bold text-[#102F27] truncate">
                      {order.type === 'compra_negocio'
                        ? order.businessName
                        : order.customDescription}
                    </h3>
                  </div>
                </div>

                <span className="font-display text-sm font-bold text-[#078F68] tabular-nums shrink-0">
                  {formatPenCurrency(order.totalAmount)}
                </span>
              </div>

              {/* Items breakdown if Compra en negocio */}
              {order.type === 'compra_negocio' &&
                order.items &&
                order.items.length > 0 && (
                  <div className="text-xs text-[#64877C] pt-1 border-t border-[#DCECE5]/70 space-y-0.5 tabular-nums">
                    {order.items.map((item, idx) => (
                      <p key={idx}>
                        {item.quantity}x {item.name} ({formatPenCurrency(item.unitPrice)})
                      </p>
                    ))}
                  </div>
                )}

              {/* Pickup, Dropoff & Instructions */}
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

              {/* Assigned Driver & Cost Breakdown */}
              <div className="pt-2.5 border-t border-[#DCECE5] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#102F27]">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Bike
                      className="w-3.5 h-3.5 text-[#078F68] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {order.assignedDriver
                        ? `Motorizado: ${order.assignedDriver.name} · Placa ${order.assignedDriver.vehiclePlate}`
                        : 'Sin motorizado asignado aún'}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64877C] tabular-nums">
                  <span>
                    {order.productsCost > 0
                      ? `Productos: ${formatPenCurrency(order.productsCost)} · `
                      : ''}
                    Envío demo: {formatPenCurrency(order.demoDeliveryFee)} · Pago:{' '}
                    {order.paymentMethod}
                  </span>
                  <strong className="text-[#102F27]">
                    Total: {formatPenCurrency(order.totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Actions: History Toggle, Map & Valid Cancellation */}
              <div className="pt-2 border-t border-[#DCECE5] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedHistoryId(isHistoryOpen ? null : order.id)
                  }
                  className="h-8 px-3 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Historial ({order.statusHistory.length})</span>
                  {isHistoryOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenOrderInMap(order.id)}
                    className="h-8 px-3 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Ver ruta
                  </button>

                  {isCancellable && (
                    <button
                      type="button"
                      onClick={() => onCancelOrder(order.id)}
                      className="h-8 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cancelar pedido</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status History Log */}
              {isHistoryOpen && (
                <div className="pt-2.5 border-t border-[#DCECE5] space-y-2">
                  <p className="text-[11px] font-bold text-[#064B3C]">
                    Historial de cambios de estado
                  </p>
                  <ol className="space-y-1.5 text-[11px] text-[#64877C]">
                    {order.statusHistory.map((entry, idx) => (
                      <li
                        key={`${entry.status}-${idx}`}
                        className="flex items-start justify-between gap-2"
                      >
                        <div>
                          <strong className="text-[#102F27] font-semibold">
                            {ORDER_STATUS_LABELS[entry.status]}:
                          </strong>{' '}
                          <span>{entry.note}</span>
                        </div>
                        <span className="tabular-nums shrink-0 text-[10px]">
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
