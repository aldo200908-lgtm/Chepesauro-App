import React from 'react';

/**
 * Bespoke Studio-Lit 3D Isometric Visual Renders (SVG + PBR-style shading & specular highlights)
 * Replaces generic 44x44px flat icons-in-boxes with rich spatial compositions.
 */

export const Store3DRender: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 120 96"
    className="w-full h-full block"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="storeStageGlow" cx="50%" cy="60%" r="55%">
        <stop
          offset="0%"
          stopColor={active ? '#86C77A' : '#6DB35F'}
          stopOpacity={active ? '0.28' : '0.16'}
        />
        <stop offset="100%" stopColor="#0F1D15" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="plinthTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#25402E" />
        <stop offset="100%" stopColor="#1D3726" />
      </linearGradient>
      <linearGradient id="bagFront" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#28463A" />
        <stop offset="100%" stopColor="#1D3726" />
      </linearGradient>
      <linearGradient id="bagSide" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#21402B" />
        <stop offset="100%" stopColor="#1C130C" />
      </linearGradient>
      <linearGradient id="caramelAwning" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A9D99E" />
        <stop offset="100%" stopColor="#6DB35F" />
      </linearGradient>
    </defs>

    {/* Studio Spotlight */}
    <ellipse cx="60" cy="68" rx="46" ry="22" fill="url(#storeStageGlow)" />

    {/* Isometric Dark Obsidian Plinth */}
    <polygon points="60,52 102,68 60,84 18,68" fill="url(#plinthTop)" stroke="#2F4F39" strokeWidth="0.8" />
    <polygon points="18,68 60,84 60,90 18,74" fill="#0F1B14" />
    <polygon points="60,84 102,68 102,74 60,90" fill="#12241A" />

    {/* 3D Architectural Boutique / Storefront Volume */}
    <g transform="translate(0, -3)">
      {/* Left Wall */}
      <polygon points="34,34 60,46 60,72 34,60" fill="url(#bagFront)" stroke="#2F5A3B" strokeWidth="0.6" />
      {/* Right Wall */}
      <polygon points="60,46 86,34 86,60 60,72" fill="url(#bagSide)" stroke="#28463A" strokeWidth="0.6" />
      {/* Roof */}
      <polygon points="60,22 86,34 60,46 34,34" fill="#2B4A36" stroke="#3A6B47" strokeWidth="0.8" />

      {/* Illuminated Caramel Storefront Awning / Rim */}
      <polygon points="32,37 60,50 60,54 32,41" fill="url(#caramelAwning)" />
      <polygon points="60,50 88,37 88,41 60,54" fill="#4F9A45" />

      {/* Warm Interior Glass Window Glow */}
      <polygon points="40,47 54,53.5 54,65 40,58.5" fill="rgba(134, 199, 122, 0.25)" stroke="#86C77A" strokeWidth="0.7" />

      {/* Floating 3D Shopping Handle Arch */}
      <path
        d="M 50 29 C 50 16, 70 16, 70 29"
        fill="none"
        stroke="#86C77A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

export const Parcel3DRender: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 120 96"
    className="w-full h-full block"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="parcelStageGlow" cx="50%" cy="60%" r="55%">
        <stop
          offset="0%"
          stopColor={active ? '#86C77A' : '#6DB35F'}
          stopOpacity={active ? '0.28' : '0.16'}
        />
        <stop offset="100%" stopColor="#0F1D15" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="carbonTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2B4A36" />
        <stop offset="100%" stopColor="#25402E" />
      </linearGradient>
      <linearGradient id="carbonLeft" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#25402E" />
        <stop offset="100%" stopColor="#1A3322" />
      </linearGradient>
      <linearGradient id="carbonRight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1D3726" />
        <stop offset="100%" stopColor="#19110C" />
      </linearGradient>
    </defs>

    {/* Studio Spotlight */}
    <ellipse cx="60" cy="68" rx="46" ry="22" fill="url(#parcelStageGlow)" />

    {/* Isometric Plinth + Active Route Line */}
    <polygon points="60,52 102,68 60,84 18,68" fill="#1D3726" stroke="#2B4A36" strokeWidth="0.8" />
    <polygon points="18,68 60,84 60,90 18,74" fill="#0F1B14" />
    <polygon points="60,84 102,68 102,74 60,90" fill="#11231A" />

    {/* Glowing Route Line Across Plinth */}
    <path
      d="M 30 71 L 60 82 L 92 69"
      fill="none"
      stroke="#86C77A"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* 3D Precision Carbon Courier Cube */}
    <g transform="translate(0, -5)">
      {/* Top Face */}
      <polygon points="60,24 86,36 60,48 34,36" fill="url(#carbonTop)" stroke="#3A6B47" strokeWidth="0.8" />
      {/* Left Face */}
      <polygon points="34,36 60,48 60,74 34,62" fill="url(#carbonLeft)" stroke="#2F5A3B" strokeWidth="0.6" />
      {/* Right Face */}
      <polygon points="60,48 86,36 86,62 60,74" fill="url(#carbonRight)" stroke="#25402E" strokeWidth="0.6" />

      {/* Glowing Caramel Security Seal Band */}
      <polygon points="45,30.5 71,42.5 74,41 48,29" fill="#86C77A" />
      <polygon points="71,42.5 74,41 74,67.5 71,69" fill="#6DB35F" />

      {/* Floating 3D Caramel GPS Beacon */}
      <circle cx="60" cy="15" r="4.5" fill="#86C77A" />
      <circle cx="60" cy="15" r="8" fill="none" stroke="#86C77A" strokeWidth="1" opacity="0.45" />
    </g>
  </svg>
);

export const ClientRole3DRender: React.FC<{ selected?: boolean }> = ({
  selected,
}) => (
  <svg viewBox="0 0 96 80" className="w-full h-full block" aria-hidden="true">
    <defs>
      <linearGradient id="clientCardTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={selected ? '#2B5536' : '#25402E'} />
        <stop offset="100%" stopColor="#12241A" />
      </linearGradient>
    </defs>
    {/* Isometric Map Tile */}
    <polygon
      points="48,28 84,44 48,60 12,44"
      fill="url(#clientCardTop)"
      stroke={selected ? '#86C77A' : '#2F4F39'}
      strokeWidth="1"
    />
    <polygon points="12,44 48,60 48,66 12,50" fill="#0F1B14" />
    <polygon points="48,60 84,44 84,50 48,66" fill="#12251A" />

    {/* 3D Route Curve on Tile */}
    <path
      d="M 28 44 Q 48 52 68 42"
      fill="none"
      stroke="#86C77A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Floating 3D Destination Pin */}
    <g transform="translate(48, 24)">
      <ellipse cx="0" cy="18" rx="9" ry="4.5" fill="rgba(134, 199, 122, 0.25)" />
      <path
        d="M 0 -10 C -7 -10 -11 -5 -11 1 C -11 9 0 18 0 18 C 0 18 11 9 11 1 C 11 -5 7 -10 0 -10 Z"
        fill="#86C77A"
      />
      <circle cx="0" cy="0" r="3.8" fill="#140C07" />
    </g>
  </svg>
);

export const DriverRole3DRender: React.FC<{ selected?: boolean }> = ({
  selected,
}) => (
  <svg viewBox="0 0 96 80" className="w-full h-full block" aria-hidden="true">
    {/* Isometric Road Corridor */}
    <polygon
      points="48,28 84,44 48,60 12,44"
      fill={selected ? '#21402B' : '#12251A'}
      stroke={selected ? '#86C77A' : '#2F4F39'}
      strokeWidth="1"
    />
    <polygon points="12,44 48,60 48,66 12,50" fill="#0F1B14" />
    <polygon points="48,60 84,44 84,50 48,66" fill="#12241A" />

    {/* Illuminated Navigation Path */}
    <line
      x1="24"
      y1="50"
      x2="72"
      y2="34"
      stroke="#86C77A"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* 3D Isometric Delivery Vehicle Unit + Cargo Box */}
    <g transform="translate(46, 36)">
      {/* Rear Cargo Cube */}
      <polygon points="-6,-16 6,-22 16,-17 4,-11" fill="#A9D99E" />
      <polygon points="-6,-16 4,-11 4,-1 -6,-6" fill="#6DB35F" />
      <polygon points="4,-11 16,-17 16,-7 4,-1" fill="#4F9A45" />

      {/* Sleek Chassis */}
      <polygon points="-14,-4 4,-12 12,-8 -6,0" fill="#28463A" stroke="#3A6B47" strokeWidth="0.7" />
      <polygon points="-14,-4 -6,0 -6,6 -14,2" fill="#11231A" />
      <polygon points="-6,0 12,-8 12,-2 -6,6" fill="#21402B" />

      {/* Headlight Beam */}
      <polygon points="-14,-2 -28,4 -20,9 -10,2" fill="rgba(134, 199, 122, 0.32)" />
    </g>
  </svg>
);
