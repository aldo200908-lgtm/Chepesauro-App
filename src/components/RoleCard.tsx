import React from 'react';
import { Check } from '@phosphor-icons/react';
import { RoleOption } from '../utils/onboarding';
import { ClientRole3DRender, DriverRole3DRender } from './Onboarding3DVisuals';

interface RoleCardProps {
  option: RoleOption;
  isSelected: boolean;
  onSelect: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  option,
  isSelected,
  onSelect,
}) => {
  const isClient = option.id === 'usuario';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`group relative w-full text-left rounded-[28px] p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-2 focus-visible:ring-offset-[#150B05] cursor-pointer transition-all duration-300 active:scale-[0.98] ${
        isSelected
          ? 'bg-[linear-gradient(165deg,#6A4328_0%,#3B2212_55%,#26150B_100%)] border border-[#D4A574] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]'
          : 'bg-[#24140A] border border-white/[0.06] hover:bg-[#2E1A0E] hover:border-white/15'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Editorial Copy & Selection Status */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#D4A574] text-[#2A1608] vg-pop'
                  : 'border border-white/20 bg-transparent group-hover:border-white/40'
              }`}
              aria-hidden="true"
            >
              {isSelected && <Check size={12} weight="bold" />}
            </div>

            <h2 className="font-display text-[17px] font-bold tracking-tight text-[#F7F1EA]">
              {option.title}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#B3A090] leading-relaxed pl-7">
            {option.description}
          </p>
        </div>

        {/* Right: Studio 3D Isometric Miniature Stage */}
        <div
          className={`w-24 h-20 rounded-2xl shrink-0 overflow-hidden border transition-colors ${
            isSelected
              ? 'bg-[#1F1109] border-[#D4A574]/40'
              : 'bg-[#150B05] border-white/[0.04]'
          }`}
        >
          {isClient ? (
            <ClientRole3DRender selected={isSelected} />
          ) : (
            <DriverRole3DRender selected={isSelected} />
          )}
        </div>
      </div>
    </button>
  );
};
