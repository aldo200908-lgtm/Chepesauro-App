import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[36px] cursor-pointer'
            : 'w-full h-12 px-5 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{compact ? 'Instalar' : 'Instalar aplicación en el celular'}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#102F27]/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white text-[#102F27] p-6 shadow-xl space-y-4 border border-[#DCECE5]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF8F2] text-[#078F68] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3
                    id="pwa-guide-title"
                    className="font-display text-base font-bold text-[#102F27]"
                  >
                    Instalar VerdeGo
                  </h3>
                  <p className="text-xs text-[#64877C]">
                    Acceso directo en pantalla completa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar guía de instalación"
                className="w-9 h-9 rounded-full bg-[#EAF8F2] text-[#064B3C] flex items-center justify-center hover:bg-[#DCECE5] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-[#102F27] space-y-2 leading-relaxed">
                <p>
                  1. Toca el botón <strong>Compartir</strong> en la barra de
                  Safari.
                </p>
                <p>
                  2. Elige <strong>Agregar a pantalla de inicio</strong> para
                  abrir VerdeGo como aplicación.
                </p>
              </div>
            ) : (
              <div className="text-xs text-[#102F27] space-y-2 leading-relaxed">
                <p>
                  1. En Chrome para Android, toca el menú de tres puntos{' '}
                  <strong>(⋮)</strong> arriba a la derecha.
                </p>
                <p>
                  2. Selecciona <strong>Instalar aplicación</strong> o{' '}
                  <strong>Agregar a la pantalla principal</strong>.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full h-11 rounded-full bg-[#078F68] text-white text-xs font-semibold hover:bg-[#064B3C] transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
