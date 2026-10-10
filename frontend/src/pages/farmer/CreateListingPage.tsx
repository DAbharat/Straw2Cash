import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { useToast } from '../../lib/context/ToastContext';
import { goBackendApi } from '../../lib/api/goService';
import { CropType, StrawCondition } from '../../types/listings';
import { BlurRevealText } from '../../components/ui/BlurRevealText';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface CreateListingPageProps {
  onNavigate: (path: string) => void;
  initialParams?: URLSearchParams;
}

export const CreateListingPage: React.FC<CreateListingPageProps> = ({
  onNavigate,
  initialParams,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [cropType, setCropType] = useState<CropType>('Paddy (Basmati)');
  const [condition, setCondition] = useState<StrawCondition>('Square Bales');
  const [quantityTons, setQuantityTons] = useState<number>(100);
  const [pricePerTonExpected, setPricePerTonExpected] = useState<number>(2150);
  const [fieldAreaAcres, setFieldAreaAcres] = useState<number>(35);
  const [moisturePercentage, setMoisturePercentage] = useState<number>(14.0);
  const [villageOrField, setVillageOrField] = useState('Bhawani Garh Sector 2');
  const [district, setDistrict] = useState(user?.location.district || 'Sangrur');
  const [state, setState] = useState(user?.location.state || 'Punjab');
  const [pincode, setPincode] = useState('148026');
  const [availableDate, setAvailableDate] = useState('2026-10-15');
  const [expiryDate, setExpiryDate] = useState('2026-10-30');
  const [notes, setNotes] = useState('Harvested with Super SMS combine. Dry storage available.');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialParams) {
      const qCrop = initialParams.get('crop');
      const qQty = initialParams.get('qty');
      const qAcres = initialParams.get('acres');
      if (qCrop) setCropType(qCrop as CropType);
      if (qQty) setQuantityTons(Number(qQty));
      if (qAcres) setFieldAreaAcres(Number(qAcres));
    }
  }, [initialParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await goBackendApi.createListing({
        farmerId: user?.id || 'user_farmer_1',
        farmerName: user?.name || 'Gurpreet Singh Brar',
        farmerPhone: user?.phone || '+91 98721 44521',
        cropType,
        condition,
        quantityTons,
        pricePerTonExpected,
        fieldAreaAcres,
        moisturePercentage,
        location: {
          villageOrField,
          district,
          state,
          pincode,
          coordinates: [30.2458, 76.0411],
        },
        availableDate,
        expiryDate,
        status: 'available',
        notes,
      });

      showToast('Straw Listing Published', `${quantityTons} Tons of ${cropType} live on marketplace`);
      onNavigate('/farmer/listings');
    } catch {
      showToast('Failed to Create Listing', 'Please check required fields', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-white">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/farmer/listings')}
          className="p-2 text-white/70 hover:text-white rounded-xl bg-black/40 border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <BlurRevealText
            text="Create Straw Listing"
            as="h1"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          />
          <p className="text-xs text-white/60 mt-0.5">
            Publish your harvested or standing straw residue for verified industrial buyers
          </p>
        </div>
      </div>

      <div className="bg-[#0D1810]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Crop Variety *
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value as CropType)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              >
                <option value="Paddy (Basmati)" className="bg-[#0D1810] text-white">Paddy (Basmati)</option>
                <option value="Paddy (Non-Basmati)" className="bg-[#0D1810] text-white">Paddy (Non-Basmati)</option>
                <option value="Wheat" className="bg-[#0D1810] text-white">Wheat</option>
                <option value="Mustard Stalk" className="bg-[#0D1810] text-white">Mustard Stalk</option>
                <option value="Sugarcane Trash" className="bg-[#0D1810] text-white">Sugarcane Trash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Bale / Residue Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as StrawCondition)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              >
                <option value="Square Bales" className="bg-[#0D1810] text-white">Square Bales (High Density)</option>
                <option value="Round Bales" className="bg-[#0D1810] text-white">Round Bales</option>
                <option value="Loose Straw" className="bg-[#0D1810] text-white">Loose Straw (In-Field Standing)</option>
                <option value="Chopped / Shredded" className="bg-[#0D1810] text-white">Chopped / Shredded</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Quantity (Tons) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantityTons}
                onChange={(e) => setQuantityTons(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Expected Rate (₹/Ton) *
              </label>
              <input
                type="number"
                min="500"
                step="50"
                required
                value={pricePerTonExpected}
                onChange={(e) => setPricePerTonExpected(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Moisture Content (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="30"
                value={moisturePercentage}
                onChange={(e) => setMoisturePercentage(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              />
            </div>
          </div>

          {/* Location details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Field Address / Village *
              </label>
              <input
                type="text"
                required
                value={villageOrField}
                onChange={(e) => setVillageOrField(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                District *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              >
                <option value="Sangrur" className="bg-[#0D1810] text-white">Sangrur</option>
                <option value="Patiala" className="bg-[#0D1810] text-white">Patiala</option>
                <option value="Ludhiana" className="bg-[#0D1810] text-white">Ludhiana</option>
                <option value="Bathinda" className="bg-[#0D1810] text-white">Bathinda</option>
                <option value="Tarn Taran" className="bg-[#0D1810] text-white">Tarn Taran</option>
                <option value="Karnal" className="bg-[#0D1810] text-white">Karnal</option>
                <option value="Kaithal" className="bg-[#0D1810] text-white">Kaithal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              >
                <option value="Punjab" className="bg-[#0D1810] text-white">Punjab</option>
                <option value="Haryana" className="bg-[#0D1810] text-white">Haryana</option>
                <option value="Uttar Pradesh" className="bg-[#0D1810] text-white">Uttar Pradesh</option>
              </select>
            </div>
          </div>

          {/* Availability window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Available for Pickup From *
              </label>
              <input
                type="date"
                required
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Listing Expiration Date *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Field Road Access & Storage Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tractor accessible pucca road, field cleared with combine Super SMS"
              className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/farmer/listings')}
              className="px-4 py-2.5 text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 hover:scale-102"
            >
              <span>{submitting ? 'Submitting to Go Backend...' : 'Publish Straw Batch'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E5A812]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
