import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { SERVICE_OPTIONS } from '../utils/onboarding';
import { Store3DRender, Parcel3DRender } from './Onboarding3DVisuals';

interface ServicesIntroScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

export const ServicesIntroScreen: React.FC<ServicesIntroScreenProps> = ({
  onContinue,
  onSkip,
}) => {
  const [activeId, setActiveId] = useState<'comprar' | 'enviar'>('comprar');

  return (
    <div className="flex-1 flex flex-col justify-between py-1">
      <div className="my-auto space-y-5">
        {/* Editorial Heading */}
        <div className="space-y-1.5 text-left">
          <h1
            className="font-display text-[26px] sm:text-[30px] font-extrabold tracking-tight text-[#F2F5F3] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            ¿Qué necesitas hoy?
          </h1>
          <p className="text-sm text-[#8E9893] leading-relaxed">
            Todo lo que necesitas, desde una sola aplicación
          </p>
        </div>

        {/* 2-Column Spatial Bento Cards with Studio 3D Renders (Breaks stacked gray rows) */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          role="list"
          aria-label="Servicios disponibles"
        >
          {SERVICE_OPTIONS.map((service, index) => {
            const isComprar = service.id === 'comprar';
            const isActive = activeId === service.id;

            return (
              <motion.div
                key={service.id}
                role="listitem"
                onMouseEnter={() => setActiveId(service.id)}
                onClick={() => setActiveId(service.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.06 }}
                className={`group rounded-2xl p-4 transition-all cursor-pointer flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-3 ${
                  isActive
                    ? 'bg-[#121D18] border border-[#22C58B]/50'
                    : 'bg-[#111614] border border-white/[0.06] hover:border-white/15'
                }`}
              >
                {/* 3D Volumetric Render Stage */}
                <div className="w-24 h-20 sm:w-full sm:h-28 rounded-xl bg-[#0B100E] border border-white/[0.04] overflow-hidden shrink-0 flex items-center justify-center relative">
                  {isComprar ? (
                    <Store3DRender active={isActive} />
                  ) : (
                    <Parcel3DRender active={isActive} />
                  )}
                  <span className="hidden sm:inline-block absolute top-2 right-2.5 text-[10px] font-mono text-[#22C58B] tabular-nums">
                    {isComprar ? 'S/ 6.00' : 'S/ 7.50'}
                  </span>
                </div>

                {/* Editorial Copy */}
                <div className="space-y-1 min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-[16px] font-bold text-[#F2F5F3] tracking-tight">
                      {service.title}
                    </h2>
                    <span className="sm:hidden text-[11px] font-mono text-[#22C58B] tabular-nums shrink-0">
                      {isComprar ? 'S/ 6.00' : 'S/ 7.50'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E9893] leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="pt-5 space-y-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-[54px] px-6 rounded-2xl vg-btn-primary font-display text-[15px] font-bold inline-flex items-center justify-between cursor-pointer shadow-[0_10px_30px_-10px_rgba(16,185,129,0.45)]"
        >
          <span>Continuar</span>
          <ArrowRight size={18} weight="bold" className="shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full h-10 px-4 rounded-xl bg-transparent hover:bg-white/[0.04] active:bg-white/[0.07] text-[#8E9893] hover:text-[#F2F5F3] text-xs font-medium transition-colors cursor-pointer"
        >
          Omitir introducción
        </button>
      </div>
    </div>
  );
};
