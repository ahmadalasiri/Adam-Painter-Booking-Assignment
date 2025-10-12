import axios from "axios";
import type {
  AuthResponse,
  User,
  Availability,
  Booking,
  BookingResponse,
} from "../types";
import { isServerUnavailable } from "../utils/errorHandler";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if server is unavailable (network error, 5xx, timeout)
    if (isServerUnavailable(error)) {
      // Add user-friendly message for server unavailability
      error.userMessage =
        "Server is currently unavailable. Please try again later.";
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - only redirect on authenticated routes
    const isAuthRoute =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthRoute) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Pass through with original error for business logic errors (4xx)
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: "painter" | "customer";
  }): Promise<AuthResponse> =>
    api.post("/auth/register", data).then((res) => res.data),

  login: (data: { email: string; password: string }): Promise<AuthResponse> =>
    api.post("/auth/login", data).then((res) => res.data),

  getProfile: (): Promise<User> =>
    api.get("/auth/profile").then((res) => res.data),
};

// Availability API
export const availabilityAPI = {
  create: (data: {
    startTime: string;
    endTime: string;
  }): Promise<Availability> =>
    api.post("/availability", data).then((res) => res.data),

  getMyAvailability: (
    page: number = 1,
    limit: number = 5
  ): Promise<PaginatedResponse<Availability>> =>
    api
      .get("/availability/me", { params: { page, limit } })
      .then((res) => res.data),
};

// Booking API
export const bookingAPI = {
  createRequest: (data: {
    startTime: string;
    endTime: string;
  }): Promise<BookingResponse> =>
    api.post("/bookings", data).then((res) => res.data),

  getMyBookings: (
    page: number = 1,
    limit: number = 5
  ): Promise<PaginatedResponse<Booking>> =>
    api
      .get("/bookings/me", { params: { page, limit } })
      .then((res) => res.data),

  getAssignedBookings: (
    page: number = 1,
    limit: number = 5
  ): Promise<PaginatedResponse<Booking>> =>
    api
      .get("/bookings/assigned", { params: { page, limit } })
      .then((res) => res.data),
};

export default api;
