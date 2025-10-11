import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { availabilityAPI, bookingAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Availability, Booking } from "../types";

export const PainterDashboard = () => {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useToast();

  // Form state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(
    async (showLoadingIndicator = true) => {
      if (showLoadingIndicator) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [availabilityData, bookingsData] = await Promise.all([
          availabilityAPI.getMyAvailability(),
          bookingAPI.getAssignedBookings(),
        ]);
        setAvailability(availabilityData);
        setBookings(bookingsData);
      } catch (err: any) {
        showError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(false);
    showSuccess("Data refreshed!", 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newAvailability = await availabilityAPI.create({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      // Optimistic update - add to list immediately
      setAvailability((prev) => [...prev, newAvailability]);

      showSuccess("✓ Availability added successfully!", 4000);

      // Clear form
      setStartTime("");
      setEndTime("");

      // Fetch updated data in background
      setTimeout(() => fetchData(false), 500);
    } catch (err: any) {
      showError(
        err.response?.data?.message ||
          "Failed to add availability. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Painter Dashboard
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            title="Refresh data"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Add Availability Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Add Availability
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  End Time
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {submitting ? "Adding..." : "Add Availability"}
            </button>
          </form>
        </div>

        {/* My Availability */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            My Availability
          </h2>

          {availability.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-600 text-lg mb-2">
                No availability slots yet
              </p>
              <p className="text-gray-500 text-sm">
                Add your first availability slot above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availability.map((slot) => (
                <div
                  key={slot.id}
                  className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {format(new Date(slot.startTime), "PPP p")} →{" "}
                      {format(new Date(slot.endTime), "p")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration:{" "}
                      {Math.round(
                        (new Date(slot.endTime).getTime() -
                          new Date(slot.startTime).getTime()) /
                          (1000 * 60 * 60)
                      )}{" "}
                      hours
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Available
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Bookings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Assigned Bookings
            </h2>
            {bookings.length > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-600 text-lg mb-2">No bookings yet</p>
              <p className="text-gray-500 text-sm">
                Add availability and customers will be able to book you!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800">
                        👤 {booking.customer?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ✉️ {booking.customer?.email}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium mt-2">
                    📅 {format(new Date(booking.startTime), "PPP p")} →{" "}
                    {format(new Date(booking.endTime), "p")}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Booked on: {format(new Date(booking.createdAt), "PPP")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
