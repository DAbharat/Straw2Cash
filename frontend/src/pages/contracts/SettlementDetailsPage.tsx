import React, { useState, useEffect } from 'react';
import { javaRulesApi } from '../../lib/api/javaService';
import { SettlementRecord } from '../../types/contracts';
import { useToast } from '../../lib/context/ToastContext';
import { BlurRevealText } from '../../components/ui/BlurRevealText';
import { ArrowLeft, CheckCircle2, DollarSign, ShieldCheck, Scale, ArrowRight } from 'lucide-react';

interface SettlementDetailsPageProps {
  settlementId: string;
  onNavigate: (path: string) => void;
}

export const SettlementDetailsPage: React.FC<SettlementDetailsPageProps> = ({
  settlementId,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [settlement, setSettlement] = useState<SettlementRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await javaRulesApi.getSettlementById(settlementId);
        setSettlement(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [settlementId]);

  const handleReleasePayout = async () => {
    if (!settlement) return;
    setReleasing(true);
    try {
      const updated = await javaRulesApi.releaseSettlementPayout(settlement.id);
      setSettlement(updated);
      showToast('Escrow Payout Disbursed', `Direct IMPS transfer credited to ${settlement.farmerName}`);
    } catch {
      showToast('Error', 'Unable to release escrow payout', 'error');
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-white/70">Loading settlement ledger...</div>;
  }

  if (!settlement) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-base font-bold text-white">Settlement Record Not Found</p>
        <button
          onClick={() => onNavigate('/contracts')}
          className="mt-4 px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs border border-white/20"
        >
          Back to Contracts
        </button>
      </div>
    );
  }

  const isSettled = settlement.escrowStatus === 'fully_settled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/contracts')}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <BlurRevealText
                text={settlement.settlementNumber}
                as="h1"
                className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              />
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize border ${
                isSettled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-[#E5A812]/15 text-[#E5A812] border-[#E5A812]/30'
              }`}>
                {settlement.escrowStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1">
              Contract: <span className="text-[#E5A812] font-semibold">{settlement.contractNumber}</span> · Disbursed via Bank Escrow Rails
            </p>
          </div>
        </div>

        {/* Quick Release Action in Header if Pending */}
        {!isSettled && (
          <button
            onClick={handleReleasePayout}
            disabled={releasing}
            className="px-4 py-2 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <DollarSign className="w-4 h-4 text-[#0D1810]" />
            <span>{releasing ? 'Releasing Funds...' : 'Release Escrow Payout'}</span>
          </button>
        )}
      </div>

      {/* Main Glassmorphic Container */}
      <div className="bg-transparent backdrop-blur-xl border border-white/50 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] space-y-8 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Official Escrow Settlement & Payment Receipt</h2>
            <p className="text-xs text-white/70 mt-0.5">Certified bank clearance and escrow disbursement breakdown for fulfilled supply contract.</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#E5A812] shrink-0" />
        </div>

        {/* 3-Way Money Flow Diagram */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#E5A812]">Three-Party Capital Disbursement Flow</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Flow 1: Commodity Net (Farmer) */}
            <div className="p-4.5 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Flow 1: Commodity Net</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-sm font-bold text-white mt-1.5">BUYER ESCROW → FARMER</p>
                <p className="text-[11px] text-white/70 mt-1">100% farm-gate straw value ({settlement.farmerName})</p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <span className="text-[10px] text-white/50 block">Net Payout Amount</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                  ₹{settlement.farmerPayoutAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Flow 2: Service & Freight (Baler / Transporter) */}
            <div className="p-4.5 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">Flow 2: Service & Freight</span>
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                </div>
                <p className="text-sm font-bold text-white mt-1.5">BUYER ESCROW → TRANSPORTER</p>
                <p className="text-[11px] text-white/70 mt-1">Baling & custom hiring machine compensation</p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <span className="text-[10px] text-white/50 block">Logistics Payout</span>
                <p className="text-2xl font-extrabold font-mono text-sky-400 mt-0.5">
                  ₹{settlement.balerPayoutAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Flow 3: Platform Multi-Sig */}
            <div className="p-4.5 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#E5A812] uppercase tracking-wider">Flow 3: Platform Multi-Sig</span>
                  <span className="w-2 h-2 rounded-full bg-[#E5A812]"></span>
                </div>
                <p className="text-sm font-bold text-white mt-1.5">BUYER ESCROW → PLATFORM</p>
                <p className="text-[11px] text-white/70 mt-1">Escrow verification & ledger audit (1.5%)</p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <span className="text-[10px] text-white/50 block">Platform Fee</span>
                <p className="text-2xl font-extrabold font-mono text-[#E5A812] mt-0.5">
                  ₹{settlement.platformFeeAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Weighbridge Slip Reconciliation */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#E5A812] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#E5A812]" />
              <span>Digital Weighbridge Slip Reconciliation</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              ✓ Verified at Destination
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white/5 border border-white/20 rounded-2xl backdrop-blur-md">
              <p className="text-white/70 text-[11px]">Certified Net Weight</p>
              <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
                {settlement.weighbridgeWeightTons} Tons
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/20 rounded-2xl backdrop-blur-md">
              <p className="text-white/70 text-[11px]">Moisture Deduction</p>
              <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                0.0% (Within Limits)
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/20 rounded-2xl backdrop-blur-md">
              <p className="text-white/70 text-[11px]">Total Guaranteed Escrow Balance</p>
              <p className="text-xl font-extrabold font-mono tabular-nums text-[#E5A812] mt-1">
                ₹{settlement.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payout Disbursement Ledger */}
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#E5A812]">Payout Disbursement Ledger</h3>
          <div className="divide-y divide-white/10 border border-white/20 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md">
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Farmer Net Payout</p>
                <p className="text-[11px] text-white/60">Credited to {settlement.farmerName}'s Bank A/C</p>
              </div>
              <span className="font-bold font-mono tabular-nums text-emerald-400 text-base">
                ₹{settlement.farmerPayoutAmount.toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-white">Baler Service & Transportation Share</p>
                <p className="text-[11px] text-white/60">Custom hiring center machine compensation</p>
              </div>
              <span className="font-medium font-mono tabular-nums text-sky-300">
                ₹{settlement.balerPayoutAmount.toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-white">Platform Escrow Fee (1.5%)</p>
                <p className="text-[11px] text-white/60">Multi-sig settlement execution & audit</p>
              </div>
              <span className="font-medium font-mono tabular-nums text-[#E5A812]">
                ₹{settlement.platformFeeAmount.toLocaleString()}
              </span>
            </div>
            <div className="p-4 sm:p-5 flex justify-between items-center bg-white/10 border-t border-white/20">
              <span className="font-bold text-white text-sm">Total Disbursed Capital</span>
              <span className="font-extrabold font-mono tabular-nums text-lg sm:text-xl text-[#E5A812]">
                ₹{settlement.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {settlement.bankReferenceNumber && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/70 font-semibold">Bank Clearing Reference (IMPS/NEFT):</span>
                <span className="font-mono font-bold text-emerald-400">{settlement.bankReferenceNumber}</span>
              </div>
              <p className="text-[11px] text-white/60">
                Processed on {new Date(settlement.netDisbursedDate!).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {/* Escrow Release Control & Authorization Area */}
        <div className="pt-4 border-t border-white/20">
          {isSettled ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-400">Funds Fully Disbursed</p>
                  <p className="text-[11px] text-white/70">
                    100% of commodity value cleared through multi-sig escrow into farmer's account.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/contracts')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-[#E5A812] border border-white/20 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Back to Contracts
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-[#E5A812]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E5A812]/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#E5A812]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Escrow Release Authorization</p>
                  <p className="text-[11px] text-white/70">
                    Disbursement is protected by dual confirmation of weighbridge weight and moisture sensors.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReleasePayout}
                disabled={releasing}
                className="px-6 py-3 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
              >
                <DollarSign className="w-4 h-4 text-[#0D1810]" />
                <span>{releasing ? 'Releasing Funds...' : 'Release Escrow Payout'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
