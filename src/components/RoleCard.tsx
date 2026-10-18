import React from 'react';
import { Check, Bike, ShoppingBag } from 'lucide-react';
import { RoleOption } from '../utils/onboarding';

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
  const Icon = option.id === 'usuario' ? ShoppingBag : Bike;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`group relative w-full text-left rounded-3xl p-5 sm:p-6 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#078F68] focus-visible:ring-offset-2 active:scale-[0.99] cursor-pointer ${
        isSelected
          ? 'bg-[#078F68] text-white border-2 border-[#078F68] shadow-md shadow-[#078F68]/15'
          : 'bg-[#FFFFFF] text-[#102F27] border-2 border-[#DCECE5] hover:border-[#078F68]/50 hover:bg-[#EAF8F2]/50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
            isSelected
              ? 'bg-white text-[#078F68]'
              : 'bg-[#EAF8F2] text-[#078F68]'
          }`}
        >
          <Icon className="w-7 h-7 stroke-[2]" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2
              className={`font-display text-lg sm:text-xl font-bold tracking-tight ${
                isSelected ? 'text-white' : 'text-[#102F27]'
              }`}
            >
              {option.title}
            </h2>

            {/* Visible selection indicator */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 ${
                isSelected
                  ? 'bg-white text-[#078F68]'
                  : 'border-2 border-[#DCECE5] bg-white group-hover:border-[#078F68]/60'
              }`}
              aria-hidden="true"
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          <p
            className={`mt-1.5 text-sm leading-relaxed ${
              isSelected ? 'text-[#EAF8F2]' : 'text-[#64877C]'
            }`}
          >
            {option.description}
          </p>
        </div>
      </div>
    </button>
  );
};
