import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for validating time inputs
 * Ensures start and end times are in the future and properly ordered
 */
export const useTimeValidation = (startTime: string, endTime: string) => {
  const [validationError, setValidationError] = useState("");

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

  return { validationError, validateTimes };
};
