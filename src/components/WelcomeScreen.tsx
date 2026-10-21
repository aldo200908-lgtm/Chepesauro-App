import React from 'react';
import { ArrowRight, NavigationArrow } from '@phosphor-icons/react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-1">
      <div className="my-auto space-y-6">
        {/* Franja de ruta en vivo: tarjeta clara con icono verde de la marca */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[24px] bg-[#F2F5EA] border border-[#DCE5D5]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#3D8438] text-white flex items-center justify-center shrink-0">
              <NavigationArrow size={18} weight="fill" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#131A14] truncate">
                <span>Jr. Lima</span>
                <span className="text-[#D2362A]" aria-hidden="true">→</span>
                <span>Av. La Torre</span>
              </div>
              <p className="text-[11px] text-[#5F7364] truncate mt-0.5">
                Desvío automático por Plaza Mayor peatonal
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 pl-3 border-l border-[#DCE5D5]">
            <span className="text-xs font-mono font-bold text-[#3D8438] tabular-nums block">
              5 min
            </span>
            <span className="text-[11px] font-mono text-[#5F7364] tabular-nums block">
              S/ 4.50
            </span>
          </div>
        </div>

        <div className="space-y-3 text-left">
          <h1
            className="font-display text-[32px] sm:text-[36px] font-extrabold tracking-tight text-[#131A14] leading-[1.08]"
            style={{ textWrap: 'balance' }}
          >
            Tus entregas, más fáciles
          </h1>

          <p className="text-[15px] text-[#5F7364] leading-relaxed max-w-[36ch]">
            Compra en comercios locales o envía paquetes por toda la ciudad con navegación 3D en tiempo real.
          </p>
        </div>
      </div>

      <div className="pt-6">
        <button
          type="button"
          onClick={onStart}
          className="w-full h-[54px] px-6 rounded-full vg-btn-primary font-display text-[15px] font-bold inline-flex items-center justify-between cursor-pointer"
        >
          <span>Comenzar</span>
          <ArrowRight size={18} weight="bold" className="shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
