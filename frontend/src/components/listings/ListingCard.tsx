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
      className="bg-transparent backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-7 hover:border-[#E5A812]/50 hover:bg-[#0D1810]/90 transition-all cursor-pointer shadow-xl hover:shadow-2xl flex flex-col justify-between group"
    >
      <div>
        {/* Header: Title with Available badge right next to it, secondary text smaller & gray */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight group-hover:text-[#E5A812] transition-colors">
              {listing.cropType}
            </h4>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${getStatusColor(listing.status)}`}>
              {listing.status}
            </span>
          </div>
          <p className="text-xs text-white/50 font-medium mt-1">
            {listing.condition} <span className="text-white/30" aria-hidden="true">·</span> {listing.fieldAreaAcres} Acres
          </p>
        </div>

        {/* Data sitting directly on card background: Residue on left, Rate on right, top-aligned */}
        <div className="my-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/50 font-medium">Available Residue</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-white mt-1 flex items-baseline gap-1.5">
              <Weight className="w-4 h-4 text-[#E5A812] shrink-0 self-center" />
              <span>{listing.quantityTons}</span>
              <span className="text-xs font-normal text-white/50">Tons</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-white/50 font-medium">Expected Rate</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-[#E5A812] mt-1">
              ₹{listing.pricePerTonExpected.toLocaleString()}
              <span className="text-xs font-normal text-white/50">/ton</span>
            </p>
          </div>
        </div>

        {/* Middle section: Location + Date on line 1, Moisture + CO2 on line 2, icons top-aligned */}
        <div className="space-y-2 text-xs text-white/70">
          {/* Line 1: Location & Date */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-x-4 gap-y-1">
            <div className="flex items-start gap-1.5 min-w-0 flex-1">
              <MapPin className="w-3.5 h-3.5 text-[#E5A812] shrink-0 mt-0.5" />
              <span className="truncate" title={`${listing.location.villageOrField}, ${listing.location.district} (${listing.location.state})`}>
                {listing.location.villageOrField}, {listing.location.district} ({listing.location.state})
              </span>
            </div>
            <div className="flex items-start gap-1.5 shrink-0 text-white/60">
              <Calendar className="w-3.5 h-3.5 text-[#E5A812] shrink-0 mt-0.5" />
              <span>
                Available from: {new Date(listing.availableDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Line 2: Moisture & CO2 */}
          <div className="flex items-start gap-2.5 flex-wrap">
            <div className="flex items-start gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Moisture: <span className="font-mono tabular-nums font-semibold text-white">{listing.moisturePercentage}%</span>
              </span>
            </div>
            {listing.estimatedFireRiskAvoidedCo2Tons && (
              <div className="flex items-start gap-1.5">
                <span className="text-white/30" aria-hidden="true">·</span>
                <span>
                  Avoids <span className="font-mono tabular-nums text-emerald-400 font-bold">{listing.estimatedFireRiskAvoidedCo2Tons}t</span> CO₂
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer: 'By Gurpreet Singh' and 'View Details' placed right next to each other */}
      {showActions && (
        <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/50">By {listing.farmerName}</span>
            <span className="text-white/30" aria-hidden="true">·</span>
            <span className="font-semibold text-[#E5A812] group-hover:underline inline-flex items-center gap-1 cursor-pointer">
              View Details →
            </span>
          </div>

          {onRequestQuote && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestQuote();
              }}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full transition-all whitespace-nowrap cursor-pointer shadow-md hover:scale-102"
            >
              Request Quote
            </button>
          )}
        </div>
      )}
    </div>
  );
};
