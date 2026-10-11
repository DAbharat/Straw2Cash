import React, { useState } from 'react';
import { pythonAiMlApi } from '../../lib/api/pythonService';
import { ResidueEstimateResponse } from '../../types/aiml';
import { ArrowRight, Weight, CheckCircle2, Calculator, Zap } from 'lucide-react';
import { CountUpNumber } from '../../components/ui/CountUpNumber';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';

interface ResidueCalculatorPageProps {
  onNavigate: (path: string) => void;
}

export const ResidueCalculatorPage: React.FC<ResidueCalculatorPageProps> = ({ onNavigate }) => {
  const [cropType, setCropType] = useState('Paddy (Basmati)');
  const [fieldAreaAcres, setFieldAreaAcres] = useState<number>(35);
  const [grainYieldQuintals, setGrainYieldQuintals] = useState<number>(35);
  const [harvestingMethod, setHarvestingMethod] = useState<'Combine Harvester with SMS' | 'Standard Combine' | 'Manual Sickle'>('Combine Harvester with SMS');
  const [cuttingHeightCm, setCuttingHeightCm] = useState<number>(12);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResidueEstimateResponse | null>(null);

  // Total Estimated Yield math
  const totalEstimatedYieldQuintals = fieldAreaAcres * grainYieldQuintals;
  const totalEstimatedYieldTons = (totalEstimatedYieldQuintals * 0.1).toFixed(1);

  // Live calculation preview approximations for immediate interactive feedback
  const grainTons = totalEstimatedYieldQuintals * 0.1;
  const strawRatio = cropType.includes('Basmati') ? 1.45 : cropType.includes('Wheat') ? 1.25 : cropType.includes('Mustard') ? 1.6 : 1.35;
  const cuttingLoss = Math.min(0.35, Math.max(0.08, cuttingHeightCm * 0.008));
  const harvestingEff = harvestingMethod.includes('SMS') ? 0.92 : harvestingMethod.includes('Manual') ? 0.96 : 0.85;
  const liveResidueTons = Math.round(grainTons * strawRatio * (1 - cuttingLoss) * harvestingEff * 10) / 10;
  const liveMinPrice = cropType.includes('Basmati') ? 2050 : cropType.includes('Wheat') ? 2200 : 1800;
  const liveMaxPrice = cropType.includes('Basmati') ? 2450 : cropType.includes('Wheat') ? 2650 : 2300;
  const liveMinVal = Math.round(liveResidueTons * liveMinPrice);
  const liveMaxVal = Math.round(liveResidueTons * liveMaxPrice);
  const liveCo2Tons = Math.round(liveResidueTons * 1.5 * 10) / 10;

  // Helper to format currency values cleanly without overflow
  const formatLakhOrRupee = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString()}`;
  };

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
          { label: 'Yield Rate Target', value: grainYieldQuintals, suffix: ' Q/Acre' },
          { label: 'Est. Straw Potential', value: liveResidueTons, suffix: ' Tons', highlight: true },
          { label: 'Gross Value Est.', value: liveMinVal, prefix: '₹' },
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Calculator Parameters Form Panel */}
          <div className="lg:col-span-5 bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 min-h-[46px]">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Field & Harvest Parameters</h2>
                  <p className="text-[11px] text-white/50">Configure acreage, yield & combine specs</p>
                </div>
                <span className="text-[11px] font-mono text-[#E5A812] bg-[#E5A812]/10 border border-[#E5A812]/20 px-2 py-0.5 rounded shrink-0">
                  Inputs
                </span>
              </div>

              <form onSubmit={handleCalculate} id="residue-calc-form" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Crop Variety
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-lg focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
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
                    className="thin-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-white/80 mb-1">
                    <span>Yield Rate per Acre</span>
                    <span className="font-mono tabular-nums text-[#E5A812]">{grainYieldQuintals} Q / Acre</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="40"
                    value={grainYieldQuintals}
                    onChange={(e) => setGrainYieldQuintals(Number(e.target.value))}
                    className="thin-slider"
                  />
                  <div className="flex items-center justify-between text-[11px] text-white/50 mt-1 px-0.5">
                    <span>Total Estimated Yield:</span>
                    <span className="font-mono tabular-nums text-white/90">
                      {fieldAreaAcres}A × {grainYieldQuintals}Q = <strong className="text-white font-semibold">{totalEstimatedYieldQuintals.toLocaleString()} Q</strong> <span className="text-white/40">({totalEstimatedYieldTons} t)</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Harvesting Equipment
                  </label>
                  <select
                    value={harvestingMethod}
                    onChange={(e) => setHarvestingMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/15 text-white rounded-lg focus:outline-none focus:border-[#E5A812] focus:ring-1 focus:ring-[#E5A812]/50"
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
                    className="thin-slider"
                  />
                  <p className="text-[11px] text-white/40 mt-1">
                    Lower cut height yields higher recoverable straw tonnage for balers.
                  </p>
                </div>
              </form>
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                form="residue-calc-form"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-101 disabled:opacity-50"
              >
                <span>{loading ? 'Executing Agronomic Model...' : 'Run Residue Estimation'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E5A812]" />
              </button>
            </div>
          </div>

          {/* Results / Live Preview Panel */}
          <div className="lg:col-span-7 bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
            {result ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 min-h-[46px]">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Estimation Summary</h3>
                      <p className="text-[11px] text-white/50">Computed via Straw2Cash Agronomic ML Engine</p>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      {result.fireRiskReductionIndexPercent}% Fire Mitigation
                    </span>
                  </div>

                  {/* 2 Primary Highlights - Perfectly Balanced & Aligned */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                    <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between min-h-[105px]">
                      <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                        <span>Recoverable Residue</span>
                        <Weight className="w-3.5 h-3.5 text-[#E5A812]" />
                      </div>
                      <div className="my-1 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#E5A812]">
                          <CountUpNumber value={result.recoverableResidueTons} duration={1200} decimals={1} />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white/60">Tons</span>
                      </div>
                      <p className="text-[11px] text-white/40">
                        From {fieldAreaAcres} acres · {result.strawToGrainRatio}:1 straw ratio
                      </p>
                    </div>

                    <div className="p-3.5 bg-white/5 rounded-xl border border-emerald-500/20 flex flex-col justify-between min-h-[105px]">
                      <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                        <span>Est. Market Value</span>
                        <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">Spot Mandi</span>
                      </div>
                      <div className="my-1 flex items-baseline justify-between gap-1">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 block font-medium">Min</span>
                          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-white">
                            {formatLakhOrRupee(result.estimatedMarketValueMinInr)}
                          </span>
                        </div>
                        <span className="text-white/30 text-xs font-mono self-end mb-0.5 px-0.5">—</span>
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block font-medium">Max</span>
                          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-400">
                            {formatLakhOrRupee(result.estimatedMarketValueMaxInr)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/40 truncate" title={`₹${result.estimatedMarketValueMinInr.toLocaleString()} – ₹${result.estimatedMarketValueMaxInr.toLocaleString()} spot mandi range`}>
                        ₹{result.estimatedMarketValueMinInr.toLocaleString()} – ₹{result.estimatedMarketValueMaxInr.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Breakdown Specs - Clean Utilitarian Grid */}
                  <div className="bg-black/30 border border-white/10 rounded-xl divide-y divide-white/10 text-xs mb-4">
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <span className="text-white/60 shrink-0">Total Biological Straw Generated</span>
                      <span className="font-mono tabular-nums font-semibold text-white text-right">
                        {result.totalStrawGeneratedTons} Tons
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <span className="text-white/60 shrink-0">Retained Root Stubble (In-Situ)</span>
                      <span className="font-mono tabular-nums font-semibold text-white/70 text-right">
                        {result.unrecoverableStubStubbleTons} Tons
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-3.5 py-2.5">
                      <span className="text-white/60 shrink-0">Baling Configuration</span>
                      <span className="font-medium text-white text-left sm:text-right truncate" title={result.recommendedBaleType}>
                        {result.recommendedBaleType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <span className="text-white/60 shrink-0">Avoided Atmospheric CO₂</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-400 text-right">
                        {result.estimatedCo2AvoidanceTons} Metric Tons
                      </span>
                    </div>
                  </div>

                  {/* Agronomic Soil Advice */}
                  <div className="p-3.5 bg-amber-950/40 border border-amber-500/25 rounded-xl text-xs text-amber-200">
                    <p className="font-bold flex items-center gap-1.5 mb-1 text-[#E5A812]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E5A812] shrink-0" />
                      <span>Soil Health & Nutrient Advice:</span>
                    </p>
                    <p className="leading-relaxed text-amber-100/80 text-[11px]">
                      {result.soilNutrientRetentionRecommendation}
                    </p>
                  </div>
                </div>

                {/* Convert to Listing Button - Aligned to bottom */}
                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => {
                      onNavigate(`/farmer/listings/new?crop=${encodeURIComponent(cropType)}&qty=${result.recoverableResidueTons}&acres=${fieldAreaAcres}`);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-101"
                  >
                    <span>Publish This {result.recoverableResidueTons} Ton Batch to Marketplace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E5A812]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 min-h-[46px]">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-[#E5A812]" />
                        <span>Live Estimation Preview</span>
                      </h3>
                      <p className="text-[11px] text-white/50">Dynamic calculations based on your field parameters</p>
                    </div>
                    <span className="text-[11px] font-mono text-[#E5A812] bg-[#E5A812]/10 border border-[#E5A812]/20 px-2 py-0.5 rounded shrink-0">
                      Live Preview
                    </span>
                  </div>

                  {/* 2 Live Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                    <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between min-h-[105px]">
                      <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                        <span>Est. Recoverable Residue</span>
                        <Weight className="w-3.5 h-3.5 text-[#E5A812]" />
                      </div>
                      <div className="my-1 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#E5A812]">
                          {liveResidueTons}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white/60">Tons</span>
                      </div>
                      <p className="text-[11px] text-white/40">
                        From {fieldAreaAcres} acres · ~{strawRatio}:1 straw ratio
                      </p>
                    </div>

                    <div className="p-3.5 bg-white/5 rounded-xl border border-emerald-500/20 flex flex-col justify-between min-h-[105px]">
                      <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                        <span>Est. Gross Revenue</span>
                        <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">Est. Spot</span>
                      </div>
                      <div className="my-1 flex items-baseline justify-between gap-1">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 block font-medium">Min</span>
                          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-white">
                            {formatLakhOrRupee(liveMinVal)}
                          </span>
                        </div>
                        <span className="text-white/30 text-xs font-mono self-end mb-0.5 px-0.5">—</span>
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block font-medium">Max</span>
                          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-400">
                            {formatLakhOrRupee(liveMaxVal)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/40 truncate">
                        ₹{liveMinVal.toLocaleString()} – ₹{liveMaxVal.toLocaleString()} spot range
                      </p>
                    </div>
                  </div>

                  {/* Quick Math Breakdown Specs */}
                  <div className="bg-black/30 border border-white/10 rounded-xl divide-y divide-white/10 text-xs mb-4">
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <span className="text-white/60 shrink-0">Total Estimated Grain Yield</span>
                      <span className="font-mono tabular-nums font-semibold text-white text-right">
                        {totalEstimatedYieldQuintals.toLocaleString()} Q ({totalEstimatedYieldTons} Tons)
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <span className="text-white/60 shrink-0">Biomass Multiplier (Crop Factor)</span>
                      <span className="font-mono tabular-nums text-white/70 text-right">
                        {strawRatio}:1 straw to grain
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <span className="text-white/60 shrink-0">Estimated Avoided Atmospheric CO₂</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-400 text-right">
                        ~{liveCo2Tons} Metric Tons
                      </span>
                    </div>
                  </div>

                  {/* Subtle Centered Callout */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/70 flex items-start gap-2.5">
                    <Calculator className="w-4 h-4 text-[#E5A812] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Run Agronomic ML Analysis</p>
                      <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                        Click <strong className="text-white font-medium">"Run Residue Estimation"</strong> on the left to factor in cutter bar loss, harvesting method efficiency, and calculate soil nutrient retention recommendations.
                      </p>
                    </div>
                  </div>
                </div>


                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => {
                      const fakeEvent = { preventDefault: () => {} } as any;
                      handleCalculate(fakeEvent);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-101"
                  >
                    <span>Run Agronomic ML Estimation</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E5A812]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


