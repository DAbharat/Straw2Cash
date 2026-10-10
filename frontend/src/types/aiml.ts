export interface ResidueEstimateRequest {
  cropType: string;
  fieldAreaAcres: number;
  expectedGrainYieldQuintalsPerAcre: number;
  harvestingMethod: 'Combine Harvester with SMS' | 'Standard Combine' | 'Manual Sickle';
  cuttingHeightCm: number;
}

export interface ResidueEstimateResponse {
  totalStrawGeneratedTons: number;
  recoverableResidueTons: number;
  unrecoverableStubStubbleTons: number;
  strawToGrainRatio: number;
  recommendedBaleType: string;
  estimatedMarketValueMinInr: number;
  estimatedMarketValueMaxInr: number;
  fireRiskReductionIndexPercent: number;
  estimatedCo2AvoidanceTons: number;
  soilNutrientRetentionRecommendation: string;
}

export interface AssistantToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  status: string;
  summary: string;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: 'en' | 'hi' | 'pa' | 'auto';
  suggestedPrompts?: string[];
  tools_called?: AssistantToolCall[];
  detected_language?: string;
}

export interface RegionalDemandInsight {
  district: string;
  state: string;
  demandVolumeTons: number;
  supplyVolumeTons: number;
  demandSupplyRatio: number;
  primaryBuyerIndustry: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  avgPriceInrPerTon: number;
}

export interface PriceTrendDataPoint {
  month: string;
  paddyBasmatiInr: number;
  paddyNonBasmatiInr: number;
  wheatStrawInr: number;
  mustardStrawInr: number;
}

export interface FireHotspotZone {
  id: string;
  district: string;
  state: string;
  coordinates: [number, number]; // [lat, lng]
  riskLevel: 'Extreme' | 'High' | 'Moderate' | 'Low';
  activeThermalAnomaliesCount: number;
  aqiPrediction24h: number;
  predominantWindDirection: string;
  strawVolumeAtRiskTons: number;
  targetedInterventionTeamAssigned: boolean;
}
