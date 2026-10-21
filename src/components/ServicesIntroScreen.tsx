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
            className="font-display text-[26px] sm:text-[30px] font-extrabold tracking-tight text-[#F7F1EA] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            ¿Qué necesitas hoy?
          </h1>
          <p className="text-sm text-[#B3A090] leading-relaxed">
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
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: isActive ? 1 : 0.97 }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.1 + index * 0.1 },
                  y: { duration: 0.55, delay: 0.1 + index * 0.1, ease: [0.22, 1, 0.36, 1] },
                  scale: { type: 'spring', stiffness: 320, damping: 24 },
                }}
                className={`group rounded-[28px] p-4 transition-colors duration-300 cursor-pointer flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-3 ${
                  isActive
                    ? 'vg-card-hero border border-[#D4A574]/40'
                    : 'bg-[#24140A] border border-white/[0.07] hover:border-white/15'
                }`}
              >
                {/* 3D Volumetric Render Stage */}
                <div className="w-24 h-20 sm:w-full sm:h-28 rounded-3xl bg-[#150B05] border border-white/[0.04] overflow-hidden shrink-0 flex items-center justify-center relative">
                  {isComprar ? (
                    <Store3DRender active={isActive} />
                  ) : (
                    <Parcel3DRender active={isActive} />
                  )}
                  <span className="hidden sm:inline-block absolute top-2 right-2.5 text-[10px] font-mono text-[#D4A574] tabular-nums">
                    {isComprar ? 'S/ 6.00' : 'S/ 7.50'}
                  </span>
                </div>

                {/* Editorial Copy */}
                <div className="space-y-1 min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-[16px] font-bold text-[#F7F1EA] tracking-tight">
                      {service.title}
                    </h2>
                    <span className="sm:hidden text-[11px] font-mono text-[#D4A574] tabular-nums shrink-0">
                      {isComprar ? 'S/ 6.00' : 'S/ 7.50'}
                    </span>
                  </div>
                  <p className="text-xs text-[#B3A090] leading-relaxed">
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
          className="group w-full h-[54px] px-6 rounded-full vg-btn-primary font-display text-[15px] font-bold inline-flex items-center justify-between cursor-pointer shadow-[0_14px_32px_-12px_rgba(200,153,95,0.55)]"
        >
          <span>Continuar</span>
          <ArrowRight size={18} weight="bold" className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full h-10 px-4 rounded-full bg-transparent hover:bg-white/[0.04] active:bg-white/[0.07] text-[#B3A090] hover:text-[#F7F1EA] text-xs font-medium transition-all duration-200 active:scale-[0.97] cursor-pointer"
        >
          Omitir introducción
        </button>
      </div>
    </div>
  );
};
