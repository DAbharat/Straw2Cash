import React from 'react';
import { StrawListing } from '../../types/listings';
import { MapPin, Calendar, Weight, Leaf } from 'lucide-react';

interface ListingCardProps {
  listing: StrawListing;
  onClick: () => void;
  onRequestQuote?: () => void;
  showActions?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  onRequestQuote,
  showActions = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30';
      case 'reserved':
        return 'text-[#E5A812] bg-[#E5A812]/15 border border-[#E5A812]/30';
      case 'contracted':
        return 'text-amber-300 bg-amber-500/15 border border-amber-500/30';
      case 'fulfilled':
        return 'text-white/70 bg-white/10 border border-white/20';
      default:
        return 'text-stone-300 bg-white/10 border border-white/10';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-[#E5A812]/50 hover:bg-[#0D1810]/85 transition-all cursor-pointer shadow-xl hover:shadow-2xl flex flex-col justify-between group"
    >
      <div>
        {/* Top line: Crop type & status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h4 className="text-base font-bold text-white group-hover:text-[#E5A812] transition-colors">{listing.cropType}</h4>
            <div className="flex items-center gap-2 text-xs text-white/60 mt-0.5">
              <span>{listing.condition}</span>
              <span aria-hidden="true">·</span>
              <span>{listing.fieldAreaAcres} Acres</span>
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${getStatusColor(listing.status)}`}>
            {listing.status}
          </span>
        </div>

        {/* Price & Quantity highlight */}
        <div className="my-4 p-3.5 bg-white/5 backdrop-blur-xs rounded-xl border border-white/10 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-white/60">Available Residue</p>
            <p className="text-lg font-bold font-mono tabular-nums text-white flex items-center gap-1">
              <Weight className="w-4 h-4 text-[#E5A812]" />
              {listing.quantityTons} <span className="text-xs font-normal text-white/60">Tons</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/60">Expected Rate</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#E5A812]">
              ₹{listing.pricePerTonExpected.toLocaleString()}
              <span className="text-xs font-normal text-white/60">/ton</span>
            </p>
          </div>
        </div>

        {/* Location & Dates */}
        <div className="space-y-1.5 text-xs text-white/70">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#E5A812]/80 shrink-0" />
            <span className="truncate">{listing.location.villageOrField}, {listing.location.district} ({listing.location.state})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E5A812]/80 shrink-0" />
            <span>Available from: {new Date(listing.availableDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Moisture: <span className="font-mono tabular-nums font-medium text-white">{listing.moisturePercentage}%</span></span>
            {listing.estimatedFireRiskAvoidedCo2Tons && (
              <>
                <span aria-hidden="true">·</span>
                <span>Avoids <span className="font-mono tabular-nums text-emerald-400 font-semibold">{listing.estimatedFireRiskAvoidedCo2Tons}t</span> CO₂</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action footer */}
      {showActions && (
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-xs text-white/50 truncate">By {listing.farmerName}</span>
          {onRequestQuote ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestQuote();
              }}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full transition-all whitespace-nowrap cursor-pointer shadow-md hover:scale-102"
            >
              Request Quote
            </button>
          ) : (
            <span className="text-xs font-semibold text-[#E5A812] group-hover:underline inline-flex items-center gap-1">
              View Details →
            </span>
          )}
        </div>
      )}
    </div>
  );
};
