import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { goBackendApi } from '../../lib/api/goService';
import { StrawListing, ListingStatus } from '../../types/listings';
import { ListingCard } from '../../components/listings/ListingCard';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { Plus, Sparkles } from 'lucide-react';

interface MyListingsPageProps {
  onNavigate: (path: string) => void;
}

export const MyListingsPage: React.FC<MyListingsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState<StrawListing[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await goBackendApi.getMyListings(user?.id || 'user_farmer_1');
        setListings(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const filtered = statusFilter === 'all'
    ? listings
    : listings.filter((l) => l.status === statusFilter);

  const totalTons = listings.reduce((acc, l) => acc + l.quantityTons, 0);

  return (
    <div className="w-full">
      {/* Immersive Farmer My Listings Hero Section */}
      <PageHeroBanner
        badge="01 / Farmer Inventory Desk"
        badgeIcon={<Sparkles className="w-3.5 h-3.5 text-[#E5A812]" />}
        title="My Straw Listings & Inventory"
        subtitle="Manage your harvest residue lots, expected rates, and verified industrial buyer procurement requests with direct escrow settlements."
        bgImageUrl="https://framerusercontent.com/images/pcb5yTRmmPb3AD4e14mWz1oMukM.jpg?scale-down-to=2048&width=4096&height=2317"
        stats={[
          { label: 'Total Tonnage', value: totalTons, suffix: ' t', highlight: true },
          { label: 'Available for Pickup', value: listings.filter((l) => l.status === 'available').length },
          { label: 'Active Farm Lots', value: listings.length, highlight: true },
          { label: 'Potential Revenue', value: totalTons * 2100, prefix: '₹' },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/farmer/listings/new')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>Publish New Straw Listing</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/farmer/residue-calculator')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>Residue Yield Calculator</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-black/60 border border-white/10 rounded-xl overflow-x-auto max-w-full">
        {['all', 'available', 'reserved', 'contracted', 'fulfilled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all capitalize cursor-pointer whitespace-nowrap shrink-0 ${
              statusFilter === status
                ? 'bg-[#E5A812] text-[#0D1810] shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-white/60">Loading listings...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl text-center shadow-xl text-white">
          <p className="text-base font-bold text-white">No listings found</p>
          <p className="text-xs text-white/60 mt-1 mb-4">
            {statusFilter === 'all'
              ? 'You have not created any straw listings yet.'
              : `No listings match the status '${statusFilter}'.`}
          </p>
          <button
            onClick={() => onNavigate('/farmer/listings/new')}
            className="px-5 py-2.5 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Publish New Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onClick={() => onNavigate(`/farmer/listings/${item.id}`)}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
