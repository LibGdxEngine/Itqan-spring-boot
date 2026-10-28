import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearTokens, getValidAccessToken, refreshAccessToken } from "./token-store";

// Base API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Request interceptor - add auth token (refreshed first if it is about to expire)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined" && !config.url?.startsWith("/api/auth/")) {
      const token = await getValidAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Response interceptor - on 401 try one silent refresh, otherwise end the session
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthCall = config?.url?.startsWith("/api/auth/");

    if (error.response?.status === 401 && typeof window !== "undefined" && !isAuthCall) {
      if (config && !config._retried) {
        config._retried = true;
        const token = await refreshAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        }
      }
      clearTokens();
      // Don't redirect if already on auth pages
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Types for API error responses
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string>;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "object" && data !== null) {
      if ("message" in data) return data.message as string;
      if ("error" in data) return data.error as string;
    }
    if (error.response?.status === 401) {
      return "Invalid credentials. Please try again.";
    }
    if (error.response?.status === 409) {
      return "This email is already registered.";
    }
    if (error.response?.status === 400) {
      return "Invalid request. Please check your input.";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

export default api;
