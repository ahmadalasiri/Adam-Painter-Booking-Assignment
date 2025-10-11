/**
 * Error Handler Utility
 * Provides centralized error handling to distinguish between
 * server unavailability and business logic errors
 */

/**
 * Detects if the error is due to server unavailability
 * @param error - Axios error object
 * @returns true if server is unavailable/unreachable
 */
export function isServerUnavailable(error: any): boolean {
  // No response = network error, server down, or unreachable
  if (!error.response) {
    return true;
  }

  // 5xx status codes = server errors
  const status = error.response.status;
  if (status >= 500 && status < 600) {
    return true;
  }

  // Check for specific error codes
  if (
    error.code === "ECONNABORTED" || // Timeout
    error.code === "ERR_NETWORK" || // Network error
    error.code === "ETIMEDOUT" || // Connection timeout
    error.code === "ECONNREFUSED" // Connection refused
  ) {
    return true;
  }

  return false;
}

/**
 * Gets a user-friendly error message
 * @param error - Axios error object
 * @param fallbackMessage - Default message for unexpected errors
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: any,
  fallbackMessage: string = "An unexpected error occurred"
): string {
  // Server unavailable - show consistent message
  if (isServerUnavailable(error)) {
    return "Server is currently unavailable. Please try again later.";
  }

  // Business logic errors (4xx) - preserve original message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Fallback message
  return fallbackMessage;
}

/**
 * Checks if error is a validation error (400)
 */
export function isValidationError(error: any): boolean {
  return error.response?.status === 400;
}

/**
 * Checks if error is an authentication error (401)
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401;
}

/**
 * Checks if error is a forbidden error (403)
 */
export function isForbiddenError(error: any): boolean {
  return error.response?.status === 403;
}

