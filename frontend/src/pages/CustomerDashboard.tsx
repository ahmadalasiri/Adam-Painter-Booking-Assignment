import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { bookingAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/Pagination";
import { getErrorMessage } from "../utils/errorHandler";
import {
  formatDateRange,
  formatDuration,
  getMinDateTime,
} from "../utils/dateUtils";
import { useTimeValidation } from "../hooks/useTimeValidation";
import type { Booking, AvailabilityRecommendation } from "../types";

export const CustomerDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<
    AvailabilityRecommendation[]
  >([]);
  const { showSuccess, showError, showWarning } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cache for paginated data
  const [bookingsCache, setBookingsCache] = useState<Map<number, Booking[]>>(
    new Map()
  );

  // Form state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Time validation hook
  const { validationError, validateTimes } = useTimeValidation(
    startTime,
    endTime
  );

  const fetchBookings = useCallback(
    async (showLoadingIndicator = true, forceRefresh = false) => {
      if (showLoadingIndicator) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        // Check cache first
        const cachedData = bookingsCache.get(currentPage);

        if (cachedData && !forceRefresh) {
          // Use cached data
          setBookings(cachedData);
        } else {
          // Fetch from API
          const bookingsResponse = await bookingAPI.getMyBookings(currentPage);
          setBookings(bookingsResponse.data);
          setTotalPages(bookingsResponse.meta.totalPages);
          // Update cache
          setBookingsCache((prev) =>
            new Map(prev).set(currentPage, bookingsResponse.data)
          );
        }
      } catch (err: any) {
        showError(
          getErrorMessage(err, "Failed to load bookings. Please try again.")
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showError, currentPage]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefresh = () => {
    // Clear cache and force refresh
    setBookingsCache(new Map());
    fetchBookings(false, true);
    showSuccess("Bookings refreshed!", 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting
    if (!validateTimes()) {
      showError(validationError || "Please fix the validation errors");
      return;
    }

    setRecommendations([]);
    setSubmitting(true);

    try {
      const response = await bookingAPI.createRequest({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      // Create booking object from response
      const newBooking: Booking = {
        id: response.bookingId,
        painter: response.painter,
        startTime: response.startTime,
        endTime: response.endTime,
        status: response.status,
        createdAt: new Date().toISOString(),
      };

      showSuccess(
        `🎉 Booking confirmed! Assigned painter: ${response.painter.name}`,
        6000
      );

      // Clear form
      setStartTime("");
      setEndTime("");

      // Smart cache handling based on current page
      if (currentPage === 1) {
        // On page 1: Add optimistically to current view (sorted by newest first)
        setBookings((prev) => [newBooking, ...prev].slice(0, 5));
        // Update page 1 cache with new item
        setBookingsCache((prev) => {
          const newCache = new Map(prev);
          const page1Data = [newBooking, ...(prev.get(1) || [])].slice(0, 5);
          newCache.set(1, page1Data);
          return newCache;
        });
      } else {
        // On page 2+: Navigate to page 1 to show the new booking
        setCurrentPage(1);
        // Invalidate page 1 cache so it refetches with the new booking
        setBookingsCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(1);
          return newCache;
        });
      }
    } catch (err: any) {
      // Check if this is a business logic error with recommendations
      if (err.response?.data?.recommendations) {
        const recs = err.response.data.recommendations;
        setRecommendations(recs);
        showWarning(
          err.response.data.error ||
            "No painters available for this time slot.",
          8000
        );
      } else {
        // Use error handler for all other errors (including server unavailability)
        showError(
          getErrorMessage(err, "Failed to create booking. Please try again.")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Customer Dashboard
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            title="Refresh bookings"
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

        {/* Request Booking Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Request a Booking
          </h2>

          {recommendations.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-medium text-yellow-800 mb-2">
                💡 Closest Available Time Slots:
              </p>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded border border-yellow-300 hover:border-yellow-400 transition cursor-pointer"
                    onClick={() => {
                      setStartTime(
                        format(new Date(rec.startTime), "yyyy-MM-dd'T'HH:mm")
                      );
                      setEndTime(
                        format(new Date(rec.endTime), "yyyy-MM-dd'T'HH:mm")
                      );
                      setRecommendations([]);
                      showSuccess(
                        "Time slot selected! Click 'Request Booking' to confirm.",
                        3000
                      );
                    }}
                  >
                    <p className="font-medium text-gray-800">
                      🎨 {rec.painterName}
                    </p>
                    <p className="text-sm text-gray-600">
                      📅{" "}
                      {formatDateRange(
                        new Date(rec.startTime),
                        new Date(rec.endTime)
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ⏱️ Duration:{" "}
                      {formatDuration(
                        new Date(rec.startTime),
                        new Date(rec.endTime)
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  min={getMinDateTime()}
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
                  min={startTime || getMinDateTime()}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{validationError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting || !!validationError || !startTime || !endTime
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {submitting ? "Requesting..." : "Request Booking"}
            </button>
          </form>
        </div>

        {/* My Bookings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Bookings</h2>

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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 text-lg mb-2">No bookings yet</p>
              <p className="text-gray-500 text-sm">
                Request a booking above to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800">
                        🎨 Painter: {booking.painter?.name || "Assigned"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Booking ID: {booking.id.substring(0, 8)}...
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : booking.status === "completed"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    📅{" "}
                    {formatDateRange(
                      new Date(booking.startTime),
                      new Date(booking.endTime)
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    ⏱️ Duration:{" "}
                    {formatDuration(
                      new Date(booking.startTime),
                      new Date(booking.endTime)
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Booked on:{" "}
                    {format(new Date(booking.createdAt), "MMMM do 'at' p")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};
