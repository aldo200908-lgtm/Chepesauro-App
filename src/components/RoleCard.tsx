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
      className={`group relative w-full text-left rounded-3xl p-4.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:scale-[0.98] cursor-pointer ${
        isSelected
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/20 ring-2 ring-emerald-600'
          : 'bg-emerald-50/50 text-emerald-950 border border-emerald-900/10 hover:border-emerald-600/40 hover:bg-emerald-50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
            isSelected
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'bg-white text-emerald-600 border border-emerald-900/8'
          }`}
        >
          <Icon className="w-7 h-7 stroke-[2]" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2
              className={`font-display text-lg font-bold tracking-tight truncate ${
                isSelected ? 'text-white' : 'text-emerald-950'
              }`}
            >
              {option.title}
            </h2>

            {/* Mobile radio check circle */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                isSelected
                  ? 'bg-white text-emerald-600'
                  : 'border-2 border-emerald-900/20 bg-white'
              }`}
              aria-hidden="true"
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          <p
            className={`text-xs font-medium mt-0.5 ${
              isSelected ? 'text-emerald-100' : 'text-emerald-800/80'
            }`}
          >
            {option.subtitle}
          </p>

          <p
            className={`mt-2 text-xs leading-relaxed ${
              isSelected ? 'text-emerald-50/95' : 'text-emerald-900/65'
            }`}
          >
            {option.description}
          </p>
        </div>
      </div>

      {/* Unboxed subtle benefits row */}
      <div
        className={`mt-3.5 pt-3 border-t text-[11px] font-medium flex flex-wrap items-center gap-x-1.5 gap-y-1 ${
          isSelected
            ? 'border-white/20 text-emerald-50'
            : 'border-emerald-900/8 text-emerald-800/70'
        }`}
      >
        {option.highlights.map((item, idx) => (
          <React.Fragment key={item}>
            {idx > 0 && <span aria-hidden="true">·</span>}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    </button>
  );
};
