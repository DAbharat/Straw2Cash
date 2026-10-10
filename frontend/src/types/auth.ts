export type UserRole = 'farmer' | 'buyer' | 'baler' | 'authority';
export type Role = 'FARMER' | 'BUYER' | 'BALER' | 'AUTHORITY';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  region?: string;
  location: {
    villageOrCity: string;
    district: string;
    state: string;
    pincode: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  organizationName?: string;
  registrationNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  // Role specific fields
  farmSizeAcres?: number;
  primaryCrops?: string[];
  procurementCapacityTons?: number;
  buyerType?: 'Bio-Energy' | 'Paper Mill' | 'Ethanol Plant' | 'Fodder Trader' | 'Brick Kiln' | 'BIOMASS_POWER_PLANT' | 'BRICK_KILN';
  balerEquipmentCount?: number;
  balerDailyCapacityTons?: number;
  operatingRadiusKm?: number;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: string;
  name: string;
  role: Role;
  region: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
}
