import React, { useState, useEffect } from 'react';
import { goBackendApi } from '../../lib/api/goService';
import { StrawListing, ListingStatus } from '../../types/listings';
import { useToast } from '../../lib/context/ToastContext';
import { BlurRevealText } from '../../components/ui/BlurRevealText';
import { ArrowLeft, MapPin, Calendar, Weight, ShieldCheck, Flame } from 'lucide-react';

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
    return <div className="py-20 text-center text-xs text-[#5E6D63]">Loading listing details...</div>;
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-bold text-[#19241B]">Listing Not Found</p>
        <button
          onClick={() => onNavigate('/farmer/listings')}
          className="mt-4 px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/farmer/listings')}
          className="p-1.5 text-[#5E6D63] hover:text-[#19241B] rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <BlurRevealText
              text={listing.cropType}
              as="h1"
              className="text-2xl sm:text-3xl font-extrabold text-[#19241B] tracking-tight"
            />
            <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize bg-[#EAF2ED] text-[#1E4530]">
              {listing.status}
            </span>
          </div>
          <p className="text-xs text-[#5E6D63] mt-0.5">
            Listing ID: <span className="font-mono">{listing.id}</span> · By {listing.farmerName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Main specs */}
          <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
            <h2 className="text-sm font-bold text-[#19241B] pb-2 border-b border-[#E3DED2]">
              Residue Specifications
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[#5E6D63]">Residue Quantity</p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#19241B]">
                  {listing.quantityTons} Tons
                </p>
              </div>

              <div>
                <p className="text-[#5E6D63]">Residue Form</p>
                <p className="text-sm font-semibold text-[#19241B]">{listing.condition}</p>
              </div>

              <div>
                <p className="text-[#5E6D63]">Moisture Tested</p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#19241B]">
                  {listing.moisturePercentage}%
                </p>
              </div>

              <div>
                <p className="text-[#5E6D63]">Area Harvested</p>
                <p className="text-sm font-semibold font-mono tabular-nums text-[#19241B]">
                  {listing.fieldAreaAcres} Acres
                </p>
              </div>

              <div>
                <p className="text-[#5E6D63]">Expected Rate</p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#1B382B]">
                  ₹{listing.pricePerTonExpected.toLocaleString()}/ton
                </p>
              </div>

              <div>
                <p className="text-[#5E6D63]">Est. Batch Value</p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#1B382B]">
                  ₹{(listing.quantityTons * listing.pricePerTonExpected).toLocaleString()}
                </p>
              </div>
            </div>

            {listing.notes && (
              <div className="pt-2 text-xs text-[#5E6D63] border-t border-[#F0ECE1]">
                <p className="font-semibold text-[#19241B] mb-0.5">Field Access & Notes:</p>
                <p>{listing.notes}</p>
              </div>
            )}
          </div>

          {/* Environmental mitigation banner */}
          <div className="p-4 bg-[#EAF2ED] border border-[#BFD5C6] rounded-xl flex items-center justify-between text-xs text-[#1E4530]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#245E3F]" />
              <span>
                Avoids <strong>{listing.estimatedFireRiskAvoidedCo2Tons || 150} Metric Tons</strong> of CO₂ and particulate emission
              </span>
            </div>
            <span className="font-semibold text-[#245E3F]">Zero Stubble Burn Verified</span>
          </div>
        </div>

        {/* Status management & Location Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#19241B]">
              Listing Controls
            </h3>

            <div className="space-y-2 text-xs">
              <p className="text-[#5E6D63]">Update Operational Status:</p>
              {(['available', 'reserved', 'fulfilled', 'cancelled'] as ListingStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`w-full py-2 px-3 text-left rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                    listing.status === st
                      ? 'bg-[#1B382B] text-white'
                      : 'bg-[#F2EDE2] text-[#2D3A30] hover:bg-[#E5DFD3]'
                  }`}
                >
                  Mark as {st}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E3DED2]">
              <button
                onClick={() => onNavigate(`/farmer/matches?listingId=${listing.id}`)}
                className="w-full py-2.5 px-3 bg-[#C88A1B] text-white rounded-lg text-xs font-semibold hover:bg-[#A67114] transition-colors cursor-pointer text-center"
              >
                Find Matching Buyers →
              </button>
            </div>
          </div>

          <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-5 shadow-sm text-xs space-y-2 text-[#5E6D63]">
            <h3 className="font-bold text-[#19241B] mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#8A795D]" />
              Pickup Location
            </h3>
            <p>{listing.location.villageOrField}</p>
            <p>{listing.location.district}, {listing.location.state} - {listing.location.pincode}</p>
            <div className="pt-2 text-[11px] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#8A795D]" />
              <span>Available: {new Date(listing.availableDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
