export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type ContractStatus = 'draft' | 'pending_signature' | 'active' | 'in_transit' | 'delivered' | 'settled' | 'disputed';
export type SettlementStatus = 'unpaid' | 'escrow_held' | 'partial_released' | 'fully_settled';

export interface PriceQuote {
  id: string;
  listingId: string;
  requirementId?: string;
  buyerId: string;
  farmerId: string;
  proposedPricePerTon: number;
  totalQuantityTons: number;
  baseAmount: number;
  balingFeePerTon: number;
  freightEstimatePerTon: number;
  platformFeePercent: number;
  netPayableToFarmer: number;
  grossPayableByBuyer: number;
  validUntil: string;
  status: QuoteStatus;
  terms: string;
  createdAt: string;
}

export interface ContractRecord {
  id: string;
  contractNumber: string;
  quoteId: string;
  listingId: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  balerId?: string;
  balerName?: string;
  cropType: string;
  agreedQuantityTons: number;
  deliveredQuantityTons: number;
  unitPricePerTon: number;
  totalContractValue: number;
  pickupLocation: string;
  dropLocation: string;
  pickupScheduleStart: string;
  pickupScheduleEnd: string;
  moistureThresholdPercent: number;
  status: ContractStatus;
  signedByFarmer: boolean;
  signedByFarmerAt?: string;
  signedByBuyer: boolean;
  signedByBuyerAt?: string;
  signedByBaler?: boolean;
  signedByBalerAt?: string;
  settlementId?: string;
  createdAt: string;
}

export interface SettlementRecord {
  id: string;
  settlementNumber: string;
  contractId: string;
  contractNumber: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  totalAmount: number;
  farmerPayoutAmount: number;
  balerPayoutAmount: number;
  platformFeeAmount: number;
  escrowStatus: SettlementStatus;
  weighbridgeWeightTons: number;
  qualityMoistureDeductionPercent: number;
  netDisbursedDate?: string;
  bankReferenceNumber?: string;
  createdAt: string;
}

export interface EcologicalImpactSummary {
  stubbleDivertedTons: number;
  co2EmissionsAvoidedTons: number;
  pm25AvoidedKg: number;
  firesPreventedCount: number;
  farmerIncomeGeneratedInr: number;
  coalEquivalentReplacedMWh: number;
}
