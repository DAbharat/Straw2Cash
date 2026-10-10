import React, { useState, useEffect } from 'react';
import { balerServiceApi } from '../../lib/api/balerService';
import { BalerProfile, BalerEquipment } from '../../types/baler';
import { useToast } from '../../lib/context/ToastContext';
import { Plus, Check, ShieldCheck, Tractor } from 'lucide-react';

interface BalerServicesPageProps {
  onNavigate: (path: string) => void;
}

export const BalerServicesPage: React.FC<BalerServicesPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<BalerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal or form for adding equipment
  const [showAddModal, setShowAddModal] = useState(false);
  const [makeModel, setMakeModel] = useState('');
  const [balerType, setBalerType] = useState<BalerEquipment['balerType']>('Square Baler');
  const [dailyCapacityTons, setDailyCapacityTons] = useState(50);
  const [yearOfManufacture, setYearOfManufacture] = useState(2024);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await balerServiceApi.getBalerProfile();
        setProfile(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdateRadius = async (radius: number) => {
    if (!profile) return;
    const updated = await balerServiceApi.updateBalerProfile({ serviceRadiusKm: radius });
    setProfile(updated);
    showToast('Service Radius Updated', `Operating area set to ${radius} km`);
  };

  const handleUpdateRate = async (ratePerAcre: number) => {
    if (!profile) return;
    const updated = await balerServiceApi.updateBalerProfile({ ratePerAcreBalingInr: ratePerAcre });
    setProfile(updated);
    showToast('Baling Rate Updated', `Rate set to ₹${ratePerAcre}/acre`);
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    await balerServiceApi.addEquipment({
      balerType,
      makeModel,
      dailyCapacityTons,
      fuelType: 'Tractor PTO',
      yearOfManufacture,
      availableFromDate: new Date().toISOString().split('T')[0],
      operationalStatus: 'Available',
    });
    const refreshed = await balerServiceApi.getBalerProfile();
    setProfile(refreshed);
    setShowAddModal(false);
    setMakeModel('');
    showToast('Machinery Added', `${makeModel} registered to fleet`);
  };

  const toggleEquipmentStatus = async (eqId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Available' ? 'On Job' : 'Available';
    await balerServiceApi.updateEquipmentStatus(eqId, nextStatus as any);
    const refreshed = await balerServiceApi.getBalerProfile();
    setProfile(refreshed);
    showToast('Equipment Status Updated', `Unit marked as ${nextStatus}`);
  };

  if (loading || !profile) {
    return <div className="py-20 text-center text-xs text-[#5E6D63]">Loading baler profile...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DED2]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#19241B] tracking-tight">{profile.businessName}</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EAF2ED] text-[#1E4530] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Custom Hiring Center
            </span>
          </div>
          <p className="text-xs text-[#5E6D63] mt-1">
            Operator: {profile.operatorName} · Base: {profile.baseDistrict} ({profile.baseState}) · {profile.phone}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Machinery</span>
        </button>
      </div>

      {/* Operational Service Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#19241B] mb-2">Service Radius</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-[#19241B]">{profile.serviceRadiusKm}</span>
            <span className="text-xs text-[#5E6D63]">km around {profile.baseDistrict}</span>
          </div>
          <input
            type="range"
            min="15"
            max="100"
            step="5"
            value={profile.serviceRadiusKm}
            onChange={(e) => handleUpdateRadius(Number(e.target.value))}
            className="w-full accent-[#1B382B] mt-4"
          />
          <p className="text-[11px] text-[#5E6D63] mt-2">
            Fields within this distance are automatically matched to your dispatch calendar.
          </p>
        </div>

        <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#19241B] mb-2">Baling Rate (Per Acre)</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-[#1B382B]">₹{profile.ratePerAcreBalingInr}</span>
            <span className="text-xs text-[#5E6D63]">/ acre contract fee</span>
          </div>
          <input
            type="range"
            min="1000"
            max="1800"
            step="50"
            value={profile.ratePerAcreBalingInr}
            onChange={(e) => handleUpdateRate(Number(e.target.value))}
            className="w-full accent-[#1B382B] mt-4"
          />
          <p className="text-[11px] text-[#5E6D63] mt-2">
            Competitive market range in Punjab: ₹1,200 - ₹1,400/acre.
          </p>
        </div>

        <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#19241B] mb-2">Aggregate Fleet Capacity</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-[#245E3F]">
              {profile.equipment.reduce((acc, eq) => acc + eq.dailyCapacityTons, 0)}
            </span>
            <span className="text-xs text-[#5E6D63]">Tons / Day throughput</span>
          </div>
          <p className="text-xs text-[#5E6D63] mt-4">
            {profile.equipment.length} registered machinery units · {profile.operatorCount} licensed operators
          </p>
        </div>
      </div>

      {/* Equipment Machinery Fleet List */}
      <div>
        <h2 className="text-base font-bold text-[#19241B] mb-4">Registered Machinery & Baler Units</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {profile.equipment.map((eq) => (
            <div key={eq.id} className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#19241B]">{eq.makeModel}</h3>
                  <p className="text-xs text-[#5E6D63] mt-0.5">{eq.balerType} ({eq.yearOfManufacture})</p>
                </div>
                <button
                  onClick={() => toggleEquipmentStatus(eq.id, eq.operationalStatus)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                    eq.operationalStatus === 'Available'
                      ? 'bg-[#EAF2ED] text-[#1E4530]'
                      : 'bg-[#FEF4E8] text-[#8C4600]'
                  }`}
                  title="Click to toggle status"
                >
                  {eq.operationalStatus}
                </button>
              </div>

              <div className="p-3 bg-[#F4F0E6] rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#5E6D63]">Daily Capacity:</span>
                  <span className="font-mono font-bold text-[#19241B]">{eq.dailyCapacityTons} Tons/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E6D63]">Drive Mechanism:</span>
                  <span className="text-[#19241B]">{eq.fuelType}</span>
                </div>
              </div>

              <button
                onClick={() => toggleEquipmentStatus(eq.id, eq.operationalStatus)}
                className="w-full py-2 bg-white border border-[#D5CFBF] hover:bg-[#FAF8F3] text-xs font-semibold rounded-lg text-[#19241B] transition-colors cursor-pointer"
              >
                Toggle {eq.operationalStatus === 'Available' ? 'to On Job' : 'to Available'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-base font-bold text-[#19241B] mb-4">Register New Agricultural Machinery</h3>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#19241B] mb-1">Make & Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Holland BC5060 Square Baler"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#19241B] mb-1">Baler Type *</label>
                <select
                  value={balerType}
                  onChange={(e) => setBalerType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                >
                  <option value="Square Baler">Square Baler (High Density)</option>
                  <option value="Round Baler (High Density)">Round Baler (High Density)</option>
                  <option value="Mini Baler">Mini Baler</option>
                  <option value="Rake & Tedder Unit">Rake & Tedder Unit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#19241B] mb-1">Daily Capacity (Tons)</label>
                  <input
                    type="number"
                    min="10"
                    value={dailyCapacityTons}
                    onChange={(e) => setDailyCapacityTons(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#19241B] mb-1">Year</label>
                  <input
                    type="number"
                    min="2015"
                    max="2026"
                    value={yearOfManufacture}
                    onChange={(e) => setYearOfManufacture(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFBF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B382B]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5E6D63] hover:text-[#19241B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D]"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
