import { useState, useEffect, useCallback } from "react";
import { format, isSameDay } from "date-fns";
import { availabilityAPI, bookingAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Availability, Booking } from "../types";

// Helper function to format date range
const formatDateRange = (startDate: Date, endDate: Date): string => {
  if (isSameDay(startDate, endDate)) {
    return `${format(startDate, "PPP p")} → ${format(endDate, "p")}`;
  }
  return `${format(startDate, "PPP p")} → ${format(endDate, "PPP p")}`;
};

// Helper to find bookings within an availability slot
const getBookingsForAvailability = (
  availability: Availability,
  allBookings: Booking[]
): Booking[] => {
  const slotStart = new Date(availability.startTime).getTime();
  const slotEnd = new Date(availability.endTime).getTime();

  return allBookings.filter((booking) => {
    const bookingStart = new Date(booking.startTime).getTime();
    const bookingEnd = new Date(booking.endTime).getTime();

    // Check if booking overlaps with availability
    return bookingStart < slotEnd && bookingEnd > slotStart;
  });
};

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

  return (
    <div className="mt-3">
      <div className="relative h-8 bg-green-100 rounded-lg overflow-hidden border border-green-300">
        {/* Available background - already set as bg-green-100 */}

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
              <div>{formatDateRange(segment.startTime, segment.endTime)}</div>
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useToast();

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
                const slotBookings = getBookingsForAvailability(slot, bookings);
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
                  </div>
                );
              })}
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
                    📅{" "}
                    {formatDateRange(
                      new Date(booking.startTime),
                      new Date(booking.endTime)
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Booked on:{" "}
                    {format(new Date(booking.createdAt), "PPP 'at' p")}
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
