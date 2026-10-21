import React, { useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import {
  ArrowLeft,
  Bell,
  Clock,
  Heart,
  MagnifyingGlass,
  MapPin,
  Package,
  Plus,
  Storefront,
  Motorcycle,
} from '@phosphor-icons/react';
import { SERVICE_OPTIONS, ServiceOption } from '../utils/onboarding';
import logoUrl from '../assets/chepesaurio-logo.png';

interface ClientHomeScreenProps {
  /** Lleva al cliente a la pestaña de pedidos para crear la compra o el encargo. */
  onOpenOrders: () => void;
}

type CategoryId = 'todo' | ServiceOption['id'];

const CATEGORIES: { id: CategoryId; label: string; Icon: React.ElementType }[] = [
  { id: 'todo', label: 'Todo', Icon: Motorcycle },
  { id: 'comprar', label: 'Comprar', Icon: Storefront },
  { id: 'enviar', label: 'Enviar', Icon: Package },
];

// Datos demo del servicio (el precio es el mismo que se muestra en el onboarding).
const SERVICE_META: Record<
  ServiceOption['id'],
  { fee: string; eta: string; coverage: string }
> = {
  comprar: { fee: 'S/ 6.00', eta: '25 min', coverage: 'Negocios de toda la ciudad' },
  enviar: { fee: 'S/ 7.50', eta: '30 min', coverage: 'Recojo y entrega en toda la ciudad' },
};

/** Plato blanco con el dinosaurio: reemplaza a la taza de café de la referencia. */
const LogoPlate: React.FC<{ size: number; className?: string }> = ({
  size,
  className = '',
}) => (
  <div
    className={`rounded-full bg-white grid place-items-center shadow-[0_18px_30px_-12px_rgba(12,26,17,0.65)] ring-[6px] ring-white/70 ${className}`}
    style={{ width: size, height: size }}
  >
    <img
      src={logoUrl}
      alt="Chepesaurio Delivery"
      className="object-contain"
      style={{ width: size * 0.72, height: size * 0.72 }}
    />
  </div>
);

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({
  onOpenOrders,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId>('todo');
  const [detail, setDetail] = useState<ServiceOption | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const services = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICE_OPTIONS.filter((s) => {
      const matchesCategory = category === 'todo' || s.id === category;
      const matchesQuery =
        q === '' ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));

  const detailMeta = detail ? SERVICE_META[detail.id] : null;

  return (
    <div className="vg-light-canvas -mx-4 -my-4 px-5 pt-5 pb-8 min-h-full">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Cabecera: avatar, ubicación y notificaciones */}
        <header className="flex items-center justify-between gap-3 pt-[env(safe-area-inset-top)]">
          <div className="w-11 h-11 rounded-full bg-[#E4F0DF] grid place-items-center overflow-hidden shrink-0">
            <img src={logoUrl} alt="" className="w-9 h-9 object-contain" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={20} weight="fill" className="text-[#D2362A] shrink-0" aria-hidden="true" />
            <span className="font-display text-xl font-bold text-[#131A14] truncate">
              Puno
            </span>
          </div>

          <button
            type="button"
            aria-label="Notificaciones"
            className="w-11 h-11 rounded-full grid place-items-center text-[#131A14] hover:bg-[#F2F5EA] transition-colors cursor-pointer shrink-0"
          >
            <Bell size={22} weight="regular" aria-hidden="true" />
          </button>
        </header>

        {/* Buscador */}
        <div className="flex items-center gap-2 h-14 pl-5 pr-2 rounded-full bg-[#F2F5EA]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar comercios o encargos"
            aria-label="Buscar servicios"
            className="flex-1 min-w-0 bg-transparent text-sm text-[#131A14] placeholder:text-[#84998B] focus:outline-none"
          />
          <span
            className="w-10 h-10 rounded-full bg-[#D2362A] text-white grid place-items-center shrink-0"
            aria-hidden="true"
          >
            <MagnifyingGlass size={20} weight="bold" />
          </span>
        </div>

        {/* Categorías */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-extrabold text-[#131A14]">
            Categorías
          </h2>
          <div
            role="tablist"
            aria-label="Categorías de servicio"
            className="flex gap-2.5 overflow-x-auto -mx-5 px-5 pb-1 [scrollbar-width:none]"
          >
            {CATEGORIES.map(({ id, label, Icon }) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(id)}
                  className="vg-chip cursor-pointer"
                >
                  <Icon size={16} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tarjetas de servicio: el dinosaurio sobresale de la tarjeta, como la taza */}
        {services.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#5F7364]">
            No encontramos servicios con esa búsqueda. Prueba con “comprar” o “enviar”.
          </p>
        ) : (
          <div
            className="vg-stagger flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 pt-24 pb-4 [scrollbar-width:none]"
            aria-label="Servicios disponibles"
          >
            {services.map((service) => {
              const meta = SERVICE_META[service.id];
              return (
                <article
                  key={service.id}
                  className="relative snap-center shrink-0 w-[78%] max-w-[300px]"
                >
                  <LogoPlate
                    size={168}
                    className="absolute left-1/2 -translate-x-1/2 -top-[84px] z-10 pointer-events-none"
                  />
                  <button
                    type="button"
                    onClick={() => setDetail(service)}
                    className="vg-card-hero block w-full text-left pt-24 px-5 pb-5 cursor-pointer"
                  >
                    <span className="vg-badge">
                      <Clock size={14} weight="fill" aria-hidden="true" />
                      {meta.eta}
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-[#F6F3E6] pr-14">
                      {service.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#CFE0D3] line-clamp-2 pr-14">
                      {service.badge}
                    </p>
                    <p className="mt-4 font-display text-xl font-bold text-[#F6F3E6] tabular-nums">
                      {meta.fee}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenOrders}
                    aria-label={`Pedir: ${service.title}`}
                    className="vg-fab absolute right-5 bottom-5 cursor-pointer"
                  >
                    <Plus size={22} weight="bold" aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Detalle del servicio (segunda pantalla de la referencia) */}
      <Drawer.Root
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-[#0C1A11]/70" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[94dvh] flex-col rounded-t-[36px] bg-white text-[#131A14] shadow-2xl focus:outline-none overflow-hidden">
            {detail && detailMeta && (
              <div className="overflow-y-auto onboarding-safe-bottom">
                {/* Panel verde con el plato */}
                <div className="relative bg-[linear-gradient(165deg,#2E6B3A_0%,#21402B_55%,#12251A_100%)] rounded-b-[36px] px-5 pt-5 pb-8">
                  <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setDetail(null)}
                        aria-label="Volver"
                        className="w-11 h-11 rounded-full border border-white/50 text-white grid place-items-center cursor-pointer active:scale-[0.94] transition-transform"
                      >
                        <ArrowLeft size={20} weight="bold" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(detail.id)}
                        aria-pressed={Boolean(favorites[detail.id])}
                        aria-label="Marcar como favorito"
                        className="w-11 h-11 rounded-full border border-white/50 text-white grid place-items-center cursor-pointer active:scale-[0.94] transition-transform"
                      >
                        <Heart
                          size={20}
                          weight={favorites[detail.id] ? 'fill' : 'regular'}
                          className={favorites[detail.id] ? 'text-[#E25A4E]' : ''}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <div className="flex justify-center mt-2">
                      <LogoPlate size={210} />
                    </div>
                  </div>
                </div>

                <div className="max-w-lg mx-auto px-5 pt-5 pb-6 space-y-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4F0DF] text-[#2F6B30] text-sm font-semibold">
                      <Clock size={14} weight="fill" aria-hidden="true" />
                      {detailMeta.eta}
                    </span>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <Drawer.Title className="font-display text-3xl font-extrabold text-[#131A14]">
                        {detail.title}
                      </Drawer.Title>
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#F2F5EA] text-sm font-bold text-[#131A14] tabular-nums">
                        {detailMeta.fee}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-display text-base font-bold">Acerca del servicio</h3>
                    <Drawer.Description className="text-sm text-[#5F7364] leading-relaxed">
                      {detail.description}
                    </Drawer.Description>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[20px] bg-[#F2F5EA] px-4 py-3">
                      <dt className="text-[#5F7364]">Tarifa</dt>
                      <dd className="font-display font-bold tabular-nums">{detailMeta.fee}</dd>
                    </div>
                    <div className="rounded-[20px] bg-[#F2F5EA] px-4 py-3">
                      <dt className="text-[#5F7364]">Cobertura</dt>
                      <dd className="font-display font-bold leading-snug">{detailMeta.coverage}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => {
                      setDetail(null);
                      onOpenOrders();
                    }}
                    className="w-full h-[58px] rounded-full vg-btn-primary font-display text-base font-bold cursor-pointer"
                  >
                    {detail.id === 'comprar' ? 'Comprar ahora' : 'Pedir envío ahora'}
                  </button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};
