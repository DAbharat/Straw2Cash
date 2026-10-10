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

  const handleSignContract = async () => {
    if (!contract) return;
    setSigning(true);
    try {
      const updated = await javaRulesApi.signContract(contract.id, role);
      setContract(updated);
      showToast('Digital Signature Registered', `Signed and recorded on digital ledger as ${role}`);
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
    return <div className="py-20 text-center text-xs text-[#5E6D63]">Loading contract details...</div>;
  }

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-base font-bold text-[#19241B]">Contract Not Found</p>
        <button
          onClick={() => onNavigate('/contracts')}
          className="mt-4 px-4 py-2 bg-[#1B382B] text-white rounded-lg text-xs"
        >
          Back to Contracts
        </button>
      </div>
    );
  }

  const isSignedByMe =
    (role === 'farmer' && contract.signedByFarmer) ||
    (role === 'buyer' && contract.signedByBuyer) ||
    (role === 'baler' && contract.signedByBaler);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
              text={contract.contractNumber}
              as="h1"
              className="text-2xl sm:text-3xl font-extrabold text-[#19241B] tracking-tight"
            />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded capitalize bg-[#EAF2ED] text-[#1E4530]">
              {contract.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-[#5E6D63] mt-0.5">
            Governed by Java Rules Engine v2.4 · Created {new Date(contract.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Contract Agreement */}
        <div className="lg:col-span-8 bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E3DED2]">
            <h2 className="text-base font-bold text-[#19241B]">Agricultural Crop Residue Supply Agreement</h2>
            <ShieldCheck className="w-5 h-5 text-[#245E3F]" />
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#F4F0E6] rounded-xl border border-[#E3DED2]">
              <p className="text-[11px] font-semibold text-[#8A795D] uppercase">The Producer (Farmer)</p>
              <p className="font-bold text-sm text-[#19241B] mt-1">{contract.farmerName}</p>
              <p className="text-[#5E6D63] mt-0.5">Pickup: {contract.pickupLocation}</p>
              <p className="text-[11px] font-mono mt-2 text-[#245E3F]">
                {contract.signedByFarmer ? `✓ Signed on ${new Date(contract.signedByFarmerAt!).toLocaleDateString()}` : '⏳ Pending Signature'}
              </p>
            </div>

            <div className="p-4 bg-[#F4F0E6] rounded-xl border border-[#E3DED2]">
              <p className="text-[11px] font-semibold text-[#8A795D] uppercase">The Off-Taker (Buyer)</p>
              <p className="font-bold text-sm text-[#19241B] mt-1">{contract.buyerName}</p>
              <p className="text-[#5E6D63] mt-0.5">Delivery: {contract.dropLocation}</p>
              <p className="text-[11px] font-mono mt-2 text-[#245E3F]">
                {contract.signedByBuyer ? `✓ Signed on ${new Date(contract.signedByBuyerAt!).toLocaleDateString()}` : '⏳ Pending Signature'}
              </p>
            </div>
          </div>

          {/* Agreed Specs Table */}
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#19241B]">Agreed Terms & Conditions</h3>
            <div className="divide-y divide-[#E3DED2] border border-[#E3DED2] rounded-xl overflow-hidden bg-white">
              <div className="p-3 flex justify-between">
                <span className="text-[#5E6D63]">Residue Commodity</span>
                <span className="font-bold text-[#19241B]">{contract.cropType}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-[#5E6D63]">Contracted Volume</span>
                <span className="font-bold font-mono tabular-nums text-[#19241B]">{contract.agreedQuantityTons} Metric Tons</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-[#5E6D63]">Unit Price (Delivered Basis)</span>
                <span className="font-bold font-mono tabular-nums text-[#19241B]">₹{contract.unitPricePerTon.toLocaleString()} / Ton</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-[#5E6D63]">Maximum Allowable Moisture</span>
                <span className="font-bold font-mono text-[#19241B]">{contract.moistureThresholdPercent}% Max</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-[#5E6D63]">Pickup Window Schedule</span>
                <span className="font-medium text-[#19241B]">{contract.pickupScheduleStart} to {contract.pickupScheduleEnd}</span>
              </div>
              <div className="p-3 flex justify-between bg-[#FAF8F3]">
                <span className="font-bold text-[#19241B]">Total Guaranteed Escrow Commitment</span>
                <span className="font-bold font-mono tabular-nums text-base text-[#1B382B]">
                  ₹{contract.totalContractValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Legal statement */}
          <div className="text-[11px] text-[#7A877B] leading-relaxed p-4 bg-[#F2EDE2] rounded-xl">
            <p>
              Under this contract, funds are held in automated multi-sig escrow and automatically disbursed upon digital weighbridge certification at destination. Both parties agree that no open field burning will occur on the harvest parcel.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[#FAF8F3] border border-[#E3DED2] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#19241B]">
              Signature & Execution
            </h3>

            {isSignedByMe ? (
              <div className="p-4 bg-[#EAF2ED] border border-[#BFD5C6] rounded-xl text-xs text-[#1E4530] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#245E3F]" />
                  Signed by you as {role}
                </p>
                <p className="text-[11px] text-[#37614A]">
                  Your authorization has been recorded cryptographically on the platform ledger.
                </p>
              </div>
            ) : (
              <button
                onClick={handleSignContract}
                disabled={signing}
                className="w-full py-3 px-4 bg-[#1B382B] text-white rounded-xl text-xs font-bold hover:bg-[#12261D] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                <span>{signing ? 'Signing Contract...' : `Sign Digitally as ${role}`}</span>
              </button>
            )}

            {/* Lifecycle advancement: Mark Delivered */}
            {contract.status === 'active' && (
              <div className="pt-4 border-t border-[#E3DED2] space-y-2">
                <p className="text-xs text-[#5E6D63]">Field Baler & Logistics Status:</p>
                <button
                  onClick={handleMarkDelivered}
                  className="w-full py-2.5 px-3 bg-[#245E3F] text-white rounded-lg text-xs font-semibold hover:bg-[#1B4A31] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Verify Weighbridge & Trigger Settlement</span>
                </button>
              </div>
            )}

            {contract.settlementId && (
              <div className="pt-4 border-t border-[#E3DED2]">
                <button
                  onClick={() => onNavigate(`/settlements/${contract.settlementId}`)}
                  className="w-full py-2.5 px-3 bg-[#C88A1B] text-white rounded-lg text-xs font-semibold hover:bg-[#A67114] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>View Settlement Disbursement →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
