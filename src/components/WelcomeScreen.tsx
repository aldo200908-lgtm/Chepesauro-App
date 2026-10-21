import React from 'react';
import { ArrowRight, NavigationArrow } from '@phosphor-icons/react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-1">
      <div className="my-auto space-y-6">
        {/* Live Spatial Route Telemetry Strip (High-contrast asymmetric bar, not a generic box) */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#111815] border border-white/[0.07]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#22C58B]/15 text-[#22C58B] flex items-center justify-center shrink-0">
              <NavigationArrow size={18} weight="fill" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-[#F2F5F3] truncate">
                <span>Jr. Lima</span>
                <span className="text-[#22C58B]" aria-hidden="true">→</span>
                <span>Av. La Torre</span>
              </div>
              <p className="text-[11px] text-[#8E9893] truncate mt-0.5">
                Desvío automático por Plaza Mayor peatonal
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 pl-2 border-l border-white/[0.07]">
            <span className="text-xs font-mono font-bold text-[#22C58B] tabular-nums block">
              5 min
            </span>
            <span className="text-[11px] font-mono text-[#8E9893] tabular-nums block">
              S/ 4.50
            </span>
          </div>
        </div>

        {/* Bold Editorial Typography */}
        <div className="space-y-3 text-left">
          <h1
            className="font-display text-[32px] sm:text-[36px] font-extrabold tracking-tight text-[#F2F5F3] leading-[1.08]"
            style={{ textWrap: 'balance' }}
          >
            Tus entregas, más fáciles
          </h1>

          <p className="text-[15px] text-[#94A09A] leading-relaxed max-w-[36ch]">
            Compra en comercios locales o envía paquetes por toda la ciudad con navegación 3D en tiempo real.
          </p>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={onStart}
          className="w-full h-[54px] px-6 rounded-2xl vg-btn-primary font-display text-[15px] font-bold inline-flex items-center justify-between cursor-pointer shadow-[0_10px_30px_-10px_rgba(16,185,129,0.45)]"
        >
          <span>Comenzar</span>
          <ArrowRight size={18} weight="bold" className="shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
