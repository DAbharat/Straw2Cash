import React, { useState, useEffect } from 'react';
import { pythonAiMlApi } from '../lib/api/pythonService';
import { RegionalDemandInsight, PriceTrendDataPoint } from '../types/aiml';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, BarChart3, Factory, Sparkles } from 'lucide-react';

interface InsightsPageProps {
  onNavigate: (path: string) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  const [demandList, setDemandList] = useState<RegionalDemandInsight[]>([]);
  const [priceTrends, setPriceTrends] = useState<PriceTrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [d, p] = await Promise.all([
          pythonAiMlApi.getRegionalDemand(),
          pythonAiMlApi.getPriceTrends(),
        ]);
        setDemandList(d);
        setPriceTrends(p);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#5E6D63]">Loading market insights from Python AI/ML service...</div>;
  }

  const totalDemand = demandList.reduce((acc, d) => acc + d.demandVolumeTons, 0);
  const totalSupply = demandList.reduce((acc, d) => acc + d.supplyVolumeTons, 0);

  return (
    <div className="w-full">
      {/* Immersive Market Insights Hero Section */}
      <PageHeroBanner
        badge="04 / Market Analytics & Pricing Engine"
        badgeIcon={<TrendingUp className="w-3.5 h-3.5 text-[#E5A812]" />}
        title="Regional Straw Demand & Indicative Price Index"
        subtitle="Real-time industrial biomass demand curves, supply-demand balances, and crop residue spot rates across North India's agro-industrial hubs."
        bgImageUrl="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop"
        stats={[
          { label: 'Regional Demand', value: totalDemand, suffix: ' T', highlight: true },
          { label: 'Available Feedstock', value: totalSupply, suffix: ' T' },
          { label: 'Average Spot Index', value: 2140, prefix: '₹', suffix: '/t', highlight: true },
          { label: 'Monitored Clusters', value: demandList.length },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/buyer/marketplace')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>Explore Active Marketplace</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/farmer/residue-calculator')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>Calculate Crop Valuation</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8 text-white">

      {/* Price Trends Section */}
      <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Residue Price Trajectory (₹/Ton Delivered)</h2>
            <p className="text-xs text-white/60">Historical 5-month spot rate movements across North Indian trading hubs</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-fit">
            Current: Oct 2026 Season
          </span>
        </div>

        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/60 font-semibold">
                <th className="py-3 px-3">Timeline Month</th>
                <th className="py-3 px-3 text-right">Paddy Basmati</th>
                <th className="py-3 px-3 text-right">Paddy Non-Basmati</th>
                <th className="py-3 px-3 text-right">Wheat Straw</th>
                <th className="py-3 px-3 text-right">Mustard Straw</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-mono tabular-nums text-white/85">
              {priceTrends.map((pt, idx) => (
                <tr
                  key={pt.month}
                  className={`transition-colors ${
                    idx === priceTrends.length - 1
                      ? 'bg-[#E5A812]/15 font-bold text-white border-l-2 border-[#E5A812]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-3 px-3 font-sans font-medium">{pt.month}</td>
                  <td className="py-3 px-3 text-right text-emerald-400">₹{pt.paddyBasmatiInr.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">₹{pt.paddyNonBasmatiInr.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-[#E5A812]">₹{pt.wheatStrawInr.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-white/60">₹{pt.mustardStrawInr.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Demand & Supply Balance */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white">District Demand & Deficit Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {demandList.map((d) => (
            <div
              key={d.district}
              className="bg-[#0D1810]/75 backdrop-blur-md border border-white/10 hover:border-[#E5A812]/40 rounded-2xl p-5 shadow-xl transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">{d.district} ({d.state})</h3>
                  <p className="text-[11px] text-white/60 mt-0.5">{d.primaryBuyerIndustry}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {d.trend === 'increasing' ? (
                    <span className="flex items-center text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3.5 h-3.5" /> High Demand
                    </span>
                  ) : d.trend === 'decreasing' ? (
                    <span className="flex items-center text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      <ArrowDownRight className="w-3.5 h-3.5" /> Surplus
                    </span>
                  ) : (
                    <span className="flex items-center text-[#E5A812] bg-[#E5A812]/15 border border-[#E5A812]/30 px-2 py-0.5 rounded-full">
                      <Minus className="w-3.5 h-3.5" /> Balanced
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-white/60">Industrial Demand:</span>
                  <span className="font-mono font-bold text-white">{d.demandVolumeTons.toLocaleString()} t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Harvest Supply:</span>
                  <span className="font-mono text-white/80">{d.supplyVolumeTons.toLocaleString()} t</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-white/60">Demand/Supply Ratio:</span>
                  <span className="font-mono font-bold text-[#E5A812]">{d.demandSupplyRatio}x</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-white/60">Avg Delivered Price:</span>
                <span className="font-mono font-bold text-[#E5A812]">₹{d.avgPriceInrPerTon}/ton</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};
