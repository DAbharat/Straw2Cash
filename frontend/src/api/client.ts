import axios, { AxiosInstance } from 'axios';

export const JAVA_API_BASE = import.meta.env.VITE_JAVA_API || 'http://localhost:8080';
export const GO_API_BASE = import.meta.env.VITE_GO_API || 'http://localhost:8000';
export const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API || 'http://localhost:8001';

export const TOKEN_STORAGE_KEY = 'straw2cash_token';

// Create configured axios instances for the 3 backend services
function createServiceClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach JWT Bearer token on every request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401 unauthenticated & 403 forbidden
  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Only redirect to login if not already there
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(err);
    }
  );

  return instance;
}

export const javaClient = createServiceClient(JAVA_API_BASE);
export const goClient = createServiceClient(GO_API_BASE);
export const pythonClient = createServiceClient(PYTHON_API_BASE);

// Error normalizer as specified in Section 8 of the Developer Guide
export function normalizeError(err: any): string {
  const data = err?.response?.data;
  if (!data) return err?.message || 'Network error — please check connection or service status';

  // Java envelope format: { error: "PRICING_ERROR", message: "..." }
  if (typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.message || data.error;
  }

  // Go domain format: { error: { code: "RESOURCE_NOT_FOUND", message: "farmer profile not found" } }
  if (typeof data === 'object' && data.error && typeof data.error === 'object') {
    return data.error.message || data.error.code;
  }

  // Go simple format: { error: "invalid request body" }
  if (typeof data === 'object' && typeof data.error === 'string') {
    return data.error;
  }

  // Python FastAPI default: { detail: "Error message" }
  if (typeof data === 'object' && 'detail' in data) {
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    }
    return String(data.detail);
  }

  // Go raw text format (e.g. 401 "token expired")
  if (typeof data === 'string') {
    return data;
  }

  return 'Something went wrong';
}
