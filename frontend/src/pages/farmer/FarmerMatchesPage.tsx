import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { goBackendApi } from '../../lib/api/goService';
import { StrawMatch } from '../../types/listings';
import { Sparkles, Building2, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FarmerMatchesPageProps {
  onNavigate: (path: string) => void;
}

export const FarmerMatchesPage: React.FC<FarmerMatchesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<StrawMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await goBackendApi.getFarmerMatches(user?.id || 'user_farmer_1');
        setMatches(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-[#E3DED2]">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C88A1B] mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Go Matching Algorithm Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-[#19241B] tracking-tight">Matching Buyer Requirements</h1>
        <p className="text-xs text-[#5E6D63]">
          Automated demand pairing based on crop variety, bale type, moisture tolerance, and transport proximity
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#5E6D63]">Running matching algorithm...</div>
      ) : matches.length === 0 ? (
        <div className="p-12 bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl text-center">
          <p className="text-sm font-bold text-[#19241B]">No matches currently available</p>
          <p className="text-xs text-[#5E6D63] mt-1 mb-4">
            Try creating a new straw listing with updated crop variety or check back as new buyers post requirements.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 hover:border-[#245E3F]/40 transition-all shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Buyer details & Match score */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#EAF2ED] text-[#1E4530]">
                      {m.compatibilityScore}% Compatibility
                    </span>
                    <h3 className="text-base font-bold text-[#19241B]">
                      {m.requirement.buyerOrganization}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#5E6D63]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#8A795D]" />
                      <span>{m.requirement.destinationLocation.facilityName}</span>
                    </div>
                    <span aria-hidden="true">·</span>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8A795D]" />
                      <span>{m.distanceKm} km from your field</span>
                    </div>
                    <span aria-hidden="true">·</span>
                    <span>Crop: <strong>{m.requirement.cropType}</strong></span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F4F0E6] rounded-xl text-xs">
                    <div>
                      <p className="text-[#5E6D63]">Buyer Ceiling Rate</p>
                      <p className="font-mono font-bold text-[#19241B]">
                        ₹{m.requirement.maxPricePerTon.toLocaleString()}/ton
                      </p>
                    </div>
                    <div>
                      <p className="text-[#5E6D63]">Est. Freight Cost</p>
                      <p className="font-mono font-semibold text-[#19241B]">
                        ₹{m.estimatedLogisticsCostPerTon}/ton
                      </p>
                    </div>
                    <div>
                      <p className="text-[#5E6D63]">Max Moisture Limit</p>
                      <p className="font-mono font-semibold text-[#19241B]">
                        {m.requirement.acceptableMoistureMax}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Action */}
                <div className="lg:text-right flex flex-col justify-between shrink-0 space-y-3">
                  <div>
                    <p className="text-xs text-[#5E6D63]">Target Procurement</p>
                    <p className="text-xl font-bold font-mono tabular-nums text-[#19241B]">
                      {m.requirement.requiredQuantityTons} Tons
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate(`/quotes?listingId=${m.listingId}&requirementId=${m.requirementId}&price=${m.requirement.maxPricePerTon}&qty=100`);
                    }}
                    className="px-5 py-2.5 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Request Java Rules Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
