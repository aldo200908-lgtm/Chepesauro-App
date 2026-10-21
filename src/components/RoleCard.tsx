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
      className={`group relative w-full text-left rounded-[28px] p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D8438] focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-pointer transition-all duration-300 active:scale-[0.98] ${
        isSelected
          ? 'bg-[linear-gradient(165deg,#6A4328_0%,#3B2212_55%,#26150B_100%)] border border-[#86C77A] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]'
          : 'bg-[#F2F5EA] border border-[#DCE5D5] hover:border-[#A9D99E]'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Editorial Copy & Selection Status */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#86C77A] text-[#10230F] vg-pop'
                  : 'border border-[#84998B] bg-transparent group-hover:border-[#3D8438]'
              }`}
              aria-hidden="true"
            >
              {isSelected && <Check size={12} weight="bold" />}
            </div>

            <h2 className={`font-display text-[17px] font-bold tracking-tight ${isSelected ? 'text-[#F6F3E6]' : 'text-[#131A14]'}`}>
              {option.title}
            </h2>
          </div>

          <p className={`text-xs sm:text-sm leading-relaxed pl-7 ${isSelected ? 'text-[#CFE0D3]' : 'text-[#5F7364]'}`}>
            {option.description}
          </p>
        </div>

        {/* Right: Studio 3D Isometric Miniature Stage */}
        <div
          className={`w-24 h-20 rounded-2xl shrink-0 overflow-hidden border transition-colors ${
            isSelected
              ? 'bg-[#0F2016] border-[#86C77A]/40'
              : 'bg-[#0A150E] border-white/[0.04]'
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
