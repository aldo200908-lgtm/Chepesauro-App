import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ROLE_OPTIONS, UserRole } from '../utils/onboarding';
import { RoleCard } from './RoleCard';

interface ProfileSelectionScreenProps {
  selectedRole: UserRole | null;
  onSelectRole: (role: UserRole) => void;
  onContinue: () => void;
}

export const ProfileSelectionScreen: React.FC<ProfileSelectionScreenProps> = ({
  selectedRole,
  onSelectRole,
  onContinue,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-2">
      <div className="space-y-6 pt-2">
        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h1
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#102F27] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            ¿Cómo quieres ingresar?
          </h1>
          <p className="text-sm sm:text-base text-[#64877C] leading-relaxed">
            Elige cómo utilizarás la aplicación
          </p>
        </div>

        {/* Profile Cards: Soy cliente & Soy motorizado */}
        <div
          role="group"
          aria-label="Elige cómo utilizarás la aplicación"
          className="space-y-4"
        >
          <RoleCard
            option={ROLE_OPTIONS.usuario}
            isSelected={selectedRole === 'usuario'}
            onSelect={() => onSelectRole('usuario')}
          />

          <RoleCard
            option={ROLE_OPTIONS.motorizado}
            isSelected={selectedRole === 'motorizado'}
            onSelect={() => onSelectRole('motorizado')}
          />
        </div>
      </div>

      {/* Primary Action Button (Disabled until a profile is selected) */}
      <div className="pt-4">
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedRole}
          className={`w-full h-14 px-6 rounded-full font-display text-base font-semibold inline-flex items-center justify-center gap-2.5 transition-all duration-150 whitespace-nowrap shrink-0 ${
            selectedRole
              ? 'bg-[#078F68] hover:bg-[#064B3C] active:scale-[0.99] text-white shadow-md shadow-[#078F68]/20 cursor-pointer'
              : 'bg-[#EAF8F2] text-[#64877C]/60 border border-[#DCECE5] cursor-not-allowed'
          }`}
        >
          <span>Continuar</span>
          <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
