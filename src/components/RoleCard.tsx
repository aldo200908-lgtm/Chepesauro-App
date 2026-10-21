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
      className={`group relative w-full text-left rounded-2xl p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C58B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B100E] cursor-pointer transition-all ${
        isSelected
          ? 'bg-[#121F1A] border border-[#22C58B] shadow-[0_12px_30px_-14px_rgba(16,185,129,0.35)]'
          : 'bg-[#111614] border border-white/[0.06] hover:bg-[#151C19] hover:border-white/15'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Editorial Copy & Selection Status */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#22C58B] text-[#050E0A]'
                  : 'border border-white/20 bg-transparent group-hover:border-white/40'
              }`}
              aria-hidden="true"
            >
              {isSelected && <Check size={12} weight="bold" />}
            </div>

            <h2 className="font-display text-[17px] font-bold tracking-tight text-[#F2F5F3]">
              {option.title}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#8E9893] leading-relaxed pl-7">
            {option.description}
          </p>
        </div>

        {/* Right: Studio 3D Isometric Miniature Stage */}
        <div
          className={`w-24 h-20 rounded-xl shrink-0 overflow-hidden border transition-colors ${
            isSelected
              ? 'bg-[#0B1410] border-[#22C58B]/40'
              : 'bg-[#0B100E] border-white/[0.04]'
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
