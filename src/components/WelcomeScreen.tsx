import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-2">
      {/* Center High-Quality Original SVG Illustration: Shopping, Packages & City Delivery */}
      <div className="my-auto flex flex-col items-center text-center space-y-6">
        <div className="w-full max-w-[270px] aspect-square rounded-[36px] bg-[#EAF8F2] border border-[#DCECE5] flex items-center justify-center p-6 relative overflow-hidden">
          <svg
            viewBox="0 0 240 240"
            className="w-full h-full"
            role="img"
            aria-label="Ilustración de compras en negocios y envíos rápidos en la ciudad"
          >
            {/* Soft background circles */}
            <circle cx="120" cy="120" r="88" fill="#FFFFFF" />
            <circle cx="120" cy="120" r="68" fill="#EAF8F2" />

            {/* Route connection curve */}
            <path
              d="M 56 156 C 85 176, 155 176, 184 150"
              fill="none"
              stroke="#078F68"
              strokeWidth="3.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            {/* Storefront / Local Business Card (Left-Top) */}
            <g transform="translate(36, 48)">
              <rect
                x="0"
                y="0"
                width="76"
                height="68"
                rx="16"
                fill="#FFFFFF"
                stroke="#DCECE5"
                strokeWidth="2.5"
              />
              {/* Store awning */}
              <path
                d="M 10 18 C 10 12, 66 12, 66 18 L 62 28 L 14 28 Z"
                fill="#078F68"
              />
              {/* Shopping bag inside card */}
              <rect
                x="24"
                y="33"
                width="28"
                height="24"
                rx="6"
                fill="#EAF8F2"
                stroke="#078F68"
                strokeWidth="2.2"
              />
              <path
                d="M 32 33 C 32 27, 44 27, 44 33"
                fill="none"
                stroke="#064B3C"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>

            {/* Express Package / Parcel Card (Right-Top) */}
            <g transform="translate(124, 56)">
              <rect
                x="0"
                y="0"
                width="80"
                height="72"
                rx="18"
                fill="#078F68"
              />
              {/* Parcel box */}
              <rect
                x="20"
                y="18"
                width="40"
                height="36"
                rx="8"
                fill="#FFFFFF"
              />
              <line
                x1="20"
                y1="32"
                x2="60"
                y2="32"
                stroke="#078F68"
                strokeWidth="2.5"
              />
              <line
                x1="40"
                y1="18"
                x2="40"
                y2="32"
                stroke="#078F68"
                strokeWidth="2.5"
              />
              {/* Check badge */}
              <circle cx="58" cy="52" r="10" fill="#064B3C" />
              <path
                d="M 54 52 L 57 55 L 63 49"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Delivery Courier & Location Pin Badge (Bottom Center) */}
            <g transform="translate(68, 134)">
              <rect
                x="0"
                y="0"
                width="104"
                height="50"
                rx="25"
                fill="#064B3C"
              />
              <circle cx="27" cy="25" r="15" fill="#078F68" />
              <path
                d="M 27 17 C 22.5 17, 19 20.5, 19 25 C 19 30.5, 27 35, 27 35 C 27 35, 35 30.5, 35 25 C 35 20.5, 31.5 17, 27 17 Z"
                fill="#FFFFFF"
              />
              <circle cx="27" cy="24.5" r="3" fill="#064B3C" />
              <rect x="50" y="16" width="38" height="7" rx="3.5" fill="#FFFFFF" />
              <rect x="50" y="28" width="26" height="6" rx="3" fill="#EAF8F2" opacity="0.75" />
            </g>
          </svg>
        </div>

        {/* Welcome Text Block */}
        <div className="space-y-3 px-2 max-w-sm">
          <h1
            className="font-display text-3xl font-bold tracking-tight text-[#102F27] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Tus entregas, más fáciles
          </h1>
          <p className="text-base text-[#64877C] leading-relaxed">
            Compra en tus negocios favoritos o envía lo que necesitas
          </p>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="pt-4 space-y-3">
        <button
          type="button"
          onClick={onStart}
          className="w-full h-14 px-6 rounded-full bg-[#078F68] hover:bg-[#064B3C] active:scale-[0.99] text-white font-display text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-md shadow-[#078F68]/20 transition-all cursor-pointer"
        >
          <span>Comenzar</span>
          <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
