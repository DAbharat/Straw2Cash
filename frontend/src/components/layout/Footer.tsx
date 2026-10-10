import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-white/10 bg-[#09110B] text-white text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E5A812]/15 border border-[#E5A812]/40 flex items-center justify-center p-1">
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  <path d="M20 34 V12" stroke="#E5A812" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M20 10 Q20 5 16 6 Q16 10 20 12" fill="#E5A812" />
                  <path d="M20 10 Q20 5 24 6 Q24 10 20 12" fill="#E5A812" />
                  <path d="M20 17 Q14 13 13 18 Q17 20 20 19" fill="#E5A812" />
                  <path d="M20 17 Q26 13 27 18 Q23 20 20 19" fill="#E5A812" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Straw2Cash</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Decentralized agricultural straw marketplace transforming North India’s crop residue into sustainable bio-power, rural revenue, and clean air.
            </p>
            <div className="text-[11px] text-[#E5A812]">
              <span>In alignment with CAQM Crop Residue Management guidelines</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#E5A812] mb-4">Roles & Desks</h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <button onClick={() => onNavigate('/farmer/listings')} className="hover:text-white transition-colors cursor-pointer">
                  Farmer Listings & Estimation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/buyer/marketplace')} className="hover:text-white transition-colors cursor-pointer">
                  Industrial Buyer Sourcing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/baler/profile')} className="hover:text-white transition-colors cursor-pointer">
                  Baler Custom Hiring Fleet
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contracts')} className="hover:text-white transition-colors cursor-pointer">
                  Digital Escrow Contracts
                </button>
              </li>
            </ul>
          </div>

          {/* Environmental & AI Insights */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#E5A812] mb-4">Platform Intelligence</h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <button onClick={() => onNavigate('/farmer/residue-calculator')} className="hover:text-white transition-colors cursor-pointer">
                  AI Residue Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/fire-risks')} className="hover:text-white transition-colors cursor-pointer">
                  Satellite Fire-Risk Hotspots
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/insights')} className="hover:text-white transition-colors cursor-pointer">
                  Regional Demand & Price Index
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/impact')} className="hover:text-white transition-colors cursor-pointer">
                  Carbon & AQI Impact Metrics
                </button>
              </li>
            </ul>
          </div>

          {/* Language & Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#E5A812] mb-4">Multilingual Support</h4>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">
              Agronomy Assistant available 24/7 in English, Hindi (हिंदी), and Punjabi (ਪੰਜਾਬੀ).
            </p>
            <button
              onClick={() => onNavigate('/assistant')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-[#2E581F] hover:bg-[#244818] text-white rounded-full transition-all cursor-pointer shadow-md"
            >
              <span>AI Agronomy Desk</span>
              <span className="w-4 h-4 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-[10px]">
                →
              </span>
            </button>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <p>© 2026 Straw2Cash Technologies · Inspired by Ecoland Design System</p>
          <div className="flex items-center gap-4">
            <span>Punjab · Haryana · Western UP Hub</span>
            <span aria-hidden="true">·</span>
            <span>Zero Open-Burning Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
