import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CubeTransparent } from '@phosphor-icons/react';
import { OnboardingStepNumber, UserRole } from '../utils/onboarding';
import { OnboardingSpatialStage } from './OnboardingSpatialStage';

interface OnboardingLayoutProps {
  step: OnboardingStepNumber;
  onBack?: () => void;
  selectedRole?: UserRole | null;
  children: React.ReactNode;
}

const STEP_LABELS: Record<OnboardingStepNumber, string> = {
  1: 'Bienvenida',
  2: 'Servicios',
  3: 'Perfil',
};

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  step,
  onBack,
  selectedRole = null,
  children,
}) => {
  // Step 1 gives the 3D city stage a generous 48% viewport showcase;
  // Steps 2 & 3 compact the 3D stage to 30% while camera swoops into the street level.
  const stageHeightClass =
    step === 1
      ? 'h-[44dvh] sm:h-[48dvh] min-h-[250px]'
      : 'h-[26dvh] sm:h-[30dvh] min-h-[168px]';

  return (
    <div
      data-testid="onboarding-layout"
      className="app-viewport bg-[#150B05] flex flex-col justify-between text-[#F7F1EA] select-none relative overflow-hidden"
    >
      {/* Floating Translucent Top Bar over the Full-Bleed 3D Stage */}
      <header className="absolute top-0 inset-x-0 z-30 px-5 onboarding-safe-top pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between min-h-[52px]">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Volver al paso anterior"
                className="w-11 h-11 rounded-full bg-[#24140A]/85 backdrop-blur-md border border-white/10 hover:border-white/20 active:bg-[#3B2212] text-[#F7F1EA] flex items-center justify-center transition-all duration-200 active:scale-[0.94] cursor-pointer shadow-lg"
              >
                <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              </button>
            )}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#24140A]/80 backdrop-blur-md border border-white/[0.08]">
              <div className="w-6 h-6 rounded-full bg-[#D4A574] text-[#2A1608] flex items-center justify-center font-display font-extrabold text-xs tracking-tight">
                V
              </div>
              <span className="font-display text-[15px] font-bold tracking-tight text-[#F7F1EA] pr-1">
                VerdeGo
              </span>
            </div>
          </div>

          {/* Step Progress Indicator */}
          <div
            role="status"
            aria-label={`Paso ${step} de 3: ${STEP_LABELS[step]}`}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#24140A]/80 backdrop-blur-md border border-white/[0.08]"
          >
            {[1, 2, 3].map((idx) => {
              const isCurrent = idx === step;
              const isDone = idx < step;
              return (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-7 bg-[#D4A574]'
                      : isDone
                      ? 'w-2 bg-[#C8995F]/60'
                      : 'w-2 bg-white/15'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* FULL-BLEED INTERACTIVE 3D WEBGL URBAN STAGE */}
      <div
        className={`relative w-full shrink-0 transition-all duration-500 ease-out ${stageHeightClass}`}
      >
        <OnboardingSpatialStage step={step} selectedRole={selectedRole} />

        {/* Subtle Interactive 3D Hint on Step 1 */}
        {step === 1 && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F1109]/85 backdrop-blur-md border border-white/[0.08] text-[11px] text-[#B3A090]">
            <CubeTransparent size={13} className="text-[#D4A574]" />
            <span>Puno 3D en vivo · Arrastra para rotar</span>
          </div>
        )}
      </div>

      {/* ARCHITECTURAL BOTTOM SHEET (Breaks generic centered card-stacking) */}
      <main className="relative z-20 flex-1 min-h-0 w-full -mt-4 rounded-t-[36px] bg-[#1A0E07] border-t border-white/[0.09] shadow-[0_-20px_50px_rgba(0,0,0,0.85)] overflow-y-auto overflow-x-hidden px-6 flex flex-col">
        {/* Subtle Architectural Handle Bar */}
        <div className="w-9 h-1 rounded-full bg-white/12 mx-auto mt-3 shrink-0" aria-hidden="true" />

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between pt-4 onboarding-safe-bottom">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
