import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { javaRulesApi } from '../../lib/api/javaService';
import { ContractRecord } from '../../types/contracts';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { FileText, ArrowRight, ShieldCheck, CheckCircle2, Clock, Landmark, Sparkles } from 'lucide-react';

interface ContractsPageProps {
  onNavigate: (path: string) => void;
}

export const ContractsPage: React.FC<ContractsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await javaRulesApi.getContracts(user?.id);
        setContracts(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const filtered = filter === 'all'
    ? contracts
    : contracts.filter((c) => c.status === filter);

  const totalEscrow = contracts.reduce((acc, c) => acc + c.totalContractValue, 0);
  const totalTonnage = contracts.reduce((acc, c) => acc + c.agreedQuantityTons, 0);

  return (
    <div className="w-full">
      {/* Immersive Digital Escrow Contracts Hero Section */}
      <PageHeroBanner
        badge="05 / Legal Trust & Banking Escrow"
        badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-[#E5A812]" />}
        title="Digital Escrow Contracts & Settlements"
        subtitle="Multi-party binding agreements powered by Java Rules engine. Buyer capital is locked in banking escrow and automatically released upon weighbridge verification."
        bgImageUrl="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Total Contracts', value: contracts.length, highlight: true },
          { label: 'Escrow Volume', value: totalEscrow, prefix: '₹' },
          { label: 'Committed Straw', value: totalTonnage, suffix: ' T', highlight: true },
          { label: 'Settled & Paid', value: contracts.filter((c) => c.status === 'settled' || c.status === 'delivered').length },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/impact')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>View Environmental Ledger</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/quotes')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>Pricing Rules Quotes</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-black/60 border border-white/10 rounded-xl max-w-fit">
        {['all', 'pending_signature', 'active', 'delivered', 'settled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all capitalize cursor-pointer ${
              filter === st
                ? 'bg-[#E5A812] text-[#0D1810] shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-white/60">Loading contracts...</div>
      ) : filtered.length === 0 ? (
        <div className="p-16 bg-[#0D1810]/75 backdrop-blur-md border border-white/10 rounded-2xl text-center shadow-2xl text-white">
          <p className="text-base font-bold text-white">No contracts found</p>
          <p className="text-xs text-white/60 mt-1">
            Contracts are automatically generated when a price quote is accepted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate(`/contracts/${c.id}`)}
              className="bg-[#0D1810]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#E5A812]/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 text-white group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#E5A812] bg-[#E5A812]/15 border border-[#E5A812]/30 px-2.5 py-1 rounded-md">
                    {c.contractNumber}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                    c.status === 'delivered' || c.status === 'settled'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : c.status === 'pending_signature'
                      ? 'bg-amber-500/15 text-[#E5A812] border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-white/70 space-y-1">
                  <p>
                    <strong className="text-white">Farmer:</strong> {c.farmerName} <span className="mx-1 text-[#E5A812]">⇄</span> <strong className="text-white">Buyer:</strong> {c.buyerName}
                  </p>
                  <p>
                    Pickup: {c.pickupLocation} → Drop: {c.dropLocation}
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <span>Crop: <strong className="text-white">{c.cropType}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Tonnage: <strong className="font-mono text-white">{c.agreedQuantityTons} Tons</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Rate: <strong className="font-mono text-[#E5A812]">₹{c.unitPricePerTon}/t</strong></span>
                  </div>
                </div>

                {/* Signature status badges */}
                <div className="flex items-center gap-3 text-[11px] text-white/60">
                  <span className="flex items-center gap-1">
                    {c.signedByBuyer ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                    )}
                    Buyer Signed
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    {c.signedByFarmer ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#E5A812] font-semibold" />
                    )}
                    Farmer Signed
                  </span>
                  {c.balerName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Baler Dispatched
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Value & Action */}
              <div className="md:text-right flex flex-col justify-between shrink-0 space-y-3">
                <div>
                  <p className="text-xs text-white/60">Total Contract Escrow</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#E5A812]">
                    ₹{c.totalContractValue.toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(`/contracts/${c.id}`);
                  }}
                  className="px-4 py-2 bg-[#2E581F] hover:bg-[#244818] border border-[#E5A812]/30 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md group-hover:scale-102"
                >
                  <span>Inspect Terms & Sign</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
