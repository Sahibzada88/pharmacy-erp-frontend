import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACCESS_KEY = "pharmacy_erp_access";
const REFRESH_KEY = "pharmacy_erp_refresh";

export const tokenStore = {
  getAccess: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY)),
  getRefresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  setAccess: (access: string) => localStorage.setItem(ACCESS_KEY, access),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void; config: InternalAxiosRequestConfig }[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
      resolve(api(config));
    }
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refresh = tokenStore.getRefresh();
      if (!refresh) {
        tokenStore.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
          refresh,
        });
        tokenStore.setAccess(data.access);
        flushQueue(null, data.access);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        tokenStore.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/** Extracts a friendly error string from our DRF custom exception envelope. */
export function apiErrorMessage(err: unknown): string {
  const fallback = "Something went wrong. Please try again.";
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data as any;
  if (!data) return err.message || fallback;
  const errors = data.errors ?? data;
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return errors.join(" ");
  if (typeof errors === "object") {
    const parts: string[] = [];
    for (const key of Object.keys(errors)) {
      const val = errors[key];
      parts.push(Array.isArray(val) ? `${key}: ${val.join(" ")}` : `${key}: ${val}`);
    }
    return parts.join(" · ") || fallback;
  }
  return fallback;
}
