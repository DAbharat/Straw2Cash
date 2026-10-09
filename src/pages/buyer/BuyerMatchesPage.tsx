import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { goBackendApi } from '../../lib/api/goService';
import { StrawMatch } from '../../types/listings';
import { Sparkles, MapPin, ArrowRight, User } from 'lucide-react';

interface BuyerMatchesPageProps {
  onNavigate: (path: string) => void;
}

export const BuyerMatchesPage: React.FC<BuyerMatchesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<StrawMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await goBackendApi.getMatchesForBuyer(user?.id || 'user_buyer_1');
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
          <span>Biomass Logistics & Feedstock Optimization</span>
        </div>
        <h1 className="text-2xl font-bold text-[#19241B] tracking-tight">
          Matching Farm-Gate Straw Batches
        </h1>
        <p className="text-xs text-[#5E6D63]">
          Straw lots matching your plant's procurement quotas within economical haul distance
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#5E6D63]">Calculating logistics match scores...</div>
      ) : matches.length === 0 ? (
        <div className="p-16 bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl text-center">
          <p className="text-base font-bold text-[#19241B]">No matching farmer lots currently</p>
          <p className="text-xs text-[#5E6D63] mt-1 mb-4">
            Browse the marketplace directly to view all active farmer listings.
          </p>
          <button
            onClick={() => onNavigate('/buyer/marketplace')}
            className="px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs font-semibold"
          >
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 hover:border-[#245E3F]/40 transition-all shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#EAF2ED] text-[#1E4530]">
                      {m.compatibilityScore}% Match
                    </span>
                    <h3 className="text-base font-bold text-[#19241B]">
                      {m.listing.cropType} · {m.listing.condition}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#5E6D63]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8A795D]" />
                      <span>Farmer: <strong>{m.listing.farmerName}</strong></span>
                    </div>
                    <span aria-hidden="true">·</span>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8A795D]" />
                      <span>{m.listing.location.villageOrField}, {m.listing.location.district} ({m.distanceKm} km away)</span>
                    </div>
                    <span aria-hidden="true">·</span>
                    <span>Moisture: <strong className="font-mono">{m.listing.moisturePercentage}%</strong></span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F4F0E6] rounded-xl text-xs">
                    <div>
                      <p className="text-[#5E6D63]">Farmer Asking Rate</p>
                      <p className="font-mono font-bold text-[#19241B]">
                        ₹{m.listing.pricePerTonExpected.toLocaleString()}/ton
                      </p>
                    </div>
                    <div>
                      <p className="text-[#5E6D63]">Est. Freight Haulage</p>
                      <p className="font-mono font-semibold text-[#19241B]">
                        ₹{m.estimatedLogisticsCostPerTon}/ton
                      </p>
                    </div>
                    <div>
                      <p className="text-[#5E6D63]">Logistics Feasibility</p>
                      <p className="font-mono font-semibold text-[#245E3F]">
                        {m.logisticsFeasibility}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:text-right flex flex-col justify-between shrink-0 space-y-3">
                  <div>
                    <p className="text-xs text-[#5E6D63]">Available Residue Volume</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#19241B]">
                      {m.listing.quantityTons} Tons
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate(`/quotes?listingId=${m.listingId}&requirementId=${m.requirementId}&price=${m.listing.pricePerTonExpected}&qty=${m.listing.quantityTons}`);
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
