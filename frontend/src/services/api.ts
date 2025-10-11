import axios from "axios";
import type {
  AuthResponse,
  User,
  Availability,
  Booking,
  BookingResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
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
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
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

  getMyAvailability: (): Promise<Availability[]> =>
    api.get("/availability/me").then((res) => res.data),
};

// Booking API
export const bookingAPI = {
  createRequest: (data: {
    startTime: string;
    endTime: string;
  }): Promise<BookingResponse> =>
    api.post("/booking-request", data).then((res) => res.data),

  getMyBookings: (): Promise<Booking[]> =>
    api.get("/bookings/me").then((res) => res.data),

  getAssignedBookings: (): Promise<Booking[]> =>
    api.get("/bookings/assigned").then((res) => res.data),
};

export default api;
