import React, { useState, useEffect } from 'react';
import { javaRulesApi } from '../../lib/api/javaService';
import { EcologicalImpactSummary } from '../../types/contracts';
import { EcoIllustration } from '../../components/ui/EcoIllustration';
import { CountUpNumber } from '../../components/ui/CountUpNumber';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { Flame, ShieldCheck, TrendingUp, Zap, Wind } from 'lucide-react';

interface ImpactDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const ImpactDashboardPage: React.FC<ImpactDashboardPageProps> = ({ onNavigate }) => {
  const [impact, setImpact] = useState<EcologicalImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await javaRulesApi.getImpactSummary();
        setImpact(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !impact) {
    return <div className="py-20 text-center text-xs text-[#5E6D63]">Loading impact telemetry...</div>;
  }

  return (
    <div className="w-full">
      {/* Immersive Ecological Impact Hero Section */}
      <PageHeroBanner
        badge="06 / Ecological Accounting & Air Quality"
        badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-[#68BA75]" />}
        title="Ecological & Air Quality Impact Ledger"
        subtitle="Quantitative measurement of stubble diverted from open incineration, emissions mitigated, and renewable bio-power generated across North India."
        bgImageUrl="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Residue Diverted', value: impact.stubbleDivertedTons, suffix: ' t', highlight: true },
          { label: 'CO₂ Mitigated', value: impact.co2EmissionsAvoidedTons, suffix: ' t', highlight: true },
          { label: 'PM2.5 Prevented', value: impact.pm25AvoidedKg, suffix: ' kg' },
          {
            label: 'Farmer Earnings',
            value: impact.farmerIncomeGeneratedInr / 10000000,
            prefix: '₹',
            suffix: ' Cr',
            decimals: 2,
            highlight: true,
          },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/fire-risks')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>View Thermal Hotspots Map</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/contracts')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>Audit Escrow Ledger</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8 text-white">

      {/* Authority Methodology & Simulation Banner */}
      <div className="p-4 bg-emerald-950/70 backdrop-blur-md border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl">
        <div>
          <p className="font-bold text-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authority Environmental Ledger (Java Rules Service · GET /api/v1/impact/summary)</span>
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">
            Methodology Note: CO₂ avoided calculated using 1.5 t CO₂e per tonne of crop residue diverted from in-field open incineration.
          </p>
        </div>
        <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
          SIMULATED FOR HACKATHON
        </span>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl hover:border-[#E5A812]/50 hover:bg-[#0D1810]/90 transition-all">
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Residue Diverted</p>
          <p className="text-2xl font-extrabold text-[#E5A812] mt-1">
            <CountUpNumber value={impact.stubbleDivertedTons} suffix=" t" duration={1800} />
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">100% Recycled Biomass</p>
        </div>

        <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl hover:border-emerald-500/50 hover:bg-[#0D1810]/90 transition-all">
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">CO₂ Avoided</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            <CountUpNumber value={impact.co2EmissionsAvoidedTons} suffix=" t" duration={1900} />
          </p>
          <p className="text-[10px] text-white/50 mt-1">Equivalent to 46k cars</p>
        </div>

        <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl hover:border-[#E5A812]/50 hover:bg-[#0D1810]/90 transition-all">
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">PM2.5 Saved</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            <CountUpNumber value={impact.pm25AvoidedKg} suffix=" kg" duration={2000} />
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">Cleaner Delhi-NCR Air</p>
        </div>

        <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl hover:border-[#E5A812]/50 hover:bg-[#0D1810]/90 transition-all">
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Fires Prevented</p>
          <p className="text-2xl font-extrabold text-[#E5A812] mt-1">
            <CountUpNumber value={impact.firesPreventedCount} duration={2100} />
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">Zero fire penalties</p>
        </div>

        <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl hover:border-[#E5A812]/50 hover:bg-[#0D1810]/90 transition-all">
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Farmer Income</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            <CountUpNumber
              value={impact.farmerIncomeGeneratedInr / 10000000}
              decimals={2}
              prefix="₹"
              suffix=" Cr"
              duration={1800}
            />
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">Direct Escrow Transfers</p>
        </div>

        <div className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl hover:border-[#E5A812]/50 hover:bg-[#0D1810]/90 transition-all">
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Coal Replaced</p>
          <p className="text-2xl font-extrabold text-[#E5A812] mt-1">
            <CountUpNumber value={impact.coalEquivalentReplacedMWh} suffix=" MWh" duration={2200} />
          </p>
          <p className="text-[10px] text-white/50 mt-1">Thermal power co-firing</p>
        </div>
      </div>

      {/* Visual Infographic & Mechanism */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4">
        <div className="bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl flex items-center justify-center">
          <EcoIllustration type="bioenergy" className="w-full h-64" />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            From Stubble Smoke to Sustainable Bio-Energy Grid
          </h2>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
            Every ton of paddy residue processed through Straw2Cash avoids approximately 1.5 metric tons of carbon emissions and eliminates dangerous particulate matter (PM2.5) that otherwise severely impacts northern India's air quality every winter.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-4 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg hover:border-[#E5A812]/40 transition-all">
              <p className="font-bold text-white mb-1 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E5A812]" />
                Bio-Pelletizing
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed">Straw compressed into high-caloric fuel pellets replacing imported coal in thermal boilers.</p>
            </div>
            <div className="p-4 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg hover:border-emerald-500/40 transition-all">
              <p className="font-bold text-white mb-1 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                2G Bio-Ethanol
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed">Enzymatic breakdown of cellulose into clean biofuel blended into national transport fuels.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
