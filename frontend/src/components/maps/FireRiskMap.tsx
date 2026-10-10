import React, { useState } from 'react';
import { FireHotspotZone } from '../../types/aiml';
import { ShieldCheck, Wind, Flame, AlertTriangle } from 'lucide-react';

interface FireRiskMapProps {
  zones: FireHotspotZone[];
  selectedZone: FireHotspotZone | null;
  onSelectZone: (zone: FireHotspotZone) => void;
  onDispatchTeam?: (zoneId: string) => void;
}

export const FireRiskMap: React.FC<FireRiskMapProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onDispatchTeam,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const filteredZones = filterLevel === 'all'
    ? zones
    : zones.filter((z) => z.riskLevel.toLowerCase() === filterLevel.toLowerCase());

  // Geographic bounds representation for Punjab & Haryana:
  // Lat: ~29.4 to ~31.8 (N), Lng: ~74.2 to ~77.4 (E)
  const mapWidth = 600;
  const mapHeight = 440;

  const latToY = (lat: number) => {
    // 31.8 -> top (20px), 29.4 -> bottom (400px)
    return ((31.8 - lat) / (31.8 - 29.4)) * 380 + 30;
  };

  const lngToX = (lng: number) => {
    // 74.2 -> left (30px), 77.4 -> right (570px)
    return ((lng - 74.2) / (77.4 - 74.2)) * 520 + 40;
  };

  return (
    <div className="bg-[#0D1810]/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-white">
      {/* Map Header & Filter controls */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">Satellite Thermal Anomaly & Fire Risk Map</h3>
          <p className="text-xs text-white/60 mt-0.5">
            Real-time MODIS / VIIRS satellite active stubble heat signatures and predicted NCR smoke trajectory
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 p-1 bg-black/60 border border-white/10 rounded-xl overflow-x-auto max-w-full">
          {['all', 'Extreme', 'High', 'Moderate'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                filterLevel === lvl
                  ? 'bg-[#E5A812] text-[#0D1810] shadow-md font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {lvl === 'all' ? 'All Zones' : lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* SVG Map Canvas */}
        <div className="lg:col-span-8 p-4 bg-[#050D08] relative flex items-center justify-center min-h-[380px]">
          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full h-auto max-h-[460px] select-none"
            fill="none"
          >
            {/* Base state border polygons (Punjab & Haryana indicative outline) */}
            <path
              d="M 60,60 L 180,40 L 320,60 L 410,120 L 460,230 L 420,360 L 310,400 L 160,370 L 60,260 Z"
              fill="#0D2115"
              stroke="#1F472D"
              strokeWidth="2"
            />
            {/* State division line */}
            <path
              d="M 170,220 Q 280,240 370,200"
              stroke="#2C5F3E"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Region labels */}
            <text x="140" y="160" fill="#68BA75" fontSize="14" fontWeight="700" opacity="0.75" letterSpacing="2">
              PUNJAB
            </text>
            <text x="320" y="310" fill="#68BA75" fontSize="14" fontWeight="700" opacity="0.75" letterSpacing="2">
              HARYANA
            </text>
            <text x="440" y="390" fill="#E5A812" fontSize="12" fontWeight="600" opacity="0.8">
              NCR Trajectory →
            </text>

            {/* Hotspot Markers */}
            {filteredZones.map((zone) => {
              const cx = lngToX(zone.coordinates[1]);
              const cy = latToY(zone.coordinates[0]);
              const isSelected = selectedZone?.id === zone.id;

              const getRiskColor = (lvl: string) => {
                switch (lvl) {
                  case 'Extreme':
                    return '#EF4444';
                  case 'High':
                    return '#F97316';
                  case 'Moderate':
                    return '#E5A812';
                  default:
                    return '#10B981';
                }
              };

              const color = getRiskColor(zone.riskLevel);

              return (
                <g
                  key={zone.id}
                  onClick={() => onSelectZone(zone)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                >
                  {/* Outer pulse radius */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 26 : 18}
                    fill={color}
                    opacity={isSelected ? 0.45 : 0.25}
                  />
                  {/* Mid circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 14 : 10}
                    fill={color}
                    stroke="#050D08"
                    strokeWidth="2"
                  />
                  {/* Core icon / indicator */}
                  <circle cx={cx} cy={cy} r="4" fill="#FFFFFF" />

                  {/* Label */}
                  <text
                    x={cx}
                    y={cy - 16}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight={isSelected ? '800' : '600'}
                    className="pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    {zone.district}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map legend */}
          <div className="absolute bottom-3 left-3 sm:left-4 max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)] bg-black/85 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-white/15 text-[10px] sm:text-[11px] text-white/80 flex flex-wrap items-center gap-2 sm:gap-3 shadow-lg">
            <span className="font-bold text-white">Risk:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444] inline-block shrink-0" /> Extreme
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316] inline-block shrink-0" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#E5A812] shadow-[0_0_8px_#E5A812] inline-block shrink-0" /> Moderate
            </span>
          </div>
        </div>

        {/* Selected Zone Inspector Panel */}
        <div className="lg:col-span-4 p-5 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0D1810]/95 flex flex-col justify-between">
          {selectedZone ? (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedZone.district} District</h4>
                  <p className="text-xs text-white/60">{selectedZone.state} Stubble Belt</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    selectedZone.riskLevel === 'Extreme'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : selectedZone.riskLevel === 'High'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                      : 'bg-amber-500/20 text-[#E5A812] border-amber-500/30'
                  }`}
                >
                  {selectedZone.riskLevel} Risk
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    Satellite Thermal Anomalies
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-white">
                    {selectedZone.activeThermalAnomaliesCount} fires detected
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E5A812]" />
                    Projected Downwind AQI (24h)
                  </span>
                  <span className="font-mono font-bold tabular-nums text-rose-400">
                    {selectedZone.aqiPrediction24h} (Severe)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    Wind Velocity & Bearing
                  </span>
                  <span className="text-right text-white font-medium">
                    {selectedZone.predominantWindDirection}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/70">Residue Biomass at Risk</span>
                  <span className="font-mono font-bold tabular-nums text-[#E5A812]">
                    {selectedZone.strawVolumeAtRiskTons.toLocaleString()} Tons
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/70">Baler Mitigation Deployment</span>
                    <span className="font-medium text-emerald-400">
                      {selectedZone.targetedInterventionTeamAssigned ? 'Active Fleet' : 'Needed'}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-[#2E581F] h-2 rounded-full border border-emerald-400/40"
                      style={{
                        width: selectedZone.targetedInterventionTeamAssigned ? '78%' : '20%',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6">
                {onDispatchTeam && !selectedZone.targetedInterventionTeamAssigned ? (
                  <button
                    onClick={() => onDispatchTeam(selectedZone.id)}
                    className="w-full py-2.5 px-4 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#E5A812]" />
                    Dispatch Baler Mobile Fleet to {selectedZone.district}
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Mitigation Operations Underway
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-200/80 leading-relaxed">
                      4 Custom Hiring Centers dispatched with 12 high-density balers to absorb paddy stubble before field firing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-white/50">
              <p>Select any district marker on the map to inspect thermal anomaly telemetry and baler intervention status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
