import React, { useState } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { useToast } from '../lib/context/ToastContext';
import { UserRole } from '../types/auth';
import { BlurRevealText } from '../components/ui/BlurRevealText';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('9000000001');
  const [password, setPassword] = useState('farmer123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, selectedRole);
      showToast('Signed in successfully', `Welcome back as ${selectedRole.toUpperCase()}`);
      if (selectedRole === 'authority') {
        onNavigate('/fire-risks');
      } else {
        onNavigate('/dashboard');
      }
    } catch {
      showToast('Login Failed', 'Please verify your phone and password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole, phone: string, pass: string) => {
    setLoading(true);
    setIdentifier(phone);
    setPassword(pass);
    setSelectedRole(role);
    try {
      await login(phone, role);
      showToast('Demo Access Granted', `Logged in as ${role.toUpperCase()} (${phone})`);
      if (role === 'authority') {
        onNavigate('/fire-risks');
      } else {
        onNavigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-5 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <div className="text-center mb-8">
          <BlurRevealText
            text="Sign in to Straw2Cash"
            as="h2"
            className="text-2xl sm:text-3xl font-extrabold text-[#19241B] tracking-tight"
          />
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A795D] mb-2 text-center">
            Instant Demo Sign-in (Seeded Port 8080)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('farmer', '9000000001', 'farmer123')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                selectedRole === 'farmer'
                  ? 'border-[#1B382B] bg-[#EAEFEA] font-semibold text-[#1B382B]'
                  : 'border-[#E3DED2] bg-white text-[#5E6D63] hover:border-[#1B382B]/30'
              }`}
            >
              <p className="font-bold text-[11px]">🌾 Farmer</p>
              <p className="text-[10px] text-[#5E6D63] font-mono">9000000001</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('buyer', '9000000002', 'buyer123')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                selectedRole === 'buyer'
                  ? 'border-[#1B382B] bg-[#EAEFEA] font-semibold text-[#1B382B]'
                  : 'border-[#E3DED2] bg-white text-[#5E6D63] hover:border-[#1B382B]/30'
              }`}
            >
              <p className="font-bold text-[11px]">🏭 Buyer</p>
              <p className="text-[10px] text-[#5E6D63] font-mono">9000000002</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('baler', '9000000004', 'baler123')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                selectedRole === 'baler'
                  ? 'border-[#1B382B] bg-[#EAEFEA] font-semibold text-[#1B382B]'
                  : 'border-[#E3DED2] bg-white text-[#5E6D63] hover:border-[#1B382B]/30'
              }`}
            >
              <p className="font-bold text-[11px]">🚜 Baler</p>
              <p className="text-[10px] text-[#5E6D63] font-mono">9000000004</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('authority', '9000000003', 'auth123')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                selectedRole === 'authority'
                  ? 'border-[#1B382B] bg-[#EAEFEA] font-semibold text-[#1B382B]'
                  : 'border-[#E3DED2] bg-white text-[#5E6D63] hover:border-[#1B382B]/30'
              }`}
            >
              <p className="font-bold text-[11px]">🏛️ Authority</p>
              <p className="text-[10px] text-[#5E6D63] font-mono">9000000003</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#19241B] mb-1">
              Registered Phone Number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] focus:border-[#1B382B] font-mono"
              placeholder="e.g. 9000000001"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19241B] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] focus:border-[#1B382B]"
              placeholder="e.g. farmer123"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19241B] mb-1">
              Active User Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] focus:border-[#1B382B]"
            >
              <option value="farmer">Farmer (Producer & Residue Seller)</option>
              <option value="buyer">Industrial Buyer (Biomass & Power)</option>
              <option value="baler">Baler Service Provider (Custom Hiring)</option>
              <option value="authority">Government / Pollution Board (Authority)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating ...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E3DED2] text-center text-xs text-[#5E6D63]">
          Don't have an account yet?{' '}
          <button
            onClick={() => onNavigate('/register')}
            className="font-semibold text-[#1B382B] hover:underline cursor-pointer"
          >
            Register Role Profile
          </button>
        </div>
      </div>
    </div>
  );
};
