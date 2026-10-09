import React from 'react';

interface EcoIllustrationProps {
  type: 'straw_bales' | 'baler_machine' | 'bioenergy' | 'satellite_map' | 'escrow_shield';
  className?: string;
}

export const EcoIllustration: React.FC<EcoIllustrationProps> = ({ type, className = 'w-full h-48' }) => {
  if (type === 'straw_bales') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#EFE8D8] to-[#E3DAC4] p-6 flex flex-col justify-end border border-[#D8CEBA] ${className}`}>
        <svg viewBox="0 0 400 240" className="w-full h-full object-contain" fill="none">
          {/* Background hills */}
          <path d="M0 160 Q120 120 250 150 T400 130 L400 240 L0 240 Z" fill="#D9CEB4" />
          <path d="M0 180 Q160 145 310 170 T400 160 L400 240 L0 240 Z" fill="#CBBF9F" />
          <path d="M0 200 L400 200 L400 240 L0 240 Z" fill="#BAAD89" />

          {/* Stubble field lines */}
          <g stroke="#9F916B" strokeWidth="1.5" strokeLinecap="round">
            {[20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320, 350, 380].map((x, i) => (
              <line key={i} x1={x} y1="210" x2={x + 4} y2="202" />
            ))}
            {[35, 65, 95, 125, 155, 185, 215, 245, 275, 305, 335, 365].map((x, i) => (
              <line key={`b-${i}`} x1={x} y1="225" x2={x + 3} y2="216" />
            ))}
          </g>

          {/* Round Bales */}
          <g transform="translate(70, 150)">
            <ellipse cx="30" cy="35" rx="25" ry="18" fill="#D49B2E" stroke="#9E6E17" strokeWidth="2" />
            <path d="M30 17 L75 17 Q95 25 95 35 Q95 45 75 53 L30 53 Z" fill="#E6AB38" stroke="#9E6E17" strokeWidth="2" />
            <ellipse cx="75" cy="35" rx="20" ry="18" fill="#F2BC4C" stroke="#9E6E17" strokeWidth="2" />
            {/* Twine bindings */}
            <path d="M45 17 Q60 25 60 35 Q60 45 45 53" stroke="#845910" strokeWidth="2" fill="none" />
            <path d="M60 17 Q75 25 75 35 Q75 45 60 53" stroke="#845910" strokeWidth="2" fill="none" />
          </g>

          <g transform="translate(230, 140)">
            <rect x="0" y="20" width="80" height="40" rx="4" fill="#E6AB38" stroke="#9E6E17" strokeWidth="2" />
            <line x1="20" y1="20" x2="20" y2="60" stroke="#845910" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="50" y1="20" x2="50" y2="60" stroke="#845910" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M0 20 L40 5 L120 5 L80 20 Z" fill="#F2BC4C" stroke="#9E6E17" strokeWidth="2" />
            <path d="M120 5 L120 45 L80 60 L80 20 Z" fill="#D49B2E" stroke="#9E6E17" strokeWidth="2" />
          </g>

          {/* Clean sun & birds */}
          <circle cx="340" cy="50" r="28" fill="#FCE8B3" opacity="0.8" />
          <path d="M40 50 Q48 42 56 50 Q64 42 72 50" stroke="#7A877B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M68 62 Q74 56 80 62 Q86 56 92 62" stroke="#7A877B" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  if (type === 'baler_machine') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#EAEFEA] to-[#D5E1D5] p-6 flex flex-col justify-end border border-[#C4D3C4] ${className}`}>
        <svg viewBox="0 0 400 240" className="w-full h-full object-contain" fill="none">
          {/* Tractor & Baler silhouette line art */}
          {/* Ground */}
          <line x1="0" y1="200" x2="400" y2="200" stroke="#4B6350" strokeWidth="3" />

          {/* Green Tractor */}
          <rect x="180" y="110" width="70" height="60" rx="8" fill="#245E3F" stroke="#123824" strokeWidth="2" />
          <rect x="230" y="130" width="75" height="40" rx="6" fill="#2D734E" stroke="#123824" strokeWidth="2" />
          <polygon points="190,110 240,110 230,130 190,130" fill="#E2EBE5" stroke="#123824" strokeWidth="1.5" />
          <rect x="280" y="100" width="10" height="30" fill="#1B382B" />

          {/* Wheels */}
          <circle cx="205" cy="190" r="28" fill="#1D2921" stroke="#3A4D40" strokeWidth="4" />
          <circle cx="205" cy="190" r="12" fill="#E6AB38" />
          <circle cx="290" cy="195" r="18" fill="#1D2921" stroke="#3A4D40" strokeWidth="3" />
          <circle cx="290" cy="195" r="8" fill="#E6AB38" />

          {/* Baler attachment */}
          <rect x="70" y="125" width="100" height="65" rx="6" fill="#C88A1B" stroke="#87590A" strokeWidth="2" />
          <circle cx="120" cy="155" r="22" fill="#B37810" stroke="#87590A" strokeWidth="2" />
          {/* Baler wheel */}
          <circle cx="115" cy="192" r="18" fill="#1D2921" stroke="#3A4D40" strokeWidth="3" />
          <circle cx="115" cy="192" r="7" fill="#C88A1B" />
          {/* Hitch connector */}
          <line x1="170" y1="165" x2="190" y2="175" stroke="#1D2921" strokeWidth="5" strokeLinecap="round" />

          {/* Ejected Straw Bale */}
          <g transform="translate(15, 160)">
            <ellipse cx="25" cy="20" rx="18" ry="14" fill="#F2BC4C" stroke="#9E6E17" strokeWidth="1.5" />
            <path d="M25 6 L55 6 Q70 12 70 20 Q70 28 55 34 L25 34 Z" fill="#E6AB38" stroke="#9E6E17" strokeWidth="1.5" />
            <ellipse cx="55" cy="20" rx="14" ry="14" fill="#D49B2E" stroke="#9E6E17" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    );
  }

  if (type === 'bioenergy') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#E7F0EB] to-[#D0E2D6] p-6 flex flex-col justify-end border border-[#BFD5C6] ${className}`}>
        <svg viewBox="0 0 400 240" className="w-full h-full object-contain" fill="none">
          <line x1="0" y1="210" x2="400" y2="210" stroke="#3B5242" strokeWidth="2" />

          {/* Plant Building */}
          <rect x="80" y="90" width="160" height="120" rx="4" fill="#1B382B" stroke="#10251C" strokeWidth="2" />
          <polygon points="60,90 260,90 240,65 80,65" fill="#245E3F" stroke="#10251C" strokeWidth="2" />

          {/* Storage Silos */}
          <rect x="250" y="110" width="45" height="100" rx="2" fill="#E2EBE5" stroke="#4A6350" strokeWidth="2" />
          <path d="M250 110 Q272 90 295 110 Z" fill="#C5D7CC" stroke="#4A6350" strokeWidth="2" />
          <rect x="305" y="110" width="45" height="100" rx="2" fill="#E2EBE5" stroke="#4A6350" strokeWidth="2" />
          <path d="M305 110 Q327 90 350 110 Z" fill="#C5D7CC" stroke="#4A6350" strokeWidth="2" />

          {/* Clean energy steam / wind symbol */}
          <path d="M120 60 Q125 35 135 45 Q145 25 155 35" stroke="#7BA88B" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
          {/* Leaf emblem */}
          <circle cx="160" cy="140" r="28" fill="#245E3F" />
          <path d="M160 120 C175 130 175 150 160 160 C145 150 145 130 160 120 Z" fill="#C88A1B" />
        </svg>
      </div>
    );
  }

  // Escrow shield
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#F2EDE2] to-[#E3D9C4] p-6 flex items-center justify-center border border-[#D5C9B0] ${className}`}>
      <svg viewBox="0 0 200 200" className="w-32 h-32" fill="none">
        <path d="M100 20 L160 50 C160 115 130 160 100 180 C70 160 40 115 40 50 Z" fill="#1B382B" stroke="#0F241B" strokeWidth="4" />
        <path d="M100 35 L145 58 C145 110 122 145 100 162 C78 145 55 110 55 58 Z" fill="#245E3F" />
        {/* Checkmark */}
        <path d="M78 98 L94 114 L126 80" stroke="#FAF8F3" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
};
