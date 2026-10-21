import React from 'react';
import { ArrowRight } from '@phosphor-icons/react';
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
    <div className="flex-1 flex flex-col justify-between py-1">
      <div className="my-auto space-y-5">
        {/* Clean Editorial Heading */}
        <div className="space-y-1.5 text-left">
          <h1
            className="font-display text-[26px] sm:text-[30px] font-extrabold tracking-tight text-[#F7F1EA] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            ¿Cómo quieres ingresar?
          </h1>
          <p className="text-sm text-[#B3A090] leading-relaxed">
            Selecciona tu perfil para configurar el mapa 3D.
          </p>
        </div>

        {/* Visual Profile Cards */}
        <div
          role="group"
          aria-label="Elige cómo utilizarás la aplicación"
          className="space-y-3"
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

      {/* Primary Action Button */}
      <div className="pt-5">
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedRole}
          className={`group w-full h-[54px] px-6 rounded-full font-display text-[15px] font-bold inline-flex items-center justify-between transition-all duration-200 whitespace-nowrap shrink-0 ${
            selectedRole
              ? 'vg-btn-primary cursor-pointer shadow-[0_14px_32px_-12px_rgba(200,153,95,0.55)]'
              : 'bg-[#24140A] text-[#8A7766] border border-white/[0.05] cursor-not-allowed'
          }`}
        >
          <span>
            {selectedRole === 'usuario'
              ? 'Continuar como Cliente'
              : selectedRole === 'motorizado'
              ? 'Continuar como Motorizado'
              : 'Selecciona un perfil'}
          </span>
          <ArrowRight size={18} weight="bold" className="shrink-0 transition-transform duration-300 group-enabled:group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
