import {
  PriceQuote,
  ContractRecord,
  SettlementRecord,
  EcologicalImpactSummary,
  QuoteStatus,
  ContractStatus,
} from '../../types/contracts';
import { UserRole } from '../../types/auth';
import { INITIAL_QUOTES, INITIAL_CONTRACTS, INITIAL_SETTLEMENTS, INITIAL_IMPACT_SUMMARY } from '../mockData';

const STORAGE_KEY_QUOTES = 's2c_quotes';
const STORAGE_KEY_CONTRACTS = 's2c_contracts';
const STORAGE_KEY_SETTLEMENTS = 's2c_settlements';

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

let quotes: PriceQuote[] = getStored(STORAGE_KEY_QUOTES, INITIAL_QUOTES);
let contracts: ContractRecord[] = getStored(STORAGE_KEY_CONTRACTS, INITIAL_CONTRACTS);
let settlements: SettlementRecord[] = getStored(STORAGE_KEY_SETTLEMENTS, INITIAL_SETTLEMENTS);
let impactSummary: EcologicalImpactSummary = INITIAL_IMPACT_SUMMARY;

export const javaRulesApi = {
  // Quotes (Java Pricing Rules Engine)
  async getQuotes(userId?: string): Promise<PriceQuote[]> {
    if (userId) {
      return quotes.filter((q) => q.buyerId === userId || q.farmerId === userId);
    }
    return [...quotes];
  },

  async getQuoteById(id: string): Promise<PriceQuote | null> {
    return quotes.find((q) => q.id === id) || null;
  },

  async requestQuote(payload: {
    listingId: string;
    requirementId?: string;
    buyerId: string;
    farmerId: string;
    offeredPricePerTon: number;
    quantityTons: number;
    distanceKm: number;
    isPreBaled: boolean;
  }): Promise<PriceQuote> {
    // Java rules calculation
    const baseAmount = payload.offeredPricePerTon * payload.quantityTons;
    const balingFeePerTon = payload.isPreBaled ? 0 : 350;
    // Freight rule: INR 4.5 per ton per km with base INR 100
    const freightEstimatePerTon = Math.round(100 + payload.distanceKm * 4.5);
    const platformFeePercent = 1.5;
    const platformFeeAmount = Math.round((baseAmount * platformFeePercent) / 100);

    const netPayableToFarmer = baseAmount - platformFeeAmount;
    const grossPayableByBuyer = baseAmount + (balingFeePerTon + freightEstimatePerTon) * payload.quantityTons;

    const newQuote: PriceQuote = {
      id: `qt_${Date.now()}`,
      listingId: payload.listingId,
      requirementId: payload.requirementId,
      buyerId: payload.buyerId,
      farmerId: payload.farmerId,
      proposedPricePerTon: payload.offeredPricePerTon,
      totalQuantityTons: payload.quantityTons,
      baseAmount,
      balingFeePerTon,
      freightEstimatePerTon,
      platformFeePercent,
      netPayableToFarmer,
      grossPayableByBuyer,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'pending',
      terms: 'Pricing determined by Java Rules Engine v2.4. Escrow deposit mandatory within 24h of confirmation.',
      createdAt: new Date().toISOString(),
    };

    quotes = [newQuote, ...quotes];
    setStored(STORAGE_KEY_QUOTES, quotes);
    return newQuote;
  },

  async updateQuoteStatus(id: string, status: QuoteStatus): Promise<PriceQuote> {
    quotes = quotes.map((q) => (q.id === id ? { ...q, status } : q));
    setStored(STORAGE_KEY_QUOTES, quotes);
    const updated = quotes.find((q) => q.id === id)!;

    // If accepted, auto generate contract via Java rules engine
    if (status === 'accepted') {
      await this.createContractFromQuote(updated);
    }

    return updated;
  },

  // Contracts
  async getContracts(userId?: string): Promise<ContractRecord[]> {
    if (userId) {
      return contracts.filter(
        (c) => c.farmerId === userId || c.buyerId === userId || c.balerId === userId
      );
    }
    return [...contracts];
  },

  async getContractById(id: string): Promise<ContractRecord | null> {
    return contracts.find((c) => c.id === id) || null;
  },

  async createContractFromQuote(quote: PriceQuote): Promise<ContractRecord> {
    const newContract: ContractRecord = {
      id: `cnt_${Date.now()}`,
      contractNumber: `S2C-2026-PB-${Math.floor(1000 + Math.random() * 9000)}`,
      quoteId: quote.id,
      listingId: quote.listingId,
      farmerId: quote.farmerId,
      farmerName: 'Gurpreet Singh Brar',
      buyerId: quote.buyerId,
      buyerName: 'Punjab GreenPower Biomass Energy Ltd',
      balerId: 'user_baler_1',
      balerName: 'Malwa Custom Hiring & Baling Center',
      cropType: 'Paddy (Basmati)',
      agreedQuantityTons: quote.totalQuantityTons,
      deliveredQuantityTons: 0,
      unitPricePerTon: quote.proposedPricePerTon,
      totalContractValue: quote.baseAmount,
      pickupLocation: 'Bhawani Garh, Sangrur (PB)',
      dropLocation: 'Patiala Biomass Generation Plant II, Patiala (PB)',
      pickupScheduleStart: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      pickupScheduleEnd: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      moistureThresholdPercent: 16.0,
      status: 'pending_signature',
      signedByFarmer: false,
      signedByBuyer: true,
      signedByBuyerAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    contracts = [newContract, ...contracts];
    setStored(STORAGE_KEY_CONTRACTS, contracts);
    return newContract;
  },

  async signContract(contractId: string, role: UserRole | string): Promise<ContractRecord> {
    const timestamp = new Date().toISOString();
    contracts = contracts.map((c) => {
      if (c.id !== contractId) return c;
      const updated = { ...c };
      if (role === 'farmer') {
        updated.signedByFarmer = true;
        updated.signedByFarmerAt = timestamp;
      } else if (role === 'buyer') {
        updated.signedByBuyer = true;
        updated.signedByBuyerAt = timestamp;
      } else if (role === 'baler') {
        updated.signedByBaler = true;
        updated.signedByBalerAt = timestamp;
      }

      if (updated.signedByFarmer && updated.signedByBuyer) {
        updated.status = 'active';
      }
      return updated;
    });

    setStored(STORAGE_KEY_CONTRACTS, contracts);
    return contracts.find((c) => c.id === contractId)!;
  },

  async updateContractStatus(contractId: string, status: ContractStatus): Promise<ContractRecord> {
    contracts = contracts.map((c) => {
      if (c.id !== contractId) return c;
      const updated = { ...c, status };
      if (status === 'delivered' && !c.settlementId) {
        // Create settlement
        const settlementId = `stl_${Date.now()}`;
        updated.settlementId = settlementId;
        updated.deliveredQuantityTons = c.agreedQuantityTons;

        const newSettlement: SettlementRecord = {
          id: settlementId,
          settlementNumber: `STL-PB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          contractId: c.id,
          contractNumber: c.contractNumber,
          farmerId: c.farmerId,
          farmerName: c.farmerName,
          buyerId: c.buyerId,
          buyerName: c.buyerName,
          totalAmount: c.totalContractValue,
          farmerPayoutAmount: Math.round(c.totalContractValue * 0.985),
          balerPayoutAmount: 18000,
          platformFeeAmount: Math.round(c.totalContractValue * 0.015),
          escrowStatus: 'escrow_held',
          weighbridgeWeightTons: c.agreedQuantityTons,
          qualityMoistureDeductionPercent: 0,
          createdAt: new Date().toISOString(),
        };
        settlements = [newSettlement, ...settlements];
        setStored(STORAGE_KEY_SETTLEMENTS, settlements);
      }
      return updated;
    });

    setStored(STORAGE_KEY_CONTRACTS, contracts);
    return contracts.find((c) => c.id === contractId)!;
  },

  // Settlements
  async getSettlements(userId?: string): Promise<SettlementRecord[]> {
    if (userId) {
      return settlements.filter((s) => s.farmerId === userId || s.buyerId === userId);
    }
    return [...settlements];
  },

  async getSettlementById(id: string): Promise<SettlementRecord | null> {
    return settlements.find((s) => s.id === id) || null;
  },

  async releaseSettlementPayout(settlementId: string): Promise<SettlementRecord> {
    const timestamp = new Date().toISOString();
    settlements = settlements.map((s) => {
      if (s.id !== settlementId) return s;
      return {
        ...s,
        escrowStatus: 'fully_settled',
        netDisbursedDate: timestamp,
        bankReferenceNumber: `IMPS-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      };
    });
    setStored(STORAGE_KEY_SETTLEMENTS, settlements);
    return settlements.find((s) => s.id === settlementId)!;
  },

  // Ecological Impact Summaries
  async getImpactSummary(): Promise<EcologicalImpactSummary> {
    return { ...impactSummary };
  },
};
