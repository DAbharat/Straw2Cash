export interface BalerEquipment {
  id: string;
  balerType: 'Round Baler (High Density)' | 'Square Baler' | 'Mini Baler' | 'Rake & Tedder Unit';
  makeModel: string;
  dailyCapacityTons: number;
  fuelType: 'Diesel' | 'Tractor PTO';
  yearOfManufacture: number;
  availableFromDate: string;
  operationalStatus: 'Available' | 'On Job' | 'Maintenance';
}

export interface BalerProfile {
  id: string;
  userId: string;
  operatorName: string;
  businessName: string;
  phone: string;
  baseDistrict: string;
  baseState: string;
  serviceRadiusKm: number;
  ratePerAcreBalingInr: number;
  ratePerTonBalingInr: number;
  equipment: BalerEquipment[];
  operatorCount: number;
  verifiedStatus: boolean;
}

export interface BalerJobOpportunity {
  id: string;
  listingId: string;
  farmerName: string;
  village: string;
  district: string;
  distanceFromBaseKm: number;
  fieldAreaAcres: number;
  cropType: string;
  estimatedTonnage: number;
  preferredStartDate: string;
  offeredRatePerAcreInr: number;
  totalJobEarningsEstInr: number;
  status: 'Open' | 'Accepted' | 'Completed';
}
