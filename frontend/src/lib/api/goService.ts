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

let users: UserProfile[] = getStored(STORAGE_KEY_USERS, INITIAL_USERS);
let listings: StrawListing[] = getStored(STORAGE_KEY_LISTINGS, INITIAL_LISTINGS);
let requirements: BuyerRequirement[] = getStored(STORAGE_KEY_REQUIREMENTS, INITIAL_REQUIREMENTS);

const getToken = () => localStorage.getItem('s2c_auth_token');
const getBaseUrl = () => import.meta.env.VITE_GO_API?.replace(/\/$/, '') || 'http://localhost:8080';

async function fetchGo(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${getBaseUrl()}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`Go Backend Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const goBackendApi = {
  // Baler Authentication
  async login(phone: string, password?: string): Promise<{ user: UserProfile; token: string }> {
    const formattedPhone = phone.startsWith('+91') ? phone : (phone.length === 10 ? `+91${phone}` : phone);
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        password: password || 'baler123',
      }),
    });
    if (!res.ok) {
      // Also try with raw phone if +91 failed
      const altRes = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          password: password || 'baler123',
        }),
      });
      if (!altRes.ok) throw new Error('Go Baler Login failed');
      const altData = await altRes.json();
      return this.mapGoAuthResponse(altData);
    }
    const data = await res.json();
    return this.mapGoAuthResponse(data);
  },

  async register(data: Partial<UserProfile>, password?: string): Promise<{ user: UserProfile; token: string }> {
    const phone = data.phone || '';
    const formattedPhone = phone.startsWith('+91') ? phone : (phone.length === 10 ? `+91${phone}` : phone);
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name || 'Baler Operator',
        email: data.email || `${phone}@balers.straw2cash.in`,
        phone: formattedPhone,
        password: password || 'baler123',
        role: 'BALER',
      }),
    });
    if (!res.ok) throw new Error('Go Baler Registration failed');
    const authData = await res.json();
    const token = authData.token;

    // Create Baler profile in Go backend
    try {
      await fetch(`${getBaseUrl()}/api/v1/balers/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: data.organizationName || `${data.name || 'Malwa'} Custom Hiring & Baling Center`,
          phone: formattedPhone,
          vehicle_details: `Tractor PTO High-Pressure Balers (${data.balerEquipmentCount || 2} units)`,
          service_area: `${data.location?.district || 'Moga'} and surrounding agricultural belt`,
          district: data.location?.district || 'Moga',
          state: data.location?.state || 'Punjab',
        }),
      });
    } catch (e) {
      console.warn('Go Baler profile creation warning:', e);
    }

    return this.mapGoAuthResponse(authData, data);
  },

  mapGoAuthResponse(authData: any, overrides?: Partial<UserProfile>): { user: UserProfile; token: string } {
    const u = authData.user || {};
    const user: UserProfile = {
      id: u.id || `user_baler_${Date.now()}`,
      name: u.name || overrides?.name || 'Baler Operator',
      email: u.email || `${u.phone}@balers.straw2cash.in`,
      phone: u.phone,
      role: 'baler',
      location: overrides?.location || {
        villageOrCity: 'Baghapurana',
        district: 'Moga',
        state: 'Punjab',
        pincode: '142038',
      },
      organizationName: overrides?.organizationName || 'Custom Hiring & Baling Center',
      balerEquipmentCount: overrides?.balerEquipmentCount || 2,
      createdAt: u.created_at || new Date().toISOString(),
    };
    return { user, token: authData.token };
  },

  // Profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Try to fetch from backend
      const data = await fetchGo(`/users/${userId}`);
      return data as any; // Map as needed
    } catch (e) {
      console.warn("Go backend getProfile failed, using mock", e);
      return users.find((u) => u.id === userId) || null;
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // Determine endpoint based on role if available
    const roleStr = updates.role?.toLowerCase() || 'farmer';
    let endpoint = `/${roleStr}s/profile`;
    if (roleStr === 'authority') endpoint = ''; // authority not in Go
    
    try {
      if (endpoint) {
        // Only sending a subset to avoid disallow unknown fields
        const payload = roleStr === 'farmer' ? {
           land_area_acres: updates.farmSizeAcres || 0.0
        } : {};
        
        await fetchGo(endpoint, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
    } catch(e) {
      console.warn("Go backend updateProfile failed", e);
    }

    users = users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    setStored(STORAGE_KEY_USERS, users);
    return users.find((u) => u.id === userId)!;
  },

  // Straw Listings
  async getListings(filters?: {
    cropType?: string;
    condition?: string;
    maxPrice?: number;
    district?: string;
    status?: ListingStatus;
  }): Promise<StrawListing[]> {
    try {
      const qs = filters?.status ? `?status=${filters.status.toUpperCase()}` : '';
      const data = await fetchGo(`/listings${qs}`);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          ...INITIAL_LISTINGS[0],
          id: d.id,
          quantityTons: (d.quantity_kg || 0) / 1000,
          pricePerTonExpected: (d.price_per_kg || 0) * 1000,
          status: (d.status?.toLowerCase() || 'available') as ListingStatus,
        }));
      }
      return [];
    } catch (e) {
      console.warn("Go backend getListings failed, using mock", e);
      let result = [...listings];
      if (filters?.status) result = result.filter((l) => l.status === filters.status);
      return result;
    }
  },

  async getListingById(id: string): Promise<StrawListing | null> {
    try {
      const data = await fetchGo(`/listings/${id}`);
      return {
        ...INITIAL_LISTINGS[0],
        id: data.id,
        quantityTons: (data.quantity_kg || 0) / 1000,
        pricePerTonExpected: (data.price_per_kg || 0) * 1000,
        status: (data.status?.toLowerCase() || 'available') as ListingStatus,
      };
    } catch(e) {
      return listings.find((l) => l.id === id) || null;
    }
  },

  async getMyListings(farmerId: string): Promise<StrawListing[]> {
    try {
      const data = await fetchGo(`/listings`);
      if (Array.isArray(data)) {
        return data.filter((d: any) => d.farmer_id === farmerId).map((d: any) => ({
          ...INITIAL_LISTINGS[0],
          id: d.id,
          farmerId: d.farmer_id,
          quantityTons: (d.quantity_kg || 0) / 1000,
          pricePerTonExpected: (d.price_per_kg || 0) * 1000,
          status: (d.status?.toLowerCase() || 'available') as ListingStatus,
        }));
      }
      return [];
    } catch(e) {
      return listings.filter((l) => l.farmerId === farmerId);
    }
  },

  async createListing(listingData: Omit<StrawListing, 'id' | 'createdAt'>): Promise<StrawListing> {
    try {
      const payload = {
        crop_type: "PADDY",
        quantity_kg: listingData.quantityTons * 1000,
        price_per_kg: listingData.pricePerTonExpected / 1000,
        moisture_percentage: listingData.moisturePercentage || 15.0,
        harvest_date: (listingData.availableDate || new Date().toISOString()).split('T')[0],
        available_from: (listingData.availableDate || new Date().toISOString()).split('T')[0],
        available_until: (listingData.expiryDate || new Date().toISOString()).split('T')[0],
        pickup_latitude: listingData.location.coordinates[0],
        pickup_longitude: listingData.location.coordinates[1]
      };
      const data = await fetchGo(`/listings`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const newListing = { ...listingData, id: data.id || `lst_${Date.now()}`, createdAt: new Date().toISOString(), estimatedFireRiskAvoidedCo2Tons: Math.round(listingData.quantityTons * 1.5 * 10) / 10 };
      listings = [newListing, ...listings];
      setStored(STORAGE_KEY_LISTINGS, listings);
      return newListing;
    } catch (e) {
      console.warn("Go backend createListing failed, falling back to mock", e);
      const newListing: StrawListing = {
        ...listingData,
        id: `lst_${Date.now()}`,
        createdAt: new Date().toISOString(),
        estimatedFireRiskAvoidedCo2Tons: Math.round(listingData.quantityTons * 1.5 * 10) / 10,
      };
      listings = [newListing, ...listings];
      setStored(STORAGE_KEY_LISTINGS, listings);
      return newListing;
    }
  },

  async updateListingStatus(id: string, status: ListingStatus): Promise<StrawListing> {
    try {
      const payload = { status: status.toUpperCase() };
      await fetchGo(`/listings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } catch(e) {
      console.warn("Go backend updateListingStatus failed", e);
    }
    listings = listings.map((l) => (l.id === id ? { ...l, status } : l));
    setStored(STORAGE_KEY_LISTINGS, listings);
    return listings.find((l) => l.id === id)!;
  },

  // Buyer Requirements
  async getRequirements(buyerId?: string): Promise<BuyerRequirement[]> {
    try {
      const data = await fetchGo(`/requirements`);
      if (Array.isArray(data)) {
        let reqs = data;
        if (buyerId) reqs = reqs.filter((r: any) => r.buyer_id === buyerId);
        return reqs.map((r: any) => ({
          ...INITIAL_REQUIREMENTS[0],
          id: r.id,
          requiredQuantityTons: (r.quantity_required_kg || 0) / 1000,
          maxPricePerTon: (r.max_price_per_kg || 0) * 1000,
          status: (r.status?.toLowerCase() || 'active') as RequirementStatus,
        }));
      }
      return [];
    } catch(e) {
      if (buyerId) return requirements.filter((r) => r.buyerId === buyerId);
      return [...requirements];
    }
  },

  async getRequirementById(id: string): Promise<BuyerRequirement | null> {
    try {
      const data = await fetchGo(`/requirements/${id}`);
      return {
        ...INITIAL_REQUIREMENTS[0],
        id: data.id,
        requiredQuantityTons: (data.quantity_required_kg || 0) / 1000,
        maxPricePerTon: (data.max_price_per_kg || 0) * 1000,
        status: (data.status?.toLowerCase() || 'active') as RequirementStatus,
      };
    } catch(e) {
      return requirements.find((r) => r.id === id) || null;
    }
  },

  async createRequirement(reqData: Omit<BuyerRequirement, 'id' | 'createdAt' | 'fulfilledQuantityTons'>): Promise<BuyerRequirement> {
    try {
      const payload = {
        crop_type: "PADDY",
        quantity_required_kg: reqData.requiredQuantityTons * 1000,
        max_price_per_kg: reqData.maxPricePerTon / 1000,
        preferred_radius_km: 50.0,
        required_from: (reqData.deliveryDeadline || new Date().toISOString()).split('T')[0],
        required_until: (reqData.deliveryDeadline || new Date().toISOString()).split('T')[0]
      };
      const data = await fetchGo(`/requirements`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const newReq: BuyerRequirement = { ...reqData, id: data.id || `req_${Date.now()}`, fulfilledQuantityTons: 0, createdAt: new Date().toISOString() };
      requirements = [newReq, ...requirements];
      setStored(STORAGE_KEY_REQUIREMENTS, requirements);
      return newReq;
    } catch(e) {
      const newReq: BuyerRequirement = {
        ...reqData,
        id: `req_${Date.now()}`,
        fulfilledQuantityTons: 0,
        createdAt: new Date().toISOString(),
      };
      requirements = [newReq, ...requirements];
      setStored(STORAGE_KEY_REQUIREMENTS, requirements);
      return newReq;
    }
  },

  async updateRequirementStatus(id: string, status: RequirementStatus): Promise<BuyerRequirement> {
    try {
      await fetchGo(`/requirements/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: status.toUpperCase() })
      });
    } catch(e) {}
    requirements = requirements.map((r) => (r.id === id ? { ...r, status } : r));
    setStored(STORAGE_KEY_REQUIREMENTS, requirements);
    return requirements.find((r) => r.id === id)!;
  },

  // Matching
  async getMatchesForFarmer(farmerId: string): Promise<StrawMatch[]> {
    // API contract doesn't expose a match list, so we'll fallback to mock
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
  }
};
