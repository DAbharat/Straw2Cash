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
      await login(identifier, password, selectedRole);
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg bg-transparent backdrop-blur-xl border border-white/50 rounded-3xl p-5 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <div className="text-center mb-8">
          <BlurRevealText
            text="Sign in to Straw2Cash"
            as="h2"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Registered Phone Number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-white bg-transparent border border-white/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] focus:border-[#1B382B] font-mono"
              placeholder="e.g. 9000000001"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-white bg-transparent border border-white/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] focus:border-[#1B382B]"
              placeholder="e.g. farmer123"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Active User Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 text-xs text-white bg-transparent border border-white/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] focus:border-[#1B382B]"
            >
              <option className="bg-[#19241B] text-white" value="farmer">Farmer (Producer & Residue Seller)</option>
              <option className="bg-[#19241B] text-white" value="buyer">Industrial Buyer (Biomass & Power)</option>
              <option className="bg-[#19241B] text-white" value="baler">Baler Service Provider (Custom Hiring)</option>
              <option className="bg-[#19241B] text-white" value="authority">Government / Pollution Board (Authority)</option>
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
