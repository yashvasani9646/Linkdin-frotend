import axios from "axios";
import { API_CONFIG } from "../config/api.config";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;
let isRedirectingToSignIn = false;

const clearAuthAndRedirect = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  if (isRedirectingToSignIn) return;

  const pathname = window.location.pathname;
  if (pathname.startsWith("/auth/signin") || pathname.startsWith("/signin")) {
    return;
  }

  isRedirectingToSignIn = true;
  window.location.assign("/auth/signin");
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only attempt token refresh for authenticated endpoints (not login/signup)
    // Don't redirect on login failures
    const isAuthEndpoint =
      originalRequest.url?.includes("/login") ||
      originalRequest.url?.includes("/register") ||
      originalRequest.url?.includes("/verifyOtp") ||
      originalRequest.url?.includes("/resendOtp") ||
      originalRequest.url?.includes("/forgot-password") ||
      originalRequest.url?.includes("/verify-reset-otp") ||
      originalRequest.url?.includes("/reset-password") ||
      originalRequest.url?.includes("/refresh-token") ||
      originalRequest.url?.includes("/logout");

    // Handle token refresh on 401 only for authenticated requests
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              }
            )
            .then((response) => {
              const { accessToken, refreshToken: newRefreshToken } =
                response.data.data;
              localStorage.setItem("accessToken", accessToken);
              if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
              }
              return accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    // Normalize error message so frontend callers get the proper message
    if (error.response?.data) {
      const data = error.response.data;
      const extractedMessage =
        data.error?.message ||
        (Array.isArray(data.error?.errors) && data.error.errors[0]?.msg) ||
        (Array.isArray(data.errors) && data.errors[0]?.msg) ||
        data.message;

      if (extractedMessage) {
        if (!data.message) {
          data.message = extractedMessage;
        }
        error.userMessage = extractedMessage;
      }
    }

    if (!error.userMessage) {
      error.userMessage = error.message || "An unexpected error occurred";
    }

    return Promise.reject(error);
  }
);

export default api;
