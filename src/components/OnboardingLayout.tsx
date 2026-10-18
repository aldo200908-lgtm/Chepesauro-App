import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { OnboardingStepNumber } from '../utils/onboarding';

interface OnboardingLayoutProps {
  step: OnboardingStepNumber;
  onBack?: () => void;
  children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  step,
  onBack,
  children,
}) => {
  return (
    <div
      data-testid="onboarding-layout"
      className="app-viewport flex flex-col justify-between bg-[#FFFFFF] text-[#102F27] select-none"
    >
      {/* Top Bar of Onboarding: Brand / Back Button + Discreet Progress Indicator */}
      <header className="shrink-0 px-5 pb-2 onboarding-safe-top">
        <div className="max-w-md mx-auto flex items-center justify-between min-h-[48px]">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Volver al paso anterior"
                className="w-10 h-10 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#078F68] text-white flex items-center justify-center font-display font-bold text-base shadow-xs">
                V
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-[#102F27]">
                VerdeGo
              </span>
            </div>
          </div>

          {/* Discreet 3-step progress indicator */}
          <div
            role="status"
            aria-label={`Paso ${step} de 3`}
            className="flex items-center gap-1.5"
          >
            {[1, 2, 3].map((idx) => {
              const isCurrent = idx === step;
              const isDone = idx < step;
              return (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    isCurrent
                      ? 'w-7 bg-[#078F68]'
                      : isDone
                      ? 'w-3 bg-[#078F68]/45'
                      : 'w-3 bg-[#DCECE5]'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Onboarding Screen Body */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden px-5 flex flex-col">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between pt-3 onboarding-safe-bottom">
          {children}
        </div>
      </main>
    </div>
  );
};
