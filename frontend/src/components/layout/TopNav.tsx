import React, { useState } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { UserRole } from '../../types/auth';
import { ChevronDown, Sparkles, User, LogOut, Menu, X } from 'lucide-react';

interface TopNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentPath, onNavigate }) => {
  const { user, role, switchRole, logout, isAuthenticated } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [pagesMenuOpen, setPagesMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = currentPath === '/' || currentPath === '';

  return (
    <header className="relative z-30 w-full bg-transparent border-none pt-5 pb-3 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4 sm:gap-8">
          {/* Left: Golden Wheat Emblem + Brand Wordmark - seamlessly blended into background */}
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 group text-left cursor-pointer shrink-0"
          >
            {/* Golden emblem circular icon matching Ecoland */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform bg-black/20 backdrop-blur-xs border border-[#E5A812]/40 shadow-[0_0_15px_rgba(229,168,18,0.25)]">
              <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-[0_2px_8px_rgba(229,168,18,0.5)]" fill="none">
                {/* Subtle golden circle outline */}
                <circle cx="20" cy="20" r="18" stroke="#E5A812" strokeWidth="1.5" opacity="0.8" />
                {/* Wheat stalk emblem */}
                <path
                  d="M20 33 V11"
                  stroke="#E5A812"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M20 9 Q20 4 16 5 Q16 9 20 11"
                  fill="#E5A812"
                />
                <path
                  d="M20 9 Q20 4 24 5 Q24 9 20 11"
                  fill="#E5A812"
                />
                <path
                  d="M20 16 Q14 12 13 17 Q17 19 20 18"
                  fill="#E5A812"
                />
                <path
                  d="M20 16 Q26 12 27 17 Q23 19 20 18"
                  fill="#E5A812"
                />
                <path
                  d="M20 23 Q14 19 13 24 Q17 26 20 25"
                  fill="#E5A812"
                />
                <path
                  d="M20 23 Q26 19 27 24 Q23 26 20 25"
                  fill="#E5A812"
                />
              </svg>
            </div>
            <span className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] group-hover:text-[#E5A812] transition-colors font-sans">
              Straw2Cash
            </span>
          </button>

          {/* Center: Navigation Links floating cleanly on background */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            <button
              onClick={() => onNavigate('/')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/' ? 'text-[#E5A812] font-bold' : 'text-white/95 hover:text-[#E5A812]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onNavigate('/impact')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/impact' ? 'text-[#E5A812] font-bold' : 'text-white/95 hover:text-[#E5A812]'
              }`}
            >
              About Us
            </button>

            {/* Essential Pages Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPagesMenuOpen(!pagesMenuOpen)}
                className="flex items-center gap-1.5 text-white/95 hover:text-[#E5A812] transition-colors cursor-pointer"
              >
                <span>Essential Pages</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#E5A812]" />
              </button>

              {pagesMenuOpen && (
                <div
                  onMouseLeave={() => setPagesMenuOpen(false)}
                  className="absolute left-0 mt-3 w-56 bg-[#0E1A11]/95 border border-[#E5A812]/30 rounded-2xl shadow-2xl py-2 z-50 text-xs backdrop-blur-xl"
                >
                  <button
                    onClick={() => {
                      onNavigate('/farmer/residue-calculator');
                      setPagesMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-[#1B382B] hover:text-[#E5A812] transition-colors"
                  >
                    🌾 AI Residue Calculator
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/fire-risks');
                      setPagesMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-[#1B382B] hover:text-[#E5A812] transition-colors"
                  >
                    🔥 Satellite Fire-Risk Map
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/insights');
                      setPagesMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-[#1B382B] hover:text-[#E5A812] transition-colors"
                  >
                    📈 Regional Price Insights
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/contracts');
                      setPagesMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-[#1B382B] hover:text-[#E5A812] transition-colors"
                  >
                    📄 Escrow & Contracts
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('/buyer/marketplace')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/buyer/marketplace' ? 'text-[#E5A812] font-bold' : 'text-white/95 hover:text-[#E5A812]'
              }`}
            >
              Shop
            </button>

            <button
              onClick={() => onNavigate('/assistant')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentPath === '/assistant' ? 'text-[#E5A812] font-bold' : 'text-white/95 hover:text-[#E5A812]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E5A812]" />
              <span>AI Assistant</span>
            </button>
          </nav>

          {/* Right Action: Signature Green Pill Button + Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Role Switcher Pill - transparent glass */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-white/25 bg-black/35 backdrop-blur-md text-white hover:bg-black/50 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                title="Switch active role persona"
              >
                <span className="text-[#E5A812]">Role:</span>
                <span className="capitalize">{role}</span>
                <ChevronDown className="w-3 h-3 text-[#E5A812]" />
              </button>

              {roleMenuOpen && (
                <div
                  onMouseLeave={() => setRoleMenuOpen(false)}
                  className="absolute right-0 mt-2 w-48 bg-[#0E1A11]/95 border border-white/15 rounded-xl shadow-2xl py-1.5 z-50 text-xs backdrop-blur-xl"
                >
                  <div className="px-3 py-1.5 text-[11px] text-[#A5B5A8] border-b border-white/10">
                    Switch Active Persona:
                  </div>
                  {(['farmer', 'buyer', 'baler', 'authority'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setRoleMenuOpen(false);
                        if (r === 'authority') {
                          onNavigate('/fire-risks');
                        } else {
                          onNavigate('/dashboard');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1B382B] transition-colors capitalize ${
                        role === r ? 'font-bold text-[#E5A812] bg-[#162C1D]' : 'text-white/85'
                      }`}
                    >
                      <span>
                        {r === 'farmer' ? '🌾 Farmer View' : r === 'buyer' ? '🏭 Buyer View' : r === 'baler' ? '🚜 Baler View' : '🏛️ Authority View'}
                      </span>
                      {role === r && <span className="text-[10px] text-[#E5A812]">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Authenticated Dashboard / Get Started Pill Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer backdrop-blur-md"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('/profile')}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-[#E5A812]/20 border border-[#E5A812]/60 text-[#E5A812] flex items-center justify-center text-xs font-bold hover:scale-105 transition-transform cursor-pointer shadow-sm"
                  title="Profile"
                >
                  {user?.name ? user.name[0] : 'U'}
                </button>
              </div>
            ) : (
              /* Signature Ecoland Pill Button */
              <button
                onClick={() => onNavigate('/register')}
                className="bg-[#2E581F] hover:bg-[#254A18] text-white pl-4 sm:pl-5 pr-2 py-2 rounded-full font-bold text-xs sm:text-sm inline-flex items-center gap-2 sm:gap-2.5 transition-all shadow-lg hover:shadow-xl cursor-pointer whitespace-nowrap hover:scale-102 border border-white/10"
              >
                <span>Get Started Now</span>
                <span className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                  →
                </span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-black/40 border border-white/20 text-white hover:text-[#E5A812] cursor-pointer backdrop-blur-md"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 p-4 bg-[#0D1810]/95 backdrop-blur-xl border border-white/15 rounded-2xl space-y-3 text-sm shadow-2xl">
            <button
              onClick={() => {
                onNavigate('/');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 font-semibold text-white"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('/impact');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 text-white/90"
            >
              About Us / Impact
            </button>
            <button
              onClick={() => {
                onNavigate('/buyer/marketplace');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 text-white/90"
            >
              Shop / Straw Marketplace
            </button>
            <button
              onClick={() => {
                onNavigate('/farmer/residue-calculator');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 text-white/90"
            >
              🌾 AI Residue Calculator
            </button>
            <button
              onClick={() => {
                onNavigate('/fire-risks');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 text-white/90"
            >
              🔥 Satellite Fire-Risk Map
            </button>
            <button
              onClick={() => {
                onNavigate('/insights');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 text-white/90"
            >
              📈 Regional Price Insights
            </button>
            <button
              onClick={() => {
                onNavigate('/assistant');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 text-[#E5A812] font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Assistant (ਪੰਜਾਬੀ/हिंदी)</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
