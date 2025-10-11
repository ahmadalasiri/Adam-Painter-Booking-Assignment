export interface User {
  id: string;
  email: string;
  name: string;
  role: "painter" | "customer";
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Availability {
  id: string;
  painterId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  bookings?: Booking[]; // Optional: populated in painter's "My Availability" view
}

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "completed" | "cancelled";
  createdAt: string;
  painter?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BookingResponse {
  bookingId: string;
  painter: {
    id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  status: "confirmed" | "completed" | "cancelled";
}

export interface AvailabilityRecommendation {
  painterId: string;
  painterName: string;
  startTime: string;
  endTime: string;
}
