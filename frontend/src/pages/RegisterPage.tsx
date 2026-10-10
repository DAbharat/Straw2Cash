import React, { useState } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { useToast } from '../lib/context/ToastContext';
import { UserRole } from '../types/auth';
import { BlurRevealText } from '../components/ui/BlurRevealText';
import { ArrowRight, Check } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>('farmer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Sangrur');
  const [state, setState] = useState('Punjab');
  const [villageOrCity, setVillageOrCity] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState<number>(30);
  const [organizationName, setOrganizationName] = useState('');
  const [buyerType, setBuyerType] = useState<'Bio-Energy' | 'Paper Mill' | 'Ethanol Plant'>('Bio-Energy');
  const [balerCount, setBalerCount] = useState<number>(2);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name,
        email,
        phone,
        role,
        location: {
          villageOrCity: villageOrCity || 'Local Belt',
          district,
          state,
          pincode: '148001',
        },
        organizationName: organizationName || (role === 'farmer' ? `${name} Farm` : undefined),
        farmSizeAcres: role === 'farmer' ? farmSizeAcres : undefined,
        buyerType: role === 'buyer' ? buyerType : undefined,
        balerEquipmentCount: role === 'baler' ? balerCount : undefined,
      });

      showToast('Registration Successful', `Account created with role ${role}`);
      onNavigate('/dashboard');
    } catch {
      showToast('Registration Error', 'Unable to register profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl bg-white/85 backdrop-blur-xl border border-white/70 rounded-3xl p-5 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <div className="text-center mb-6">
          <BlurRevealText
            text="Create your Straw2Cash Account"
            as="h2"
            className="text-2xl sm:text-3xl font-extrabold text-[#19241B] tracking-tight"
          />
          <p className="text-xs text-[#5E6D63] mt-1.5">
            Join the zero-burning agricultural straw exchange
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#19241B] mb-2 text-center">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#F0ECE1] rounded-xl">
            {(['farmer', 'buyer', 'baler'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  role === r
                    ? 'bg-white text-[#1B382B] shadow-sm'
                    : 'text-[#5E6D63] hover:text-[#19241B]'
                }`}
              >
                {r === 'farmer' ? '🌾 Farmer' : r === 'buyer' ? '🏭 Buyer' : '🚜 Baler'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Full Name / Legal Representative *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gurpreet Singh"
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Mobile Number (+91) *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@agro.in"
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                District (Punjab / Haryana) *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              >
                <option value="Sangrur">Sangrur (PB)</option>
                <option value="Patiala">Patiala (PB)</option>
                <option value="Ludhiana">Ludhiana (PB)</option>
                <option value="Bathinda">Bathinda (PB)</option>
                <option value="Tarn Taran">Tarn Taran (PB)</option>
                <option value="Karnal">Karnal (HR)</option>
                <option value="Kaithal">Kaithal (HR)</option>
                <option value="Ambala">Ambala (HR)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19241B] mb-1">
              Village / Focal Point / Facility Address
            </label>
            <input
              type="text"
              value={villageOrCity}
              onChange={(e) => setVillageOrCity(e.target.value)}
              placeholder="e.g. Bhawani Garh Road"
              className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
            />
          </div>

          {/* Role specific inputs */}
          {role === 'farmer' && (
            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Total Operational Landholding (Acres)
              </label>
              <input
                type="number"
                min="1"
                value={farmSizeAcres}
                onChange={(e) => setFarmSizeAcres(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>
          )}

          {role === 'buyer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#19241B] mb-1">
                  Plant / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Punjab BioPower Ltd"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#19241B] mb-1">
                  Industry Sector
                </label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                >
                  <option value="Bio-Energy">Bio-Energy / Boiler Power</option>
                  <option value="Paper Mill">Paper & Pulp Mill</option>
                  <option value="Ethanol Plant">2G Bio-Ethanol Refinery</option>
                </select>
              </div>
            </div>
          )}

          {role === 'baler' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#19241B] mb-1">
                  Center / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Malwa Custom Hiring Center"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#19241B] mb-1">
                  Active Baler Machines
                </label>
                <input
                  type="number"
                  min="1"
                  value={balerCount}
                  onChange={(e) => setBalerCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'Creating Profile...' : 'Complete Registration'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E3DED2] text-center text-xs text-[#5E6D63]">
          Already registered?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="font-semibold text-[#1B382B] hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
