import { BalerProfile, BalerJobOpportunity, BalerEquipment } from '../../types/baler';
import { INITIAL_BALER_PROFILE, INITIAL_BALER_JOBS } from '../mockData';

const STORAGE_KEY_BALER_PROFILE = 's2c_baler_profile';
const STORAGE_KEY_BALER_JOBS = 's2c_baler_jobs';

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

let profile: BalerProfile = getStored(STORAGE_KEY_BALER_PROFILE, INITIAL_BALER_PROFILE);
let jobs: BalerJobOpportunity[] = getStored(STORAGE_KEY_BALER_JOBS, INITIAL_BALER_JOBS);

export const balerServiceApi = {
  async getBalerProfile(userId?: string): Promise<BalerProfile> {
    return { ...profile };
  },

  async updateBalerProfile(updates: Partial<BalerProfile>): Promise<BalerProfile> {
    profile = { ...profile, ...updates };
    setStored(STORAGE_KEY_BALER_PROFILE, profile);
    return { ...profile };
  },

  async addEquipment(equipment: Omit<BalerEquipment, 'id'>): Promise<BalerEquipment> {
    const newEq: BalerEquipment = {
      ...equipment,
      id: `eq_${Date.now()}`,
    };
    profile.equipment = [...profile.equipment, newEq];
    setStored(STORAGE_KEY_BALER_PROFILE, profile);
    return newEq;
  },

  async updateEquipmentStatus(equipmentId: string, status: BalerEquipment['operationalStatus']): Promise<void> {
    profile.equipment = profile.equipment.map((eq) =>
      eq.id === equipmentId ? { ...eq, operationalStatus: status } : eq
    );
    setStored(STORAGE_KEY_BALER_PROFILE, profile);
  },

  async getBalerJobs(): Promise<BalerJobOpportunity[]> {
    return [...jobs];
  },

  async updateJobStatus(jobId: string, status: BalerJobOpportunity['status']): Promise<BalerJobOpportunity> {
    jobs = jobs.map((j) => (j.id === jobId ? { ...j, status } : j));
    setStored(STORAGE_KEY_BALER_JOBS, jobs);
    return jobs.find((j) => j.id === jobId)!;
  },
};
