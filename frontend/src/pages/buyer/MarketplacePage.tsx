import React, { useState, useEffect } from 'react';
import { goBackendApi } from '../../lib/api/goService';
import { StrawListing } from '../../types/listings';
import { ListingCard } from '../../components/listings/ListingCard';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { Search, SlidersHorizontal, Sparkles, TrendingUp, Plus } from 'lucide-react';

interface MarketplacePageProps {
  onNavigate: (path: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
  const [listings, setListings] = useState<StrawListing[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await goBackendApi.getListings();
        setListings(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = listings.filter((l) => {
    if (selectedCrop !== 'all' && l.cropType !== selectedCrop) return false;
    if (selectedCondition !== 'all' && l.condition !== selectedCondition) return false;
    if (l.pricePerTonExpected > maxPrice) return false;
    if (searchDistrict && !l.location.district.toLowerCase().includes(searchDistrict.toLowerCase())) return false;
    return true;
  });

  const totalTons = listings.reduce((acc, l) => acc + l.quantityTons, 0);

  return (
    <div className="w-full">
      {/* Immersive Cinematic Hero Section */}
      <PageHeroBanner
        badge="02 / Biomass Marketplace"
        badgeIcon={<TrendingUp className="w-3.5 h-3.5" />}
        title="Agricultural Biomass Marketplace"
        subtitle="Direct farm-gate and pre-baled residue feedstock across Punjab, Haryana, and Western UP with transparent escrow pricing."
        bgImageUrl="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Available Straw', value: totalTons, suffix: ' t', highlight: true },
          { label: 'Active Farm Lots', value: listings.length },
          { label: 'Filtered Matches', value: filtered.length, highlight: true },
          { label: 'Index Rate', value: 2100, prefix: '₹', suffix: '/t' },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/buyer/requirements/new')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>Post Procurement Requirement</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/insights')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>View Mandi Price Index</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">

      {/* Filter and Search Bar */}
      <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Crop Variety
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-lg focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
            >
              <option value="all" className="bg-[#0D1810] text-white">All Crops</option>
              <option value="Paddy (Basmati)" className="bg-[#0D1810] text-white">Paddy (Basmati)</option>
              <option value="Paddy (Non-Basmati)" className="bg-[#0D1810] text-white">Paddy (Non-Basmati)</option>
              <option value="Wheat" className="bg-[#0D1810] text-white">Wheat Straw</option>
              <option value="Mustard Stalk" className="bg-[#0D1810] text-white">Mustard Stalk</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Bale / Condition
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-lg focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
            >
              <option value="all" className="bg-[#0D1810] text-white">All Conditions</option>
              <option value="Square Bales" className="bg-[#0D1810] text-white">Square Bales</option>
              <option value="Round Bales" className="bg-[#0D1810] text-white">Round Bales</option>
              <option value="Loose Straw" className="bg-[#0D1810] text-white">Loose Straw</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Filter District
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Sangrur, Patiala..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-full px-3 py-2 pl-8 text-xs bg-black/50 border border-white/15 text-white placeholder:text-white/40 rounded-lg focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              />
              <Search className="w-3.5 h-3.5 text-[#E5A812]/80 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-white/80 mb-1">
              <span>Max Price</span>
              <span className="font-mono tabular-nums text-[#E5A812]">₹{maxPrice}/ton</span>
            </div>
            <input
              type="range"
              min="1500"
              max="3000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#E5A812] mt-1.5 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
          <span>Showing <strong className="text-white font-mono">{filtered.length}</strong> available straw batches</span>
          {(selectedCrop !== 'all' || selectedCondition !== 'all' || searchDistrict || maxPrice < 3000) && (
            <button
              onClick={() => {
                setSelectedCrop('all');
                setSelectedCondition('all');
                setSearchDistrict('');
                setMaxPrice(3000);
              }}
              className="text-[#E5A812] font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="py-20 text-center text-xs text-white/60">Loading marketplace listings...</div>
      ) : filtered.length === 0 ? (
        <div className="p-16 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl text-center shadow-xl">
          <p className="text-base font-bold text-white">No listings match your criteria</p>
          <p className="text-xs text-white/60 mt-1">
            Try adjusting your price ceiling or selecting all crops.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onClick={() => onNavigate(`/buyer/marketplace/${item.id}`)}
              onRequestQuote={() => onNavigate(`/quotes?listingId=${item.id}&price=${item.pricePerTonExpected}&qty=${item.quantityTons}`)}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
