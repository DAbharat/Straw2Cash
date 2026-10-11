import React, { useState } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { useToast } from '../lib/context/ToastContext';
import { UserRole } from '../types/auth';
import { BlurRevealText } from '../components/ui/BlurRevealText';
import { User, MapPin, Phone, Mail, Building2, CheckCircle2, Save } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfile, switchRole } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [villageOrCity, setVillageOrCity] = useState(user?.location.villageOrCity || '');
  const [district, setDistrict] = useState(user?.location.district || 'Sangrur');
  const [state, setState] = useState(user?.location.state || 'Punjab');
  const [pincode, setPincode] = useState(user?.location.pincode || '148001');
  const [organizationName, setOrganizationName] = useState(user?.organizationName || '');
  const [farmSizeAcres, setFarmSizeAcres] = useState<string>(user?.farmSizeAcres ? String(user.farmSizeAcres) : '35');
  const [saving, setSaving] = useState(false);

  // Clean numeric input handler: preserves empty state and prevents leading-zero appending
  const handleNumericChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === '') {
      setter('');
      return;
    }
    if (/^0\d+/.test(val)) {
      val = val.replace(/^0+/, '');
    }
    setter(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        email,
        organizationName,
        farmSizeAcres: user?.role === 'farmer' ? (Number(farmSizeAcres) || 0) : undefined,
        location: {
          villageOrCity,
          district,
          state,
          pincode,
        },
      });
      showToast('Profile Updated', 'User and organization details saved successfully');
    } catch {
      showToast('Error', 'Unable to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DED2]">
        <div>
          <BlurRevealText
            text="User Profile & Organization Settings"
            as="h1"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          />
          <p className="text-xs text-white/70 mt-1">
            Manage your account credentials, regional farm location, and active role identity
          </p>
        </div>

        {/* Quick Role Switcher */}
        {/* <div className="flex items-center gap-1.5 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xs w-fit max-w-full overflow-x-auto">
          <span className="text-[11px] font-semibold text-white/70 px-2 shrink-0">Role:</span>
          {(['farmer', 'buyer', 'baler'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                switchRole(r);
                showToast('Role Switched', `Active view changed to ${r}`);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                user?.role === r
                  ? 'bg-[#1B382B] text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left card */}
        <div className="bg-transparent backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-sm space-y-4 text-white">
          <div className="text-center pb-4 border-b border-white/20">
            <div className="w-16 h-16 rounded-full bg-[#1B382B] text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-sm">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <h2 className="text-base font-bold text-white">{user?.name}</h2>
            <p className="text-xs font-semibold text-[#68BA75] capitalize mt-0.5">{user?.role} Account</p>
            <p className="text-[11px] text-white/70 mt-1">{user?.organizationName}</p>
          </div>

          <div className="space-y-2.5 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#E5A812] shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#E5A812] shrink-0" />
              <span>{user?.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#E5A812] shrink-0" />
              <span>{user?.location.district}, {user?.location.state}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/20">
            <div className="p-3 bg-white/5 border border-white/20 rounded-xl text-xs text-white/90 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#68BA75] shrink-0" />
              <span>Verified Direct Bank Settlement Registered</span>
            </div>
          </div>
        </div>

        {/* Right edit form */}
        <div className="md:col-span-2 bg-transparent backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-white/20">
              Edit Organization & Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Mobile (+91)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Organization / Entity Name</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Village / City Address</label>
                <input
                  type="text"
                  value={villageOrCity}
                  onChange={(e) => setVillageOrCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                >
                  <option className="bg-[#19241B] text-white" value="Sangrur">Sangrur</option>
                  <option className="bg-[#19241B] text-white" value="Patiala">Patiala</option>
                  <option className="bg-[#19241B] text-white" value="Ludhiana">Ludhiana</option>
                  <option className="bg-[#19241B] text-white" value="Bathinda">Bathinda</option>
                  <option className="bg-[#19241B] text-white" value="Tarn Taran">Tarn Taran</option>
                  <option className="bg-[#19241B] text-white" value="Karnal">Karnal</option>
                  <option className="bg-[#19241B] text-white" value="Ambala">Ambala</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                >
                  <option className="bg-[#19241B] text-white" value="Punjab">Punjab</option>
                  <option className="bg-[#19241B] text-white" value="Haryana">Haryana</option>
                  <option className="bg-[#19241B] text-white" value="Uttar Pradesh">Uttar Pradesh</option>
                </select>
              </div>
            </div>

            {user?.role === 'farmer' && (
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Managed Farmland (Acres)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 35"
                  value={farmSizeAcres}
                  onChange={handleNumericChange(setFarmSizeAcres)}
                  className="w-full px-3 py-2 text-xs text-white placeholder:text-white/40 bg-transparent border border-[#D5CFBF]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
