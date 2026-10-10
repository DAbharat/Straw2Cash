export type CropType = 'Paddy (Basmati)' | 'Paddy (Non-Basmati)' | 'Wheat' | 'Sugarcane Trash' | 'Mustard Stalk';
export type StrawCondition = 'Loose Straw' | 'Square Bales' | 'Round Bales' | 'Chopped / Shredded';
export type ListingStatus = 'available' | 'reserved' | 'contracted' | 'fulfilled' | 'cancelled';

export interface StrawListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  cropType: CropType;
  condition: StrawCondition;
  quantityTons: number;
  availableDate: string; // ISO date
  expiryDate: string;
  pricePerTonExpected: number; // in INR
  location: {
    villageOrField: string;
    district: string;
    state: string;
    pincode: string;
    coordinates: [number, number]; // [lat, lng]
  };
  moisturePercentage: number;
  fieldAreaAcres: number;
  baleDensityKgPerM3?: number;
  status: ListingStatus;
  notes?: string;
  createdAt: string;
  estimatedFireRiskAvoidedCo2Tons?: number;
}

export type RequirementStatus = 'active' | 'partially_fulfilled' | 'fulfilled' | 'closed';

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerOrganization: string;
  cropType: CropType;
  conditionPreference: StrawCondition[];
  requiredQuantityTons: number;
  fulfilledQuantityTons: number;
  maxPricePerTon: number;
  deliveryDeadline: string;
  destinationLocation: {
    facilityName: string;
    district: string;
    state: string;
    pincode: string;
    coordinates: [number, number];
  };
  acceptableMoistureMax: number;
  status: RequirementStatus;
  createdAt: string;
  notes?: string;
}

export interface StrawMatch {
  id: string;
  listingId: string;
  requirementId: string;
  listing: StrawListing;
  requirement: BuyerRequirement;
  compatibilityScore: number; // 0 - 100
  distanceKm: number;
  priceDelta: number; // positive or negative
  logisticsFeasibility: 'High' | 'Medium' | 'Low';
  estimatedLogisticsCostPerTon: number;
  suggestedAction: string;
}
