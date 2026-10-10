import { UserProfile, UserRole } from '../../types/auth';
import { StrawListing, BuyerRequirement, StrawMatch, ListingStatus, RequirementStatus } from '../../types/listings';
import { INITIAL_USERS, INITIAL_LISTINGS, INITIAL_REQUIREMENTS, INITIAL_MATCHES } from '../mockData';

const STORAGE_KEY_USERS = 's2c_users';
const STORAGE_KEY_LISTINGS = 's2c_listings';
const STORAGE_KEY_REQUIREMENTS = 's2c_requirements';

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

// In-memory / storage sync
let users: UserProfile[] = getStored(STORAGE_KEY_USERS, INITIAL_USERS);
let listings: StrawListing[] = getStored(STORAGE_KEY_LISTINGS, INITIAL_LISTINGS);
let requirements: BuyerRequirement[] = getStored(STORAGE_KEY_REQUIREMENTS, INITIAL_REQUIREMENTS);

export const goBackendApi = {
  // Auth
  async login(emailOrPhone: string, role?: UserRole): Promise<{ user: UserProfile; token: string }> {
    const trimmed = emailOrPhone.trim().toLowerCase();
    const found = users.find(
      (u) =>
        (u.email.toLowerCase() === trimmed || u.phone.includes(trimmed)) &&
        (!role || u.role === role)
    ) || users.find((u) => u.role === role) || users[0];

    const token = `go_jwt_${found.id}_${Date.now()}`;
    return { user: found, token };
  },

  async register(data: Partial<UserProfile>): Promise<{ user: UserProfile; token: string }> {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: data.name || 'Agri User',
      email: data.email || `user_${Date.now()}@straw2cash.in`,
      phone: data.phone || '+91 98000 00000',
      role: data.role || 'farmer',
      location: data.location || {
        villageOrCity: 'Nabha',
        district: 'Patiala',
        state: 'Punjab',
        pincode: '147201',
      },
      organizationName: data.organizationName,
      farmSizeAcres: data.farmSizeAcres,
      primaryCrops: data.primaryCrops || ['Paddy (Basmati)'],
      procurementCapacityTons: data.procurementCapacityTons,
      buyerType: data.buyerType,
      balerEquipmentCount: data.balerEquipmentCount,
      balerDailyCapacityTons: data.balerDailyCapacityTons,
      operatingRadiusKm: data.operatingRadiusKm,
      createdAt: new Date().toISOString(),
    };

    users = [newUser, ...users];
    setStored(STORAGE_KEY_USERS, users);
    const token = `go_jwt_${newUser.id}_${Date.now()}`;
    return { user: newUser, token };
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const found = users.find((u) => u.id === userId);
    return found || null;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    users = users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    setStored(STORAGE_KEY_USERS, users);
    const updated = users.find((u) => u.id === userId)!;
    return updated;
  },

  // Straw Listings
  async getListings(filters?: {
    cropType?: string;
    condition?: string;
    maxPrice?: number;
    district?: string;
    status?: ListingStatus;
  }): Promise<StrawListing[]> {
    let result = [...listings];
    if (filters?.cropType) {
      result = result.filter((l) => l.cropType === filters.cropType);
    }
    if (filters?.condition) {
      result = result.filter((l) => l.condition === filters.condition);
    }
    if (filters?.maxPrice) {
      result = result.filter((l) => l.pricePerTonExpected <= filters.maxPrice!);
    }
    if (filters?.district) {
      result = result.filter((l) => l.location.district.toLowerCase().includes(filters.district!.toLowerCase()));
    }
    if (filters?.status) {
      result = result.filter((l) => l.status === filters.status);
    }
    return result;
  },

  async getListingById(id: string): Promise<StrawListing | null> {
    const found = listings.find((l) => l.id === id);
    return found || null;
  },

  async getMyListings(farmerId: string): Promise<StrawListing[]> {
    return listings.filter((l) => l.farmerId === farmerId);
  },

  async createListing(listingData: Omit<StrawListing, 'id' | 'createdAt'>): Promise<StrawListing> {
    const newListing: StrawListing = {
      ...listingData,
      id: `lst_${Date.now()}`,
      createdAt: new Date().toISOString(),
      estimatedFireRiskAvoidedCo2Tons: Math.round(listingData.quantityTons * 1.5 * 10) / 10,
    };
    listings = [newListing, ...listings];
    setStored(STORAGE_KEY_LISTINGS, listings);
    return newListing;
  },

  async updateListingStatus(id: string, status: ListingStatus): Promise<StrawListing> {
    listings = listings.map((l) => (l.id === id ? { ...l, status } : l));
    setStored(STORAGE_KEY_LISTINGS, listings);
    const updated = listings.find((l) => l.id === id)!;
    return updated;
  },

  // Buyer Requirements
  async getRequirements(buyerId?: string): Promise<BuyerRequirement[]> {
    if (buyerId) {
      return requirements.filter((r) => r.buyerId === buyerId);
    }
    return [...requirements];
  },

  async getRequirementById(id: string): Promise<BuyerRequirement | null> {
    return requirements.find((r) => r.id === id) || null;
  },

  async createRequirement(reqData: Omit<BuyerRequirement, 'id' | 'createdAt' | 'fulfilledQuantityTons'>): Promise<BuyerRequirement> {
    const newReq: BuyerRequirement = {
      ...reqData,
      id: `req_${Date.now()}`,
      fulfilledQuantityTons: 0,
      createdAt: new Date().toISOString(),
    };
    requirements = [newReq, ...requirements];
    setStored(STORAGE_KEY_REQUIREMENTS, requirements);
    return newReq;
  },

  async updateRequirementStatus(id: string, status: RequirementStatus): Promise<BuyerRequirement> {
    requirements = requirements.map((r) => (r.id === id ? { ...r, status } : r));
    setStored(STORAGE_KEY_REQUIREMENTS, requirements);
    return requirements.find((r) => r.id === id)!;
  },

  // Matching
  async getMatchesForFarmer(farmerId: string): Promise<StrawMatch[]> {
    const myListings = listings.filter((l) => l.farmerId === farmerId);
    if (myListings.length === 0) return INITIAL_MATCHES;

    return INITIAL_MATCHES.filter((m) => myListings.some((l) => l.id === m.listingId));
  },

  async getFarmerMatches(farmerId: string): Promise<StrawMatch[]> {
    return this.getMatchesForFarmer(farmerId);
  },

  async getMatchesForBuyer(buyerId: string): Promise<StrawMatch[]> {
    const myReqs = requirements.filter((r) => r.buyerId === buyerId);
    if (myReqs.length === 0) return INITIAL_MATCHES;

    return INITIAL_MATCHES.filter((m) => myReqs.some((r) => r.id === m.requirementId));
  },
};
