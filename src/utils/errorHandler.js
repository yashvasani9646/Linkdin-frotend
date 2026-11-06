import { toast } from "react-toastify";

const STATUS_MESSAGES = {
  400: "Please check the information you entered and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "We could not find what you were looking for.",
  409: "That action conflicts with the current state. Please refresh and try again.",
  422: "Some of the information provided is not valid. Please review it and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "The server could not complete the request. Please try again.",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The request took too long. Please try again.",
};

/**
 * Extracts a user-friendly error message from backend API error responses.
 *
 * Supported formats:
 * - AppError: { success: false, error: { message: "...", code: "...", errors: [...] } }
 * - Validation: { error: { errors: [{ msg: "...", path: "..." }] } }
 * - Standard: { success: false, message: "..." }
 * - Network / Axios: error.message
 *
 * @param {any} error - The caught error object
 * @param {string} [defaultMessage="An unexpected error occurred"] - Fallback message
 * @returns {string} Clean error message string
 */
export const getErrorMessage = (error, defaultMessage = "An unexpected error occurred") => {
  if (!error) return defaultMessage;

  if (typeof error === "string") return error;

  const data = error.response?.data;

  // 1. AppError standard structure: error.response.data.error.message
  if (data?.error?.message && typeof data.error.message === "string") {
    return data.error.message;
  }

  // 2. Validation errors array inside error object
  if (Array.isArray(data?.error?.errors) && data.error.errors.length > 0) {
    const firstMsg = data.error.errors[0]?.msg || data.error.errors[0]?.message;
    if (firstMsg) return firstMsg;
  }

  // 3. Direct errors array: error.response.data.errors
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const firstMsg = data.errors[0]?.msg || data.errors[0]?.message;
    if (firstMsg) return firstMsg;
  }

  // 4. Fallback backend message: error.response.data.message
  if (data?.message && typeof data.message === "string") {
    return data.message;
  }

  // 5. Network errors, timeouts, cancellation, and common HTTP failures
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return "Network error. Please check your internet connection and try again.";
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "The request took too long. Please try again.";
  }
  if (error.code === "ERR_CANCELED") {
    return "The request was cancelled.";
  }

  const status = error.response?.status;
  if (STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  if (error instanceof Error && error.message) {
    const unsafeAxiosMessage = /^Request failed with status code \d{3}$/i.test(
      error.message
    );
    if (!unsafeAxiosMessage) {
      return error.message;
    }
  }

  return defaultMessage;
};

/**
 * Displays a toast notification with the properly extracted error message.
 *
 * @param {any} error - The caught error object
 * @param {string} [defaultMessage] - Fallback message
 * @returns {string} The error message displayed
 */
export const showErrorToast = (error, defaultMessage) => {
  const message = getErrorMessage(error, defaultMessage);
  toast.error(message);
  return message;
};

export default {
  getErrorMessage,
  showErrorToast,
};
