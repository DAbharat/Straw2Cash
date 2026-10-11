import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { useToast } from '../lib/context/ToastContext';
import { BlurRevealText } from '../components/ui/BlurRevealText';
import { MapPin, Phone, Mail, CheckCircle2, Save, Edit3 } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const getFallbackPhone = () => {
    if (user?.phone && user.phone !== 'undefined' && user.phone.trim() !== '') return user.phone;
    if (typeof window !== 'undefined') {
      const storedPhone = localStorage.getItem('s2c_login_phone');
      if (storedPhone && storedPhone !== 'undefined' && storedPhone.trim() !== '') return storedPhone;
    }
    return '9000000001';
  };

  const effectivePhone = getFallbackPhone();
  const effectiveEmail = (user?.email && !user.email.includes('undefined'))
    ? user.email
    : `${effectivePhone}@straw2cash.in`;

  const [name, setName] = useState(user?.name || 'Gurpreet Singh');
  const [phone, setPhone] = useState(effectivePhone);
  const [email, setEmail] = useState(effectiveEmail);
  const [villageOrCity, setVillageOrCity] = useState(user?.location?.villageOrCity || 'PB');
  const [district, setDistrict] = useState(user?.location?.district || 'Sangrur');
  const [state, setState] = useState(user?.location?.state || 'Punjab');
  const [organizationName, setOrganizationName] = useState(user?.organizationName || 'Brar Natural Farm Co-Op');
  const [farmSizeAcres, setFarmSizeAcres] = useState<string>(
    user?.farmSizeAcres !== undefined ? String(user.farmSizeAcres) : '35'
  );
  const [saving, setSaving] = useState(false);

  // When changes are saved, transformed into edit mode. Initial state matches current editing view.
  const [isEditing, setIsEditing] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('s2c_profile_saved') === 'true' ? false : true;
    }
    return true;
  });

  // Keep form in sync when auth user updates
  useEffect(() => {
    if (user) {
      const loginPhone = localStorage.getItem('s2c_login_phone') || '9000000001';
      const effPhone = (user.phone && user.phone !== 'undefined' && user.phone.trim() !== '')
        ? user.phone
        : loginPhone;
      const effEmail = (user.email && !user.email.includes('undefined'))
        ? user.email
        : `${effPhone}@straw2cash.in`;

      setName(user.name || 'Gurpreet Singh');
      setPhone(effPhone);
      setEmail(effEmail);
      setVillageOrCity(user.location?.villageOrCity || 'PB');
      setDistrict(user.location?.district || 'Sangrur');
      setState(user.location?.state || 'Punjab');
      setOrganizationName(user.organizationName || 'Brar Natural Farm Co-Op');
      if (user.farmSizeAcres !== undefined) {
        setFarmSizeAcres(String(user.farmSizeAcres));
      }
    }
  }, [user]);

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
          pincode: user?.location?.pincode || '148001',
        },
      });
      localStorage.setItem('s2c_profile_saved', 'true');
      showToast('Changes saved', 'Profile information has been updated successfully');
      setIsEditing(false);
    } catch {
      showToast('Error', 'Unable to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayPhone = phone || effectivePhone;
  const formattedDisplayPhone = displayPhone.startsWith('+91') ? displayPhone : `+91 ${displayPhone}`;
  const displayEmail = email || effectiveEmail;

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left card */}
        <div className="bg-transparent backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-sm space-y-4 text-white">
          <div className="text-center pb-4 border-b border-white/20">
            <div className="w-16 h-16 rounded-full bg-[#1B382B] text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-sm border border-white/10">
              {name ? name[0] : (user?.name ? user.name[0] : 'G')}
            </div>
            <h2 className="text-base font-bold text-white">{name || user?.name || 'Gurpreet Singh'}</h2>
            <p className="text-xs font-semibold text-[#68BA75] capitalize mt-0.5">{user?.role || 'farmer'} Account</p>
            <p className="text-[11px] text-white/70 mt-1">{organizationName || user?.organizationName || 'Brar Natural Farm Co-Op'}</p>
          </div>

          <div className="space-y-2.5 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#E5A812] shrink-0" />
              <span className="truncate">{displayEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#E5A812] shrink-0" />
              <span>{formattedDisplayPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#E5A812] shrink-0" />
              <span>{villageOrCity ? `${villageOrCity}, ` : ''}{district}, {state}</span>
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
            <div className="flex items-center justify-between pb-2 border-b border-white/20">
              <h2 className="text-sm font-bold text-white">
                {isEditing ? 'Edit Organization & Contact Information' : 'Organization & Contact Information'}
              </h2>
              {!isEditing && (
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#68BA75]/20 text-[#68BA75] rounded-full border border-[#68BA75]/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs text-white bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Mobile (+91)</label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9000000001"
                  className={`w-full px-3 py-2 text-xs text-white bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Email</label>
                <input
                  type="email"
                  required
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-xs text-white bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Organization / Entity Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Brar Natural Farm Co-Op"
                  className={`w-full px-3 py-2 text-xs text-white bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Village / City Address</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={villageOrCity}
                  onChange={(e) => setVillageOrCity(e.target.value)}
                  className={`w-full px-3 py-2 text-xs text-white bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">District</label>
                <select
                  disabled={!isEditing}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={`w-full px-3 py-2 text-xs text-white bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
                >
                  <option className="bg-[#19241B] text-white" value="Sangrur">Sangrur</option>
                  <option className="bg-[#19241B] text-white" value="Patiala">Patiala</option>
                  <option className="bg-[#19241B] text-white" value="Ludhiana">Ludhiana</option>
                  <option className="bg-[#19241B] text-white" value="Bathinda">Bathinda</option>
                  <option className="bg-[#19241B] text-white" value="Moga">Moga</option>
                  <option className="bg-[#19241B] text-white" value="Tarn Taran">Tarn Taran</option>
                  <option className="bg-[#19241B] text-white" value="Karnal">Karnal</option>
                  <option className="bg-[#19241B] text-white" value="Ambala">Ambala</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">State</label>
                <select
                  disabled={!isEditing}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={`w-full px-3 py-2 text-xs text-white bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
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
                  disabled={!isEditing}
                  placeholder="e.g. 35"
                  value={farmSizeAcres}
                  onChange={handleNumericChange(setFarmSizeAcres)}
                  className={`w-full px-3 py-2 text-xs text-white placeholder:text-white/40 bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B] transition-colors ${
                    !isEditing
                      ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-90'
                      : 'border-[#D5CFBF]/50 focus:border-[#1B382B]'
                  }`}
                />
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2.5">
              {isEditing ? (
                <>
                  {localStorage.getItem('s2c_profile_saved') && (
                    <button
                      type="button"
                      onClick={() => {
                        const effP = effectivePhone;
                        setName(user?.name || 'Gurpreet Singh');
                        setPhone(effP);
                        setEmail(effectiveEmail);
                        setVillageOrCity(user?.location?.villageOrCity || 'PB');
                        setDistrict(user?.location?.district || 'Sangrur');
                        setState(user?.location?.state || 'Punjab');
                        setOrganizationName(user?.organizationName || 'Brar Natural Farm Co-Op');
                        if (user?.farmSizeAcres !== undefined) setFarmSizeAcres(String(user.farmSizeAcres));
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

