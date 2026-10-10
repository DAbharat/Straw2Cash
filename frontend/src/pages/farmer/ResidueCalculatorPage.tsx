import React, { useState } from 'react';
import { pythonAiMlApi } from '../../lib/api/pythonService';
import { ResidueEstimateResponse } from '../../types/aiml';
import { Sparkles, ArrowRight, Weight, DollarSign, ShieldAlert, CheckCircle2, Calculator } from 'lucide-react';
import { CountUpNumber } from '../../components/ui/CountUpNumber';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';

interface ResidueCalculatorPageProps {
  onNavigate: (path: string) => void;
}

export const ResidueCalculatorPage: React.FC<ResidueCalculatorPageProps> = ({ onNavigate }) => {
  const [cropType, setCropType] = useState('Paddy (Basmati)');
  const [fieldAreaAcres, setFieldAreaAcres] = useState<number>(35);
  const [grainYieldQuintals, setGrainYieldQuintals] = useState<number>(22);
  const [harvestingMethod, setHarvestingMethod] = useState<'Combine Harvester with SMS' | 'Standard Combine' | 'Manual Sickle'>('Combine Harvester with SMS');
  const [cuttingHeightCm, setCuttingHeightCm] = useState<number>(12);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResidueEstimateResponse | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await pythonAiMlApi.estimateResidue({
        cropType,
        fieldAreaAcres,
        expectedGrainYieldQuintalsPerAcre: grainYieldQuintals,
        harvestingMethod,
        cuttingHeightCm,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Immersive AI Residue Calculator Hero Section */}
      <PageHeroBanner
        badge="07 / Agronomic ML Model"
        badgeIcon={<Calculator className="w-3.5 h-3.5 text-[#E5A812]" />}
        title="AI Crop Residue & Valuation Calculator"
        subtitle="Predict recoverable crop residue tonnage, market valuation, and CO₂ mitigation based on grain yield and combine cutter bar height before harvest begins."
        bgImageUrl="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Selected Field Area', value: fieldAreaAcres, suffix: ' Acres', highlight: true },
          { label: 'Grain Yield Target', value: grainYieldQuintals, suffix: ' Q/Acre' },
          { label: 'Est. Straw Potential', value: Math.round(fieldAreaAcres * 2.2), suffix: ' Tons', highlight: true },
          { label: 'Gross Value Est.', value: Math.round(fieldAreaAcres * 2.2 * 2150), prefix: '₹' },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/farmer/listings/new')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>Publish Batch Listing</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/assistant')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>Consult AI Agronomist</span>
            </button>
          </>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8 text-white">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calculator Form */}
        <div className="lg:col-span-5 bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
          <h2 className="text-base font-bold text-white mb-4">Field & Harvest Parameters</h2>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Crop Variety
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              >
                <option value="Paddy (Basmati)" className="bg-[#0D1810] text-white">Paddy (Basmati - Pusa 1121/1509)</option>
                <option value="Paddy (Non-Basmati)" className="bg-[#0D1810] text-white">Paddy (Non-Basmati - PR 126/131)</option>
                <option value="Wheat" className="bg-[#0D1810] text-white">Wheat (HD 2967/3086)</option>
                <option value="Mustard Stalk" className="bg-[#0D1810] text-white">Mustard (Brassica)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-white/80 mb-1">
                <span>Field Area</span>
                <span className="font-mono tabular-nums text-[#E5A812]">{fieldAreaAcres} Acres</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={fieldAreaAcres}
                onChange={(e) => setFieldAreaAcres(Number(e.target.value))}
                className="w-full accent-[#E5A812] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-white/80 mb-1">
                <span>Expected Grain Yield</span>
                <span className="font-mono tabular-nums text-[#E5A812]">{grainYieldQuintals} Q / Acre</span>
              </div>
              <input
                type="range"
                min="8"
                max="40"
                value={grainYieldQuintals}
                onChange={(e) => setGrainYieldQuintals(Number(e.target.value))}
                className="w-full accent-[#E5A812] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Harvesting Equipment
              </label>
              <select
                value={harvestingMethod}
                onChange={(e) => setHarvestingMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-xl focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
              >
                <option value="Combine Harvester with SMS" className="bg-[#0D1810] text-white">Combine with Super SMS (Recommended)</option>
                <option value="Standard Combine" className="bg-[#0D1810] text-white">Standard Combine Harvester</option>
                <option value="Manual Sickle" className="bg-[#0D1810] text-white">Manual Harvesting</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-white/80 mb-1">
                <span>Stubble Cutting Height</span>
                <span className="font-mono tabular-nums text-[#E5A812]">{cuttingHeightCm} cm</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                value={cuttingHeightCm}
                onChange={(e) => setCuttingHeightCm(Number(e.target.value))}
                className="w-full accent-[#E5A812] cursor-pointer"
              />
              <p className="text-[11px] text-white/50 mt-1">
                Lower cut height yields higher recoverable straw tonnage for balers.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4 hover:scale-102"
            >
              <span>{loading ? 'Executing Agronomic Model...' : 'Run Residue Estimation'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E5A812]" />
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
          {result ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Estimation Summary</h3>
                  <p className="text-xs text-white/60">Computed via Straw2Cash Agronomic ML Engine</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {result.fireRiskReductionIndexPercent}% Fire Mitigation
                </span>
              </div>

              {/* 2 Primary Highlights */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
                  <p className="text-xs text-white/60">Recoverable Residue</p>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#E5A812] mt-1">
                    <CountUpNumber value={result.recoverableResidueTons} duration={1400} decimals={1} suffix=" Tons" />
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">
                    from {fieldAreaAcres} acres (ratio {result.strawToGrainRatio}:1)
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-emerald-500/20 shadow-lg">
                  <p className="text-xs text-emerald-400">Est. Market Value</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    <CountUpNumber value={result.estimatedMarketValueMinInr} duration={1500} prefix="₹" /> – <CountUpNumber value={result.estimatedMarketValueMaxInr} duration={1500} prefix="₹" />
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">
                    Current spot mandi & plant rates
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown Specs */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Total Biological Straw Generated</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {result.totalStrawGeneratedTons} Tons
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Retained Root Stub (In-Situ Incorporation)</span>
                  <span className="font-mono tabular-nums text-white/50">
                    {result.unrecoverableStubStubbleTons} Tons
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Recommended Baling Configuration</span>
                  <span className="font-medium text-white">{result.recommendedBaleType}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Avoided Atmospheric CO₂</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-400">
                    {result.estimatedCo2AvoidanceTons} Metric Tons
                  </span>
                </div>
              </div>

              {/* Agronomic Soil Advice */}
              <div className="p-4 bg-amber-950/60 border border-amber-500/30 rounded-2xl text-xs text-amber-200">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-[#E5A812]">
                  <CheckCircle2 className="w-4 h-4 text-[#E5A812]" />
                  Soil Health & Nutrient Advice:
                </p>
                <p className="leading-relaxed text-amber-100/80">
                  {result.soilNutrientRetentionRecommendation}
                </p>
              </div>

              {/* 1-Click Convert to Listing */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    onNavigate(`/farmer/listings/new?crop=${encodeURIComponent(cropType)}&qty=${result.recoverableResidueTons}&acres=${fieldAreaAcres}`);
                  }}
                  className="w-full py-3.5 px-4 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-102"
                >
                  <span>Publish This {result.recoverableResidueTons} Ton Batch to Marketplace</span>
                  <ArrowRight className="w-4 h-4 text-[#E5A812]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-white/50">
              <Weight className="w-10 h-10 mx-auto text-[#E5A812]/50 mb-3" />
              <p className="font-bold text-sm text-white">No Estimation Generated Yet</p>
              <p className="mt-1 max-w-sm mx-auto text-white/60">
                Select your field area, crop variety, and expected harvest yield on the left and click 'Run Residue Estimation'.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
