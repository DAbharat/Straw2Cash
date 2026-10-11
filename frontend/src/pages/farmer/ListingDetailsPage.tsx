import React, { useState, useEffect } from 'react';
import { goBackendApi } from '../../lib/api/goService';
import { StrawListing, ListingStatus } from '../../types/listings';
import { useToast } from '../../lib/context/ToastContext';
import { BlurRevealText } from '../../components/ui/BlurRevealText';
import { ArrowLeft, ArrowRight, MapPin, Calendar, Weight, ShieldCheck, Flame, CheckCircle2 } from 'lucide-react';

interface ListingDetailsPageProps {
  listingId: string;
  onNavigate: (path: string) => void;
}

export const ListingDetailsPage: React.FC<ListingDetailsPageProps> = ({
  listingId,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [listing, setListing] = useState<StrawListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const item = await goBackendApi.getListingById(listingId);
        setListing(item);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId]);

  const handleUpdateStatus = async (status: ListingStatus) => {
    if (!listing) return;
    try {
      const updated = await goBackendApi.updateListingStatus(listing.id, status);
      setListing(updated);
      showToast('Status Updated', `Listing marked as ${status}`);
    } catch {
      showToast('Error', 'Unable to update listing status', 'error');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-white/60">Loading listing details...</div>;
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-white">
        <p className="text-sm font-bold">Listing Not Found</p>
        <button
          onClick={() => onNavigate('/farmer/listings')}
          className="mt-4 px-4 py-2 bg-[#2E581F] text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-white">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/farmer/listings')}
          className="p-2 text-white/70 hover:text-white rounded-lg bg-black/40 border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <BlurRevealText
              text={listing.cropType}
              as="h1"
              className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
            />
            <span className={`text-xs font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-none ${
              listing.status === 'available'
                ? 'bg-emerald-500/20 text-emerald-300'
                : listing.status === 'reserved'
                ? 'bg-amber-500/20 text-amber-300'
                : listing.status === 'fulfilled'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-red-500/20 text-red-300'
            }`}>
              {listing.status}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-mono">
            Listing ID: <span className="text-white/80">{listing.id}</span> · By {listing.farmerName} · {listing.farmerPhone}
          </p>
        </div>
      </div>

      {/* Utilitarian Data Panel */}
      <div className="bg-transparent backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
          {/* SECTION A: Residue Specifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-[#E5A812]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Residue Specifications
                </h2>
              </div>
              <span className="text-[11px] font-mono text-white/50">{listing.cropType}</span>
            </div>

            {/* Left-aligned rows with thin horizontal dividers */}
            <div className="divide-y divide-white/10 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Residue Quantity</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                    {listing.quantityTons} Tons
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Residue Form</p>
                  <p className="text-xl font-bold text-white mt-0.5 truncate" title={listing.condition}>
                    {listing.condition}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Moisture Tested</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                    {listing.moisturePercentage}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Area Harvested</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                    {listing.fieldAreaAcres} Acres
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Expected Rate</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-[#E5A812] mt-0.5">
                    ₹{listing.pricePerTonExpected.toLocaleString()}<span className="text-xs text-white/50 font-normal">/ton</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Est. Batch Value</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-[#E5A812] mt-0.5">
                    ₹{(listing.quantityTons * listing.pricePerTonExpected).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Field Access & Storage Notes</p>
                <p className="text-xs text-white/80 leading-relaxed mt-1">
                  {listing.notes || 'Harvested with Super SMS combine. Dry storage available.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION B: Listing Controls */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#E5A812]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                    Listing Controls
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-white/50">Quick Actions</span>
              </div>

              <div className="mt-3">
                <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium mb-3">
                  Update Operational Status
                </p>
                {/* Flat rectangular buttons with no rounded corners, 2x2 grid, no borders */}
                <div className="grid grid-cols-2 gap-2">
                  {(['available', 'reserved', 'fulfilled', 'cancelled'] as ListingStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`py-3 px-3 text-center text-xs font-bold uppercase tracking-wider rounded-none border-none transition-colors cursor-pointer ${
                        listing.status === st
                          ? 'bg-[#2E581F] text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                      }`}
                    >
                      Mark As {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Baler & Logistics Status</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">Ready for Matching</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Updating status locks batch allocation against double-booking across regional buyers.
                </p>
              </div>

              {/* Flat rectangular CTA button */}
              <button
                onClick={() => onNavigate(`/farmer/matches?listingId=${listing.id}`)}
                className="w-full py-3.5 px-4 bg-[#C88A1B] hover:bg-[#A67114] text-white rounded-4xl border-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <span>Find Matching Buyers</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* SECTION C: Environmental Impact */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Environmental Impact
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                Zero Stubble Burn Verified
              </span>
            </div>

            {/* Left-aligned rows with thin horizontal dividers */}
            <div className="divide-y divide-white/10 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Avoided CO₂ Emission</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                    {listing.estimatedFireRiskAvoidedCo2Tons || Math.max(3, Math.round(listing.quantityTons * 1.5))} MT
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">Particulate matter averted</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Fire Risk Mitigation</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                    100%
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">Ex-situ industrial dispatch</p>
                </div>
              </div>

              <div className="pt-3 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Clean Air & Carbon Credit Eligible</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Residue is channeled to boilers & bio-refineries, eliminating hazardous stubble smoke across regional air basins.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION D: Pickup Location & Schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E5A812]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Pickup Location & Schedule
                </h2>
              </div>
              <span className="text-[11px] font-mono text-white/50">PIN: {listing.location.pincode}</span>
            </div>

            {/* Left-aligned rows with thin horizontal dividers */}
            <div className="divide-y divide-white/10 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Field Address / Village</p>
                  <p className="text-base font-bold text-white mt-0.5">{listing.location.villageOrField}</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">District & State</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    {listing.location.district}, {listing.location.state}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Available From</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                    {new Date(listing.availableDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Expires On</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                    {listing.expiryDate ? new Date(listing.expiryDate).toLocaleDateString() : '30/10/2026'}
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Transit & Storage</p>
                <p className="text-xs text-white/70 leading-relaxed mt-0.5">
                  Tractor trailer and heavy freight accessible via direct pucca road link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



