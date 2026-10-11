import React, { useState } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { useToast } from '../../lib/context/ToastContext';
import { goBackendApi } from '../../lib/api/goService';
import { CropType, StrawCondition } from '../../types/listings';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface CreateRequirementPageProps {
  onNavigate: (path: string) => void;
}

export const CreateRequirementPage: React.FC<CreateRequirementPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [cropType, setCropType] = useState<CropType>('Paddy (Basmati)');
  const [conditions, setConditions] = useState<StrawCondition[]>(['Square Bales', 'Round Bales']);
  const [requiredQuantityTons, setRequiredQuantityTons] = useState<string>('');
  const [maxPricePerTon, setMaxPricePerTon] = useState<string>('');
  const [acceptableMoistureMax, setAcceptableMoistureMax] = useState<string>('');
  const [facilityName, setFacilityName] = useState('Patiala Biomass Generation Plant II');
  const [district, setDistrict] = useState(user?.location.district || 'Patiala');
  const [state, setState] = useState(user?.location.state || 'Punjab');
  const [pincode, setPincode] = useState('147001');
  const [deliveryDeadline, setDeliveryDeadline] = useState('2026-11-20');
  const [notes, setNotes] = useState('Daily receiving hours 06:00 to 22:00. Fast weighbridge processing.');
  const [submitting, setSubmitting] = useState(false);

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

  const toggleCondition = (cond: StrawCondition) => {
    setConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conditions.length === 0) {
      showToast('Validation Error', 'Please select at least one condition preference', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await goBackendApi.createRequirement({
        buyerId: user?.id || 'user_buyer_1',
        buyerName: user?.name || 'Anita Shenoy',
        buyerOrganization: user?.organizationName || 'Punjab GreenPower Biomass Energy Ltd',
        cropType,
        conditionPreference: conditions,
        requiredQuantityTons: Number(requiredQuantityTons) || 0,
        maxPricePerTon: Number(maxPricePerTon) || 0,
        acceptableMoistureMax: Number(acceptableMoistureMax) || 0,
        deliveryDeadline,
        destinationLocation: {
          facilityName,
          district,
          state,
          pincode,
          coordinates: [30.3398, 76.3869],
        },
        status: 'active',
        notes,
      });

      showToast('Requirement Posted', `${requiredQuantityTons || 0} Tons purchase order active`);
      onNavigate('/buyer/requirements');
    } catch {
      showToast('Submission Failed', 'Unable to create requirement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/buyer/requirements')}
          className="p-1.5 text-[#5E6D63] hover:text-[#19241B] rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#19241B] tracking-tight">Post Straw Purchase Requirement</h1>
          <p className="text-xs text-[#5E6D63]">
            Publish demand parameters for regional farmers and baling custom fleets
          </p>
        </div>
      </div>

      <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Required Crop Residue *
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value as CropType)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              >
                <option value="Paddy (Basmati)">Paddy (Basmati)</option>
                <option value="Paddy (Non-Basmati)">Paddy (Non-Basmati)</option>
                <option value="Wheat">Wheat Straw</option>
                <option value="Mustard Stalk">Mustard Stalk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Target Procurement Volume (Tons) *
              </label>
              <input
                type="number"
                min="10"
                step="10"
                required
                placeholder="e.g. 500"
                value={requiredQuantityTons}
                onChange={handleNumericChange(setRequiredQuantityTons)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] placeholder:text-[#5E6D63]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>
          </div>

          {/* Condition Preferences */}
          <div>
            <label className="block text-xs font-semibold text-[#19241B] mb-1.5">
              Acceptable Straw Formats (Select Multiple) *
            </label>
            <div className="flex flex-wrap gap-2">
              {(['Square Bales', 'Round Bales', 'Loose Straw', 'Chopped / Shredded'] as StrawCondition[]).map((cond) => {
                const isSelected = conditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1B382B] text-white border-[#1B382B] font-semibold'
                        : 'bg-white text-[#5E6D63] border-[#D5CFBF] hover:border-[#1B382B]/30'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Maximum Ceiling Rate (₹/Ton Delivered) *
              </label>
              <input
                type="number"
                min="1000"
                step="50"
                required
                placeholder="e.g. 2250"
                value={maxPricePerTon}
                onChange={handleNumericChange(setMaxPricePerTon)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] placeholder:text-[#5E6D63]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Maximum Tolerable Moisture (%) *
              </label>
              <input
                type="number"
                step="0.5"
                min="8"
                max="25"
                required
                placeholder="e.g. 16.0"
                value={acceptableMoistureMax}
                onChange={handleNumericChange(setAcceptableMoistureMax)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] placeholder:text-[#5E6D63]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>
          </div>

          {/* Destination Plant Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Facility / Boiler Complex Name *
              </label>
              <input
                type="text"
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                District *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              >
                <option value="Patiala">Patiala</option>
                <option value="Sangrur">Sangrur</option>
                <option value="Bathinda">Bathinda</option>
                <option value="Ludhiana">Ludhiana</option>
                <option value="Karnal">Karnal</option>
                <option value="Ambala">Ambala</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19241B] mb-1">
                Delivery Deadline Date *
              </label>
              <input
                type="date"
                required
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19241B] mb-1">
              Unloading Protocol & Weighbridge Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/buyer/requirements')}
              className="px-4 py-2.5 text-xs font-semibold text-[#5E6D63] hover:text-[#19241B] transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Registering Requirement...' : 'Post Purchase Requirement'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
