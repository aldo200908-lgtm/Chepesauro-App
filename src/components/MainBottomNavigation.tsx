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

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
      className="fixed bottom-0 inset-x-0 z-40 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      {/* Barra flotante: esquinas amplias, vidrio café y sombra suave */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
        className="pointer-events-auto max-w-md mx-auto bg-white rounded-[28px] px-2 py-1.5 grid grid-cols-3 gap-1 shadow-[0_18px_40px_-14px_rgba(12,26,17,0.55)] border border-[#DCE5D5]"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.Icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[52px] py-1.5 px-2 rounded-full transition-all duration-200 active:scale-[0.94] cursor-pointer ${
                isActive
                  ? 'text-[#3D8438]'
                  : 'text-[#84998B] hover:text-[#131A14]'
              }`}
            >
              {/* Píldora que se desliza entre pestañas */}
              {isActive && (
                <motion.span
                  layoutId="vg-bottom-nav-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[#E4F0DF] -z-10"
                />
              )}

              <motion.div
                className="relative flex items-center justify-center"
                animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              >
                <IconComponent
                  size={22}
                  weight={isActive ? 'fill' : 'duotone'}
                  aria-hidden="true"
                />
                {item.id === 'pedidos' && badgeCount > 0 && (
                  <motion.span
                    key={badgeCount}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 16 }}
                    aria-label={`${badgeCount} pedidos activos`}
                    className="absolute -top-2 -right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D2362A] text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums"
                  >
                    {badgeCount}
                  </motion.span>
                )}
              </motion.div>

              <span
                className={`mt-1 text-[11px] tracking-tight leading-none ${
                  isActive ? 'font-bold text-[#131A14]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </nav>
  );
};
