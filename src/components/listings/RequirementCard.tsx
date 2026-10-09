import React from 'react';
import { BuyerRequirement } from '../../types/listings';
import { Building2, MapPin, Calendar, Weight } from 'lucide-react';

interface RequirementCardProps {
  requirement: BuyerRequirement;
  onClick: () => void;
  onMatchClick?: () => void;
}

export const RequirementCard: React.FC<RequirementCardProps> = ({
  requirement,
  onClick,
  onMatchClick,
}) => {
  const percentFulfilled = Math.min(
    100,
    Math.round((requirement.fulfilledQuantityTons / requirement.requiredQuantityTons) * 100)
  );

  return (
    <div
      onClick={onClick}
      className="bg-[#FAF8F3] border border-[#E3DED2] rounded-xl p-5 hover:border-[#245E3F]/40 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="text-base font-bold text-[#19241B]">{requirement.cropType} Demand</h4>
            <div className="flex items-center gap-1.5 text-xs text-[#5E6D63] mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-[#8A795D]" />
              <span className="truncate">{requirement.buyerOrganization}</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded capitalize bg-[#EAF2ED] text-[#1E4530]">
            {requirement.status.replace('_', ' ')}
          </span>
        </div>

        {/* Quantity & Budget */}
        <div className="my-4 p-3 bg-[#F4F0E6] rounded-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#5E6D63]">Target Procurement</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#19241B] flex items-center gap-1">
              <Weight className="w-4 h-4 text-[#245E3F]" />
              {requirement.requiredQuantityTons} <span className="text-xs font-normal text-[#5E6D63]">Tons</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#5E6D63]">Ceiling Rate</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#1B382B]">
              ₹{requirement.maxPricePerTon.toLocaleString()}
              <span className="text-xs font-normal text-[#5E6D63]">/ton max</span>
            </p>
          </div>
        </div>

        {/* Fulfillment bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-[#5E6D63] mb-1">
            <span>Fulfillment Progress</span>
            <span className="font-mono tabular-nums font-semibold text-[#19241B]">
              {requirement.fulfilledQuantityTons} / {requirement.requiredQuantityTons}t ({percentFulfilled}%)
            </span>
          </div>
          <div className="w-full bg-[#E5DFD3] rounded-full h-1.5">
            <div
              className="bg-[#245E3F] h-1.5 rounded-full"
              style={{ width: `${percentFulfilled}%` }}
            />
          </div>
        </div>

        {/* Destination & Specs */}
        <div className="space-y-1.5 text-xs text-[#5E6D63]">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#8A795D] shrink-0" />
            <span className="truncate">
              {requirement.destinationLocation.facilityName}, {requirement.destinationLocation.district}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#8A795D] shrink-0" />
            <span>Target Deadline: {new Date(requirement.deliveryDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#E3DED2] flex items-center justify-between gap-2">
        <span className="text-xs text-[#5E6D63]">Max moisture: {requirement.acceptableMoistureMax}%</span>
        {onMatchClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMatchClick();
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-[#1B382B] text-white rounded-lg hover:bg-[#12261D] transition-colors whitespace-nowrap cursor-pointer"
          >
            Find Matches
          </button>
        ) : (
          <span className="text-xs font-semibold text-[#1B382B] hover:underline">
            Manage →
          </span>
        )}
      </div>
    </div>
  );
};
