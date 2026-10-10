import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { goBackendApi } from '../lib/api/goService';
import { javaRulesApi } from '../lib/api/javaService';
import { pythonAiMlApi } from '../lib/api/pythonService';
import { balerServiceApi } from '../lib/api/balerService';
import { StrawListing, BuyerRequirement, StrawMatch } from '../types/listings';
import { ContractRecord, PriceQuote } from '../types/contracts';
import { BalerJobOpportunity } from '../types/baler';
import { ListingCard } from '../components/listings/ListingCard';
import { CountUpNumber } from '../components/ui/CountUpNumber';
import { BlurRevealText } from '../components/ui/BlurRevealText';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { Plus, ArrowRight, Weight, FileText, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Truck } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [listings, setListings] = useState<StrawListing[]>([]);
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [matches, setMatches] = useState<StrawMatch[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [quotes, setQuotes] = useState<PriceQuote[]>([]);
  const [balerJobs, setBalerJobs] = useState<BalerJobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (role === 'farmer') {
          const [l, m, c, q] = await Promise.all([
            goBackendApi.getMyListings(user?.id || 'user_farmer_1'),
            goBackendApi.getFarmerMatches(user?.id || 'user_farmer_1'),
            javaRulesApi.getContracts(user?.id || 'user_farmer_1'),
            javaRulesApi.getQuotes(user?.id || 'user_farmer_1'),
          ]);
          setListings(l);
          setMatches(m);
          setContracts(c);
          setQuotes(q);
        } else if (role === 'buyer') {
          const [reqs, allListings, m, c, q] = await Promise.all([
            goBackendApi.getRequirements(user?.id || 'user_buyer_1'),
            goBackendApi.getListings(),
            goBackendApi.getMatchesForBuyer(user?.id || 'user_buyer_1'),
            javaRulesApi.getContracts(user?.id || 'user_buyer_1'),
            javaRulesApi.getQuotes(user?.id || 'user_buyer_1'),
          ]);
          setRequirements(reqs);
          setListings(allListings.slice(0, 4));
          setMatches(m);
          setContracts(c);
          setQuotes(q);
        } else {
          // Baler
          const [jobs, c] = await Promise.all([
            balerServiceApi.getBalerJobs(),
            javaRulesApi.getContracts(user?.id || 'user_baler_1'),
          ]);
          setBalerJobs(jobs);
          setContracts(c);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [role, user?.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-[#5E6D63]">
        <div className="inline-block w-6 h-6 border-2 border-[#1B382B] border-t-transparent rounded-full animate-spin mb-3" />
        <p>Loading {role} workspace telemetry from services...</p>
      </div>
    );
  }

  // FARMER VIEW
  if (role === 'farmer') {
    const totalTonsListed = listings.reduce((acc, l) => acc + l.quantityTons, 0);
    const pendingContracts = contracts.filter((c) => !c.signedByFarmer);
    const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'delivered');

    return (
      <div className="w-full">
        {/* Immersive Farmer Hero Section */}
        <PageHeroBanner
          badge="01 / Farmer Command Center"
          badgeIcon={<Sparkles className="w-3.5 h-3.5" />}
          title={`Farmer Workspace — ${user?.name || 'Gurpreet Singh'}`}
          subtitle={`${user?.location.villageOrCity || 'Bhawani Garh'}, ${user?.location.district || 'Sangrur'} (${user?.location.state || 'Punjab'}) · ${user?.farmSizeAcres || 42} Acres Managed`}
          bgImageUrl="https://framerusercontent.com/images/pcb5yTRmmPb3AD4e14mWz1oMukM.jpg?scale-down-to=2048&width=4096&height=2317"
          stats={[
            { label: 'Listed Biomass', value: totalTonsListed, suffix: ' t', highlight: true },
            { label: 'Potential Revenue', value: totalTonsListed * 2100, prefix: '₹' },
            { label: 'Buyer Matches', value: matches.length, highlight: true },
            { label: 'CO₂ Avoided', value: Math.round(totalTonsListed * 1.5), suffix: ' t' },
          ]}
          actions={
            <>
              <button
                onClick={() => onNavigate('/farmer/listings/new')}
                className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
              >
                <span>Create Straw Listing</span>
                <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                  →
                </span>
              </button>
              <button
                onClick={() => onNavigate('/farmer/residue-calculator')}
                className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Residue Calculator</span>
              </button>
            </>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8 text-white">
          {/* Action Callout if pending contracts */}
          {pendingContracts.length > 0 && (
            <div className="p-4 sm:p-5 bg-amber-950/70 backdrop-blur-md border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#E5A812] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-200">
                    {pendingContracts.length} Contract(s) Awaiting Your Digital Signature
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    Buyer has deposited funds into escrow. Sign to authorize baler collection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/contracts')}
                className="w-full sm:w-auto px-4 py-2 bg-[#E5A812] hover:bg-[#d69b0d] text-[#0D1810] text-xs font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer shadow-md text-center"
              >
                Review & Sign →
              </button>
            </div>
          )}

        {/* My Straw Listings section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">My Straw Listings</h2>
              <p className="text-xs text-white/60">Current batches available for industrial pickup</p>
            </div>
            <button
              onClick={() => onNavigate('/farmer/listings')}
              className="text-xs font-semibold text-[#E5A812] hover:underline cursor-pointer"
            >
              Manage All ({listings.length}) →
            </button>
          </div>

          {listings.length === 0 ? (
            <div className="p-8 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl text-center shadow-xl">
              <p className="text-xs text-white/60 mb-3">You haven't published any straw listings yet.</p>
              <button
                onClick={() => onNavigate('/farmer/listings/new')}
                className="px-5 py-2.5 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold shadow-md cursor-pointer"
              >
                Create First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate(`/farmer/listings/${item.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Matching Buyer Demand section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Instant Buyer Demand Matches</h2>
              <p className="text-xs text-white/60">Proximity-filtered purchase requirements for your crop types</p>
            </div>
            <button
              onClick={() => onNavigate('/farmer/matches')}
              className="text-xs font-semibold text-[#E5A812] hover:underline cursor-pointer"
            >
              See All Matches ({matches.length}) →
            </button>
          </div>

          <div className="bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/10">
              {matches.slice(0, 3).map((match) => (
                <div key={match.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">{match.requirement.buyerOrganization}</span>
                      <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        {match.compatibilityScore}% Match
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/65 mt-1.5">
                      <span>{match.requirement.cropType}</span>
                      <span aria-hidden="true">·</span>
                      <span>Target: <span className="font-mono tabular-nums text-white">{match.requirement.requiredQuantityTons}t</span></span>
                      <span aria-hidden="true">·</span>
                      <span>Distance: <span className="font-mono tabular-nums text-white">{match.distanceKm} km</span></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-white/50">Max Buyer Budget</p>
                      <p className="text-sm font-bold font-mono tabular-nums text-[#E5A812]">
                        ₹{match.requirement.maxPricePerTon.toLocaleString()}/ton
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('/farmer/matches')}
                      className="px-4 py-2 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md hover:scale-102 shrink-0"
                    >
                      Connect & Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  // BUYER VIEW
  if (role === 'buyer') {
    const totalProcured = requirements.reduce((acc, r) => acc + r.fulfilledQuantityTons, 0);
    const totalDemanded = requirements.reduce((acc, r) => acc + r.requiredQuantityTons, 0);

    return (
      <div className="w-full">
        {/* Immersive Industrial Buyer Hero Section */}
        <PageHeroBanner
          badge="02 / Industrial Procurement"
          badgeIcon={<TrendingUp className="w-3.5 h-3.5" />}
          title={`Procurement Desk — ${user?.organizationName || 'Punjab GreenPower'}`}
          subtitle={`Procuring for ${user?.location.villageOrCity || 'Industrial Focal Point'}, ${user?.location.district || 'Sangrur'} (${user?.location.state || 'Punjab'}) · ${user?.buyerType || 'Bio-Energy'} Sector`}
          bgImageUrl="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2600&auto=format&fit=crop"
          stats={[
            { label: 'Target Demand', value: totalDemanded, suffix: ' t', highlight: true },
            { label: 'Fulfilled to Date', value: totalProcured, suffix: ' t' },
            { label: 'Active Contracts', value: contracts.length, highlight: true },
            { label: 'Quotes Issued', value: quotes.length },
          ]}
          actions={
            <>
              <button
                onClick={() => onNavigate('/buyer/requirements/new')}
                className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
              >
                <span>Post New Requirement</span>
                <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                  →
                </span>
              </button>
              <button
                onClick={() => onNavigate('/buyer/marketplace')}
                className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
              >
                <span>Browse Straw Market</span>
              </button>
            </>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8 text-white">

        {/* Available Farm-Gate Listings Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Available Farm-Gate Residue Batches</h2>
              <p className="text-xs text-white/60">Verified straw listings ready for transport to your plant</p>
            </div>
            <button
              onClick={() => onNavigate('/buyer/marketplace')}
              className="text-xs font-semibold text-[#E5A812] hover:underline cursor-pointer"
            >
              Full Marketplace ({listings.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.slice(0, 3).map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onClick={() => onNavigate(`/buyer/marketplace/${l.id}`)}
                onRequestQuote={() => onNavigate(`/quotes?listingId=${l.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  // BALER VIEW
  return (
    <div className="w-full">
      {/* Immersive Baler Fleet Hero Section */}
      <PageHeroBanner
        badge="03 / Machinery Custom Hiring"
        badgeIcon={<Truck className="w-3.5 h-3.5" />}
        title={`Custom Hiring Fleet — ${user?.organizationName || 'Malwa Agro Balers'}`}
        subtitle={`Operating from ${user?.location.district || 'Sangrur'} (${user?.location.state || 'Punjab'}) · 55 km Active Custom Hiring Radius`}
        bgImageUrl="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Available Machinery', value: 3, suffix: ' Units', highlight: true },
          { label: 'Open Field Jobs', value: balerJobs.filter((j) => j.status === 'Open').length },
          {
            label: 'Potential Job Earnings',
            value: balerJobs.reduce((acc, j) => acc + j.totalJobEarningsEstInr, 0),
            prefix: '₹',
            highlight: true,
          },
          { label: 'Dispatched Baling', value: contracts.length },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/baler/matches')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>View Available Field Jobs</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/baler/profile')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>Manage Equipment Fleet</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8 text-white">

      {/* Available Baling Jobs list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Harvesting Field Baling Opportunities</h2>
            <p className="text-xs text-white/60">Farmers requiring immediate baling to avoid open burning</p>
          </div>
          <button
            onClick={() => onNavigate('/baler/matches')}
            className="text-xs font-semibold text-[#E5A812] hover:underline cursor-pointer"
          >
            All Opportunities →
          </button>
        </div>

        <div className="bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl divide-y divide-white/10 shadow-2xl overflow-hidden">
          {balerJobs.map((job) => (
            <div key={job.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-white">
                    {job.village}, {job.district} · {job.farmerName}
                  </h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {job.distanceFromBaseKm} km away
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/65 mt-1.5">
                  <span>{job.cropType}</span>
                  <span aria-hidden="true">·</span>
                  <span>Field Area: <span className="font-mono tabular-nums text-white">{job.fieldAreaAcres} Acres</span></span>
                  <span aria-hidden="true">·</span>
                  <span>Est. Residue: <span className="font-mono tabular-nums text-white">{job.estimatedTonnage} Tons</span></span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                <div className="text-left sm:text-right">
                  <p className="text-[11px] text-white/50">Total Baling Fee</p>
                  <p className="text-base font-bold font-mono tabular-nums text-[#E5A812]">
                    ₹{job.totalJobEarningsEstInr.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/baler/matches')}
                  className="px-4 py-2 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold transition-colors cursor-pointer shadow-md hover:scale-102 shrink-0"
                >
                  Accept Job
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};
