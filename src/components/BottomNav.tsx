import React from 'react';
import { Home, Package, MapPin, User } from 'lucide-react';
import { AppTab } from '../utils/onboarding';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  pendingOrdersCount?: number;
}

const NAV_ITEMS: {
  id: AppTab;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'inicio', label: 'Inicio', Icon: Home },
  { id: 'pedidos', label: 'Pedidos', Icon: Package },
  { id: 'mapa', label: 'Mapa', Icon: MapPin },
  { id: 'perfil', label: 'Perfil', Icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingOrdersCount = 0,
}) => {
  return (
    <nav
      aria-label="Navegación principal inferior"
      className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-emerald-900/10 bottom-nav-safe"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 items-center h-16 px-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center h-14 rounded-2xl transition-colors duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                isActive
                  ? 'text-emerald-700'
                  : 'text-emerald-950/55 hover:text-emerald-900'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-150 ${
                  isActive ? 'bg-emerald-100/90 text-emerald-700' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'
                  }`}
                  aria-hidden="true"
                />
                {id === 'pedidos' && pendingOrdersCount > 0 && (
                  <span
                    aria-label={`${pendingOrdersCount} pedidos activos`}
                    className="absolute -top-0.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
                  >
                    {pendingOrdersCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] leading-tight mt-1 whitespace-nowrap shrink-0 ${
                  isActive ? 'font-bold text-emerald-800' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
