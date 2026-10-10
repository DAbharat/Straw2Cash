import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { goBackendApi } from '../../lib/api/goService';
import { BuyerRequirement } from '../../types/listings';
import { RequirementCard } from '../../components/listings/RequirementCard';
import { Plus } from 'lucide-react';

interface BuyerRequirementsPageProps {
  onNavigate: (path: string) => void;
}

export const BuyerRequirementsPage: React.FC<BuyerRequirementsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await goBackendApi.getRequirements(user?.id || 'user_buyer_1');
        setRequirements(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DED2]">
        <div>
          <h1 className="text-2xl font-bold text-[#19241B] tracking-tight">
            Feedstock Procurement Requirements
          </h1>
          <p className="text-xs text-[#5E6D63] mt-1">
            Manage your plant's straw purchase orders, tonnage quotas, and delivery schedules
          </p>
        </div>

        <button
          onClick={() => onNavigate('/buyer/requirements/new')}
          className="px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Requirement</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#5E6D63]">Loading requirements...</div>
      ) : requirements.length === 0 ? (
        <div className="p-16 bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl text-center">
          <p className="text-sm font-bold text-[#19241B]">No active purchase requirements</p>
          <p className="text-xs text-[#5E6D63] mt-1 mb-4">
            Post your target biomass volume and let nearby farmers supply your facility.
          </p>
          <button
            onClick={() => onNavigate('/buyer/requirements/new')}
            className="px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs font-semibold hover:bg-[#12261D]"
          >
            Post First Requirement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {requirements.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              onClick={() => onNavigate(`/buyer/matches?requirementId=${req.id}`)}
              onMatchClick={() => onNavigate(`/buyer/matches?requirementId=${req.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
