import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { useToast } from '../../lib/context/ToastContext';
import { javaRulesApi } from '../../lib/api/javaService';
import { ContractRecord } from '../../types/contracts';
import { BlurRevealText } from '../../components/ui/BlurRevealText';
import { ArrowLeft, CheckCircle2, Clock, ShieldCheck, FileCheck, ArrowRight, Truck } from 'lucide-react';

interface ContractDetailsPageProps {
  contractId: string;
  onNavigate: (path: string) => void;
}

export const ContractDetailsPage: React.FC<ContractDetailsPageProps> = ({
  contractId,
  onNavigate,
}) => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await javaRulesApi.getContractById(contractId);
        setContract(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contractId]);

  const handleSignContract = async (signingRole?: 'farmer' | 'buyer' | 'baler') => {
    if (!contract) return;
    setSigning(true);
    try {
      const activeRole = signingRole || (!contract.signedByFarmer ? 'farmer' : !contract.signedByBuyer ? 'buyer' : role);
      const updated = await javaRulesApi.signContract(contract.id, activeRole);
      setContract(updated);
      showToast(
        'Digital Signature Registered',
        `Signed as ${activeRole.toUpperCase()}. Contract is now ${updated.status.toUpperCase()}!`
      );
    } catch {
      showToast('Signing Error', 'Unable to complete signature', 'error');
    } finally {
      setSigning(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!contract) return;
    try {
      const updated = await javaRulesApi.updateContractStatus(contract.id, 'delivered');
      setContract(updated);
      showToast('Delivery Certified', 'Weighbridge slip confirmed. Settlement generated!');
      if (updated.settlementId) {
        onNavigate(`/settlements/${updated.settlementId}`);
      }
    } catch {
      showToast('Error', 'Unable to record delivery', 'error');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-white/70">Loading contract details...</div>;
  }

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-base font-bold text-white">Contract Not Found</p>
        <button
          onClick={() => onNavigate('/contracts')}
          className="mt-4 px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs"
        >
          Back to Contracts
        </button>
      </div>
    );
  }

  const isFullySigned = contract.signedByFarmer && contract.signedByBuyer;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
                text={contract.contractNumber}
                as="h1"
                className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              />
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize border ${
                contract.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-[#E5A812]/15 text-[#E5A812] border-[#E5A812]/30'
              }`}>
                {contract.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1">
              Created on {new Date(contract.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Quick Sign Action in Header if Pending */}
        {!isFullySigned && (
          <button
            onClick={() => handleSignContract(!contract.signedByFarmer ? 'farmer' : 'buyer')}
            disabled={signing}
            className="px-4 py-2 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <FileCheck className="w-4 h-4 text-[#0D1810]" />
            <span>
              {signing
                ? 'Registering Signature...'
                : !contract.signedByFarmer
                ? 'Sign as Farmer'
                : 'Sign as Buyer'}
            </span>
          </button>
        )}
      </div>

      {/* Main Contract Agreement */}
      <div className="bg-transparent backdrop-blur-xl border border-white/50 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] space-y-6 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <h2 className="text-base sm:text-lg font-bold text-white">Agricultural Crop Residue Supply Agreement</h2>
          <ShieldCheck className="w-5 h-5 text-[#E5A812]" />
        </div>

        {/* Parties with Direct In-Card Signing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Farmer Card */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#E5A812] uppercase tracking-wider">The Producer (Farmer)</p>
              <p className="font-bold text-base text-white mt-1">{contract.farmerName}</p>
              <p className="text-white/70 mt-0.5">Pickup: {contract.pickupLocation}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              {contract.signedByFarmer ? (
                <span className="text-[11px] font-mono flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Signed on {new Date(contract.signedByFarmerAt!).toLocaleDateString()}</span>
                </span>
              ) : (
                <>
                  <span className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Signature
                  </span>
                  <button
                    onClick={() => handleSignContract('farmer')}
                    disabled={signing}
                    className="px-3.5 py-1.5 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] font-extrabold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    title="Click to sign contract as farmer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-[#0D1810]" />
                    <span>Sign Here</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Buyer Card */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#E5A812] uppercase tracking-wider">The Off-Taker (Buyer)</p>
              <p className="font-bold text-base text-white mt-1">{contract.buyerName}</p>
              <p className="text-white/70 mt-0.5">Delivery: {contract.dropLocation}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              {contract.signedByBuyer ? (
                <span className="text-[11px] font-mono flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Signed on {new Date(contract.signedByBuyerAt!).toLocaleDateString()}</span>
                </span>
              ) : (
                <>
                  <span className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Signature
                  </span>
                  <button
                    onClick={() => handleSignContract('buyer')}
                    disabled={signing}
                    className="px-3.5 py-1.5 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] font-extrabold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    title="Click to sign contract as buyer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-[#0D1810]" />
                    <span>Sign Here</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Agreed Specs Table */}
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#E5A812]">Agreed Terms & Conditions</h3>
          <div className="divide-y divide-white/10 border border-white/20 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md">
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <span className="text-white/70">Residue Commodity</span>
              <span className="font-bold text-white">{contract.cropType}</span>
            </div>
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <span className="text-white/70">Contracted Volume</span>
              <span className="font-bold font-mono tabular-nums text-white">{contract.agreedQuantityTons} Metric Tons</span>
            </div>
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <span className="text-white/70">Unit Price (Delivered Basis)</span>
              <span className="font-bold font-mono tabular-nums text-white">₹{contract.unitPricePerTon.toLocaleString()} / Ton</span>
            </div>
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <span className="text-white/70">Maximum Allowable Moisture</span>
              <span className="font-bold font-mono text-white">{contract.moistureThresholdPercent}% Max</span>
            </div>
            <div className="p-3.5 sm:p-4 flex justify-between items-center">
              <span className="text-white/70">Pickup Window Schedule</span>
              <span className="font-medium text-white">{contract.pickupScheduleStart} to {contract.pickupScheduleEnd}</span>
            </div>
            <div className="p-4 sm:p-5 flex justify-between items-center bg-white/10 border-t border-white/20">
              <span className="font-bold text-white text-sm">Total Guaranteed Escrow Commitment</span>
              <span className="font-extrabold font-mono tabular-nums text-lg sm:text-xl text-[#E5A812]">
                ₹{contract.totalContractValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Legal statement */}
        <div className="text-xs text-white/70 leading-relaxed p-4 bg-white/5 border border-white/15 rounded-2xl">
          <p>
            Under this contract, funds are held in automated multi-sig escrow and automatically disbursed upon digital weighbridge certification at destination. Both parties agree that no open field burning will occur on the harvest parcel.
          </p>
        </div>

        {/* Execution & Action Area */}
        <div className="pt-4 border-t border-white/20">
          {!isFullySigned ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-[#E5A812]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E5A812]/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#E5A812]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Action Required: Digital Signature Pending</p>
                  <p className="text-[11px] text-white/70">
                    {!contract.signedByFarmer && !contract.signedByBuyer
                      ? 'Signatures from both the producer (farmer) and off-taker (buyer) are required to activate this agreement.'
                      : !contract.signedByFarmer
                      ? 'Producer signature is required to ratify this escrow agreement and initiate dispatch.'
                      : 'Off-taker signature is required to ratify this escrow agreement and lock escrow funds.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!contract.signedByFarmer && (
                  <button
                    onClick={() => handleSignContract('farmer')}
                    disabled={signing}
                    className="px-5 py-2.5 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4 text-[#0D1810]" />
                    <span>{signing ? 'Signing...' : 'Sign as Farmer'}</span>
                  </button>
                )}
                {!contract.signedByBuyer && (
                  <button
                    onClick={() => handleSignContract('buyer')}
                    disabled={signing}
                    className="px-5 py-2.5 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4 text-[#0D1810]" />
                    <span>{signing ? 'Signing...' : 'Sign as Buyer'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Contract fully ratified and active on platform escrow ledger.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {contract.status === 'active' && (
                  <button
                    onClick={handleMarkDelivered}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#2E581F] hover:bg-[#244818] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#E5A812]/40 shadow-lg hover:scale-105"
                  >
                    <Truck className="w-4 h-4 text-[#E5A812]" />
                    <span>Verify Weighbridge & Trigger Settlement</span>
                  </button>
                )}

                {contract.settlementId && (
                  <button
                    onClick={() => onNavigate(`/settlements/${contract.settlementId}`)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#E5A812] hover:bg-[#d4960d] text-[#0D1810] font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>View Settlement Disbursement →</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
