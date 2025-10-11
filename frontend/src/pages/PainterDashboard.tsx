import { useState, useEffect, useCallback } from "react";
import { format, isSameDay } from "date-fns";
import {
  availabilityAPI,
  PaginatedResponse,
} from "../services/api";
import { useToast } from "../context/ToastContext";
import { Pagination } from "../components/Pagination";
import type { Availability, Booking } from "../types";

// Helper function to format date range
const formatDateRange = (startDate: Date, endDate: Date): string => {
  if (isSameDay(startDate, endDate)) {
    return `${format(startDate, "PPP p")} → ${format(endDate, "p")}`;
  }
  return `${format(startDate, "PPP p")} → ${format(endDate, "PPP p")}`;
};

// Note: Bookings are now included directly in each availability object
// from the backend API (availability.bookings)

// Timeline component for visualizing availability and bookings
interface TimelineProps {
  availability: Availability;
  bookings: Booking[];
}

const AvailabilityTimeline = ({ availability, bookings }: TimelineProps) => {
  const slotStart = new Date(availability.startTime).getTime();
  const slotEnd = new Date(availability.endTime).getTime();
  const totalDuration = slotEnd - slotStart;

  // Calculate position and width for each booking
  const bookingSegments = bookings.map((booking) => {
    const bookingStart = Math.max(
      new Date(booking.startTime).getTime(),
      slotStart
    );
    const bookingEnd = Math.min(new Date(booking.endTime).getTime(), slotEnd);

    const leftPercent = ((bookingStart - slotStart) / totalDuration) * 100;
    const widthPercent = ((bookingEnd - bookingStart) / totalDuration) * 100;

    return {
      booking,
      left: leftPercent,
      width: widthPercent,
      startTime: new Date(booking.startTime),
      endTime: new Date(booking.endTime),
    };
  });

  // Calculate free (available) segments
  const calculateFreeSegments = () => {
    if (bookingSegments.length === 0) {
      return [
        {
          start: new Date(availability.startTime),
          end: new Date(availability.endTime),
          left: 0,
          width: 100,
        },
      ];
    }

    const freeSegments: Array<{
      start: Date;
      end: Date;
      left: number;
      width: number;
    }> = [];

    // Sort bookings by start time
    const sorted = [...bookingSegments].sort((a, b) => a.left - b.left);
    let currentPos = 0; // Current position in percentage

    for (const segment of sorted) {
      // If there's a gap before this booking
      if (currentPos < segment.left) {
        const gapStart = slotStart + (currentPos / 100) * totalDuration;
        const gapEnd = slotStart + (segment.left / 100) * totalDuration;

        freeSegments.push({
          start: new Date(gapStart),
          end: new Date(gapEnd),
          left: currentPos,
          width: segment.left - currentPos,
        });
      }

      // Move current position to after this booking
      currentPos = Math.max(currentPos, segment.left + segment.width);
    }

    // Add remaining free time after last booking
    if (currentPos < 100) {
      const gapStart = slotStart + (currentPos / 100) * totalDuration;
      const gapEnd = slotEnd;

      freeSegments.push({
        start: new Date(gapStart),
        end: new Date(gapEnd),
        left: currentPos,
        width: 100 - currentPos,
      });
    }

    return freeSegments;
  };

  const freeSegments = calculateFreeSegments();

  return (
    <div className="mt-3">
      <div className="relative h-8 bg-transparent rounded-lg overflow-hidden border border-green-300">
        {/* Free (available) segments with tooltips */}
        {freeSegments.map((segment, index) => (
          <div
            key={`free-${index}`}
            className="absolute top-0 h-full bg-green-100 group cursor-help transition-all hover:bg-green-200"
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}%`,
            }}
            title={`Available: ${formatDateRange(segment.start, segment.end)}`}
          >
            {/* Tooltip on hover */}
            <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-green-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
              <div className="font-semibold mb-1">✅ Available</div>
              <div className="text-green-100">
                {formatDateRange(segment.start, segment.end)}
              </div>
              <div className="text-xs mt-1 text-green-200">
                Duration:{" "}
                {Math.round(
                  (segment.end.getTime() - segment.start.getTime()) /
                    (1000 * 60 * 60)
                )}{" "}
                hours
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-green-700"></div>
            </div>
          </div>
        ))}

        {/* Booked segments overlay */}
        {bookingSegments.map((segment, index) => (
          <div
            key={segment.booking.id || index}
            className="absolute top-0 h-full bg-orange-400 border-l-2 border-r-2 border-orange-600 group cursor-help transition-all hover:bg-orange-500"
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}%`,
            }}
            title={`Booked: ${formatDateRange(
              segment.startTime,
              segment.endTime
            )} | Customer: ${segment.booking.customer?.name || "Unknown"}`}
          >
            {/* Tooltip on hover */}
            <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
              <div className="font-semibold mb-1">
                🔒 Booked by {segment.booking.customer?.name || "Unknown"}
              </div>
              <div className="text-gray-200">
                {formatDateRange(segment.startTime, segment.endTime)}
              </div>
              <div className="text-xs mt-1">
                <span className="text-gray-300">Email:</span>{" "}
                {segment.booking.customer?.email || "N/A"}
              </div>
              <div className="text-xs mt-0.5">
                <span
                  className={`px-2 py-0.5 rounded ${
                    segment.booking.status === "confirmed"
                      ? "bg-green-600 text-white"
                      : segment.booking.status === "completed"
                      ? "bg-blue-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {segment.booking.status}
                </span>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-400 border border-orange-600 rounded"></div>
          <span>Booked</span>
        </div>
        {bookingSegments.length > 0 && (
          <span className="ml-auto font-medium">
            {bookingSegments.length} booking
            {bookingSegments.length !== 1 ? "s" : ""} in this slot
          </span>
        )}
      </div>
    </div>
  );
};

export const PainterDashboard = () => {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useToast();

  // Pagination state (only for availability - bookings are included within)
  const [availabilityPage, setAvailabilityPage] = useState(1);
  const [availabilityTotalPages, setAvailabilityTotalPages] = useState(1);

  // Cache for paginated availability data
  const [availabilityCache, setAvailabilityCache] = useState<
    Map<number, Availability[]>
  >(new Map());

  // Form state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Get current time for min attribute (formatted for datetime-local input)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const fetchData = useCallback(
    async (showLoadingIndicator = true, forceRefresh = false) => {
      if (showLoadingIndicator) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        // Check cache for availability (now includes bookings)
        const availabilityCached = availabilityCache.get(availabilityPage);
        let availabilityResponse: PaginatedResponse<Availability> | undefined;

        if (availabilityCached && !forceRefresh) {
          // Use cached data
          setAvailability(availabilityCached);
        } else {
          // Fetch from API (includes nested bookings for each availability)
          availabilityResponse = await availabilityAPI.getMyAvailability(
            availabilityPage
          );
          setAvailability(availabilityResponse.data);
          setAvailabilityTotalPages(availabilityResponse.meta.totalPages);
          // Update cache
          setAvailabilityCache((prev) =>
            new Map(prev).set(availabilityPage, availabilityResponse!.data)
          );
        }
      } catch (err: any) {
        showError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showError, availabilityPage, availabilityCache]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    // Clear cache and force refresh
    setAvailabilityCache(new Map());
    fetchData(false, true);
    showSuccess("Data refreshed!", 2000);
  };

  // Validate time inputs
  const validateTimes = useCallback(() => {
    if (!startTime || !endTime) {
      setValidationError("");
      return false;
    }

    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start <= now) {
      setValidationError("⚠️ Start time must be in the future");
      return false;
    }

    if (end <= now) {
      setValidationError("⚠️ End time must be in the future");
      return false;
    }

    if (end <= start) {
      setValidationError("⚠️ End time must be after start time");
      return false;
    }

    setValidationError("");
    return true;
  }, [startTime, endTime]);

  // Validate whenever times change
  useEffect(() => {
    if (startTime || endTime) {
      validateTimes();
    }
  }, [startTime, endTime, validateTimes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting
    if (!validateTimes()) {
      showError(validationError || "Please fix the validation errors");
      return;
    }

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
      setValidationError("");

      // Clear cache and fetch updated data
      setAvailabilityCache(new Map());
      setTimeout(() => fetchData(false, true), 500);
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
            <div className="space-y-4">
              {availability.map((slot) => {
                // Bookings are now included in the slot object from the API
                const slotBookings = slot.bookings || [];
                const startDate = new Date(slot.startTime);
                const endDate = new Date(slot.endTime);
                const durationHours = Math.round(
                  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
                );

                return (
                  <div
                    key={slot.id}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-lg">
                          📅 {formatDateRange(startDate, endDate)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          ⏱️ Duration: {durationHours} hour
                          {durationHours !== 1 ? "s" : ""}
                          {slotBookings.length > 0 && (
                            <span className="ml-3 text-orange-600 font-medium">
                              • {slotBookings.length} booking
                              {slotBookings.length !== 1 ? "s" : ""} in this
                              period
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium shadow-sm">
                        Available
                      </div>
                    </div>

                    {/* Visual Timeline */}
                    <AvailabilityTimeline
                      availability={slot}
                      bookings={slotBookings}
                    />

                    {/* Bookings List - Always Visible */}
                    {slotBookings.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path
                              fillRule="evenodd"
                              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Bookings in this period ({slotBookings.length})
                        </h3>
                        <div className="space-y-2">
                          {slotBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition"
                            >
                              <div className="flex justify-between items-start gap-3">
                                {/* Customer Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg
                                      className="w-4 h-4 text-gray-500 flex-shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <p className="font-semibold text-gray-800 truncate">
                                      {booking.customer?.name || "Unknown"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <svg
                                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    <p className="text-sm text-gray-600 truncate">
                                      {booking.customer?.email || "N/A"}
                                    </p>
                                  </div>
                                  {/* Booking Time */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg
                                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <p className="text-sm text-gray-700 font-medium">
                                      {formatDateRange(
                                        new Date(booking.startTime),
                                        new Date(booking.endTime)
                                      )}
                                    </p>
                                  </div>
                                  {/* Booked Date */}
                                  <p className="text-xs text-gray-500 ml-6">
                                    Booked on:{" "}
                                    {format(
                                      new Date(booking.createdAt),
                                      "PPP 'at' p"
                                    )}
                                  </p>
                                </div>

                                {/* Status Badge */}
                                <div className="flex-shrink-0">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                      booking.status === "confirmed"
                                        ? "bg-green-100 text-green-700"
                                        : booking.status === "completed"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination for Availability */}
          <Pagination
            currentPage={availabilityPage}
            totalPages={availabilityTotalPages}
            onPageChange={setAvailabilityPage}
          />
        </div>

      </div>
    </div>
  );
};
