import React from 'react';
import { motion } from 'motion/react';
import { House, Package, UserCircle } from '@phosphor-icons/react';
import { AppTab } from '../utils/onboarding';

interface MainBottomNavigationProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  ordersBadgeCount?: number;
  pendingOrdersCount?: number;
}

const NAV_ITEMS: {
  id: AppTab;
  label: string;
  Icon: React.ElementType;
}[] = [
  { id: 'inicio', label: 'Inicio', Icon: House },
  { id: 'pedidos', label: 'Pedidos', Icon: Package },
  { id: 'perfil', label: 'Perfil', Icon: UserCircle },
];

export const MainBottomNavigation: React.FC<MainBottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  ordersBadgeCount,
  pendingOrdersCount,
}) => {
  const badgeCount = pendingOrdersCount ?? ordersBadgeCount ?? 0;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-40 vg-glass-restrained border-t border-white/[0.08] onboarding-safe-bottom"
    >
      <div className="max-w-md mx-auto px-4 pt-1.5 grid grid-cols-3 gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.Icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[50px] py-1.5 px-2 rounded-xl transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'text-[#22C58B]'
                  : 'text-[#8A9E95] hover:text-[#F3F7F5]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="vg-bottom-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-x-3 inset-y-1 rounded-xl bg-[#101E18] border border-[#22C58B]/30 -z-10"
                />
              )}

              <div className="relative flex items-center justify-center">
                <IconComponent
                  size={21}
                  weight={isActive ? 'fill' : 'duotone'}
                  aria-hidden="true"
                />
                {item.id === 'pedidos' && badgeCount > 0 && (
                  <span
                    aria-label={`${badgeCount} pedidos activos`}
                    className="absolute -top-1.5 -right-3.5 min-w-[17px] h-[17px] px-1 rounded-sm bg-[#10B981] text-[#050E0A] text-[10px] font-mono font-bold flex items-center justify-center tabular-nums"
                  >
                    {badgeCount}
                  </span>
                )}
              </div>

              <span
                className={`mt-1 text-[11px] tracking-tight leading-none ${
                  isActive ? 'font-bold text-[#F3F7F5]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
