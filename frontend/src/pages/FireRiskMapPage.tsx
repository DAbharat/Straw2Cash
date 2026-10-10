import React, { useState, useEffect } from 'react';
import { pythonAiMlApi } from '../lib/api/pythonService';
import { FireHotspotZone } from '../types/aiml';
import { FireRiskMap } from '../components/maps/FireRiskMap';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { useToast } from '../lib/context/ToastContext';
import { Flame, ShieldCheck, Wind, AlertTriangle } from 'lucide-react';

interface FireRiskMapPageProps {
  onNavigate: (path: string) => void;
}

export const FireRiskMapPage: React.FC<FireRiskMapPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [zones, setZones] = useState<FireHotspotZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<FireHotspotZone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await pythonAiMlApi.getFireRiskZones();
        setZones(data);
        if (data.length > 0) setSelectedZone(data[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDispatchTeam = (zoneId: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, targetedInterventionTeamAssigned: true } : z))
    );
    if (selectedZone?.id === zoneId) {
      setSelectedZone((prev) => (prev ? { ...prev, targetedInterventionTeamAssigned: true } : null));
    }
    showToast('Baler Fleet Dispatched', `Emergency baling team deployed to mitigate stubble fires`);
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#5E6D63]">Loading satellite thermal telemetry...</div>;
  }

  const totalFires = zones.reduce((acc, z) => acc + z.activeThermalAnomaliesCount, 0);
  const totalVolumeAtRisk = zones.reduce((acc, z) => acc + z.strawVolumeAtRiskTons, 0);

  return (
    <div className="w-full">
      {/* Immersive Fire Radar Hero Section */}
      <PageHeroBanner
        badge="03 / Active Environmental Monitoring"
        badgeIcon={<Flame className="w-3.5 h-3.5 text-[#E5A812]" />}
        title="Fire-Risk Hotspots & Smoke Dispersion Radar"
        subtitle="Active MODIS/VIIRS thermal anomalies, projected downwind AQI trajectories, and rapid baling intervention deployment across Punjab & Haryana."
        bgImageUrl="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Active Thermal Hotspots', value: totalFires, highlight: true },
          { label: 'Residue at Risk', value: totalVolumeAtRisk, suffix: ' t' },
          { label: 'Monitored Districts', value: zones.length },
          { label: 'Air Shed Trajectory', value: 'NCR Downwind' },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/insights')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>View Market Price Impacts</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/contracts')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>Mitigation Contracts</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">

      {/* The Fire Risk Map Component */}
      <FireRiskMap
        zones={zones}
        selectedZone={selectedZone}
        onSelectZone={(z) => setSelectedZone(z)}
        onDispatchTeam={handleDispatchTeam}
      />

      {/* Guidelines & Stubble Burning Policy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="p-5 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl text-xs space-y-2 shadow-xl hover:border-emerald-500/40 transition-all text-white">
          <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            CAQM Air Quality Mandates
          </h3>
          <p className="text-white/70 leading-relaxed">
            Commission for Air Quality Management enforces strict zero-burning zones across Punjab, Haryana, and NCR periphery. Violators face environmental fines and landholding red entries.
          </p>
        </div>

        <div className="p-5 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl text-xs space-y-2 shadow-xl hover:border-emerald-500/40 transition-all text-white">
          <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
            <Wind className="w-4 h-4 text-emerald-400" />
            Downwind Smoke Trajectory
          </h3>
          <p className="text-white/70 leading-relaxed">
            North-westerly autumn breezes carry particulate matter into the Indo-Gangetic basin. Straw2Cash prioritizes baler dispatch in upwind corridors before smoke drifts towards urban centers.
          </p>
        </div>

        <div className="p-5 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl text-xs space-y-2 shadow-xl hover:border-[#E5A812]/40 transition-all text-white">
          <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-[#E5A812]" />
            Rapid Baler Fleet Interventions
          </h3>
          <p className="text-white/70 leading-relaxed">
            Custom Hiring Balers deployed to high-risk plots receive accelerated payment subsidies from industrial buyer advance escrow, turning potential fire emergencies into cash revenue.
          </p>
        </div>
      </div>
    </div>
  </div>
);
};
