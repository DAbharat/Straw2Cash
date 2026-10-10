import React, { useState, useEffect } from 'react';
import { javaRulesApi } from '../../lib/api/javaService';
import { SettlementRecord } from '../../types/contracts';
import { useToast } from '../../lib/context/ToastContext';
import { BlurRevealText } from '../../components/ui/BlurRevealText';
import { ArrowLeft, CheckCircle2, DollarSign, ShieldCheck, Scale } from 'lucide-react';

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
    return <div className="py-20 text-center text-xs text-[#5E6D63]">Loading settlement ledger...</div>;
  }

  if (!settlement) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-base font-bold text-[#19241B]">Settlement Record Not Found</p>
        <button
          onClick={() => onNavigate('/contracts')}
          className="mt-4 px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs"
        >
          Back to Contracts
        </button>
      </div>
    );
  }

  const isSettled = settlement.escrowStatus === 'fully_settled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/contracts')}
          className="p-1.5 text-[#5E6D63] hover:text-[#19241B] rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <BlurRevealText
              text={settlement.settlementNumber}
              as="h1"
              className="text-2xl sm:text-3xl font-extrabold text-[#19241B] tracking-tight"
            />
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded capitalize ${
              isSettled ? 'bg-[#EAF2ED] text-[#1E4530]' : 'bg-amber-100 text-amber-900'
            }`}>
              {settlement.escrowStatus.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-[#5E6D63] mt-0.5">
            Contract: {settlement.contractNumber} · Disbursed via Bank Escrow Rails
          </p>
        </div>
      </div>

      {/* Hackathon Simulation Banner required by Guide */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold">
            SIMULATED FOR HACKATHON — Java Rules Service (Port 8080) Multi-Party Escrow Simulation
          </span>
        </div>
        <span className="font-mono text-[10px] bg-amber-200/80 px-2 py-0.5 rounded font-bold">
          simulated: true
        </span>
      </div>

      {/* 3-Way Money Flow Diagram */}
      <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <h2 className="text-sm font-bold text-[#19241B] mb-4">
          Three-Party Money Flow Architecture (Java Settlement Service)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase">Flow 1: Commodity Net</span>
              <p className="text-sm font-bold text-emerald-950 mt-1">BUYER_ESCROW → FARMER</p>
              <p className="text-[11px] text-emerald-800 mt-1">100% farm-gate straw value</p>
            </div>
            <p className="text-xl font-extrabold font-mono text-emerald-900 mt-3">
              ₹{settlement.farmerPayoutAmount.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-800 uppercase">Flow 2: Service & Freight</span>
              <p className="text-sm font-bold text-sky-950 mt-1">BUYER_ESCROW → TRANSPORTER</p>
              <p className="text-[11px] text-sky-800 mt-1">Baling & logistics compensation</p>
            </div>
            <p className="text-xl font-extrabold font-mono text-sky-900 mt-3">
              ₹{settlement.balerPayoutAmount.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-stone-100 border border-stone-300 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-700 uppercase">Flow 3: Platform Multi-Sig</span>
              <p className="text-sm font-bold text-stone-900 mt-1">BUYER_ESCROW → PLATFORM</p>
              <p className="text-[11px] text-stone-600 mt-1">Escrow & rules execution (1.5%)</p>
            </div>
            <p className="text-xl font-extrabold font-mono text-stone-800 mt-3">
              ₹{settlement.platformFeeAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Weighbridge Certification */}
          <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DED2]">
              <h2 className="text-sm font-bold text-[#19241B] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#245E3F]" />
                Digital Weighbridge Slip Reconciliation
              </h2>
              <span className="text-xs font-mono font-semibold text-[#245E3F] bg-[#E8F2EC] px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[#5E6D63]">Certified Net Weight</p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#19241B]">
                  {settlement.weighbridgeWeightTons} Tons
                </p>
              </div>
              <div>
                <p className="text-[#5E6D63]">Moisture Deduction</p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#245E3F]">
                  0.0% (Within Limits)
                </p>
              </div>
              <div>
                <p className="text-[#5E6D63]">Gross Escrow Balance</p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#19241B]">
                  ₹{settlement.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Disbursement Breakdown */}
          <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#19241B] pb-2 border-b border-[#E3DED2]">
              Payout Disbursement Ledger
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-[#EAF2ED] rounded-xl border border-[#BFD5C6]">
                <div>
                  <p className="font-bold text-[#1E4530]">Farmer Payout (Net)</p>
                  <p className="text-[11px] text-[#37614A]">Credited to {settlement.farmerName}'s Bank A/C</p>
                </div>
                <p className="font-mono font-bold text-base text-[#1B382B]">
                  ₹{settlement.farmerPayoutAmount.toLocaleString()}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#F4F0E6] rounded-xl">
                <div>
                  <p className="font-semibold text-[#19241B]">Baler Service Share</p>
                  <p className="text-[11px] text-[#5E6D63]">Custom hiring machine fee</p>
                </div>
                <p className="font-mono font-semibold text-sm text-[#19241B]">
                  ₹{settlement.balerPayoutAmount.toLocaleString()}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#F4F0E6] rounded-xl">
                <div>
                  <p className="font-semibold text-[#19241B]">Platform Escrow Fee (1.5%)</p>
                  <p className="text-[11px] text-[#5E6D63]">Java Rules execution & multi-sig</p>
                </div>
                <p className="font-mono font-semibold text-sm text-[#5E6D63]">
                  ₹{settlement.platformFeeAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {settlement.bankReferenceNumber && (
              <div className="p-3 bg-white border border-[#E3DED2] rounded-xl text-xs space-y-1">
                <p className="text-[#5E6D63]">Bank Clearing Reference (IMPS/NEFT):</p>
                <p className="font-mono font-bold text-[#19241B]">{settlement.bankReferenceNumber}</p>
                <p className="text-[11px] text-[#245E3F]">
                  Processed on {new Date(settlement.netDisbursedDate!).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Column */}
        <div className="space-y-6">
          <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#19241B]">
              Escrow Release Control
            </h3>

            {isSettled ? (
              <div className="p-4 bg-[#EAF2ED] border border-[#BFD5C6] rounded-xl text-xs text-[#1E4530]">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#245E3F]" />
                  Funds Fully Disbursed
                </p>
                <p className="text-[11px] text-[#37614A] mt-1">
                  100% of commodity value cleared through multi-sig escrow into farmer's account.
                </p>
              </div>
            ) : (
              <button
                onClick={handleReleasePayout}
                disabled={releasing}
                className="w-full py-3 px-4 bg-[#1B382B] text-white rounded-xl text-xs font-bold hover:bg-[#12261D] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                <span>{releasing ? 'Releasing Funds...' : 'Release Escrow Payout'}</span>
              </button>
            )}

            <div className="pt-2 text-[11px] text-[#7A877B] leading-relaxed">
              Disbursement is protected against fraud by dual confirmation of weighbridge weight and moisture sensors.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
