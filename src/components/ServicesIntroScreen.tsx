import React from 'react';
import { Store, Package, ArrowRight } from 'lucide-react';
import { SERVICE_OPTIONS } from '../utils/onboarding';

interface ServicesIntroScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

export const ServicesIntroScreen: React.FC<ServicesIntroScreenProps> = ({
  onContinue,
  onSkip,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-2">
      <div className="space-y-6 pt-2">
        {/* Heading & Description */}
        <div className="space-y-2">
          <h1
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#102F27] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            ¿Qué necesitas hoy?
          </h1>
          <p className="text-sm sm:text-base text-[#64877C] leading-relaxed">
            Todo lo que necesitas, desde una sola aplicación
          </p>
        </div>

        {/* Two Large Visually Differentiated Service Cards */}
        <div className="space-y-4" role="list" aria-label="Servicios disponibles">
          {SERVICE_OPTIONS.map((service, index) => {
            const isComprar = service.id === 'comprar';
            const Icon = isComprar ? Store : Package;

            return (
              <div
                key={service.id}
                role="listitem"
                className={`rounded-3xl p-5 sm:p-6 border transition-all ${
                  index === 0
                    ? 'bg-[#EAF8F2] border-[#DCECE5]'
                    : 'bg-[#FFFFFF] border-[#DCECE5] shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-[#078F68] text-white'
                        : 'bg-[#EAF8F2] text-[#078F68] border border-[#DCECE5]'
                    }`}
                  >
                    <Icon className="w-7 h-7 stroke-[2]" aria-hidden="true" />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#078F68] block">
                      {service.badge}
                    </span>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#102F27] tracking-tight">
                      {service.title}
                    </h2>
                    <p className="text-sm text-[#64877C] leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="pt-4 space-y-2.5">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-14 px-6 rounded-full bg-[#078F68] hover:bg-[#064B3C] active:scale-[0.99] text-white font-display text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-md shadow-[#078F68]/20 transition-all cursor-pointer"
        >
          <span>Continuar</span>
          <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full h-11 px-6 rounded-full bg-transparent hover:bg-[#EAF8F2] text-[#64877C] hover:text-[#102F27] text-sm font-semibold transition-colors cursor-pointer"
        >
          Omitir
        </button>
      </div>
    </div>
  );
};
