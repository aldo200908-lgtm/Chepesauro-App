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
            ? 'px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-200 active:scale-[0.96] whitespace-nowrap shrink-0 min-h-[36px] cursor-pointer'
            : 'w-full h-12 px-5 rounded-full bg-[#6DB35F] hover:bg-[#86C77A] text-[#10230F] text-sm font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] shadow-xs whitespace-nowrap shrink-0 cursor-pointer'
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0C1A11]/70 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-sm rounded-[32px] bg-[#FBFCF7] text-[#10230F] p-6 shadow-xl space-y-4 border border-[#DCE5D5] animate-[vg-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#F2F5EA] text-[#3D8438] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3
                    id="pwa-guide-title"
                    className="font-display text-base font-bold text-[#10230F]"
                  >
                    Instalar Chepesaurio
                  </h3>
                  <p className="text-xs text-[#5F7364]">
                    Acceso directo en pantalla completa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar guía de instalación"
                className="w-9 h-9 rounded-full bg-[#F2F5EA] text-[#1F4A26] flex items-center justify-center hover:bg-[#DCE5D5] active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-[#10230F] space-y-2 leading-relaxed">
                <p>
                  1. Toca el botón <strong>Compartir</strong> en la barra de
                  Safari.
                </p>
                <p>
                  2. Elige <strong>Agregar a pantalla de inicio</strong> para
                  abrir Chepesaurio como aplicación.
                </p>
              </div>
            ) : (
              <div className="text-xs text-[#10230F] space-y-2 leading-relaxed">
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
              className="w-full h-11 rounded-full bg-[#6DB35F] text-[#10230F] text-xs font-bold hover:bg-[#86C77A] transition-all duration-200 active:scale-[0.97] cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
