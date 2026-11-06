import api from "./api";
import { API_CONFIG } from "../config/api.config";

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} API response with tempToken
   */
  register: async (userData) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      userData
    );
    return response.data;
  },

  /**
   * Verify OTP
   * @param {string} otp - 6-digit OTP code
   * @param {string} tempToken - Temporary token from registration
   * @returns {Promise} API response with access and refresh tokens
   */
  verifyOtp: async (otp, tempToken) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP,
      { otp },
      {
        headers: {
          "x-temp-token": tempToken,
        },
      }
    );
    
    // Store tokens if OTP verification successful
    if (response.data?.data?.tokens?.accessToken) {
      localStorage.setItem("accessToken", response.data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", response.data.data.tokens.refreshToken);
    }
    
    return response.data;
  },

  /**
   * Resend OTP
   * @param {string} tempToken - Temporary token from registration (optional)
   * @param {string} email - User's email (optional, used if no tempToken or token expired)
   * @returns {Promise} API response with new tempToken
   */
  resendOtp: async (tempToken, email) => {
    const requestBody = {};
    const headers = {
      "Content-Type": "application/json",
    };

    // If tempToken is available, send it in header
    if (tempToken) {
      headers["x-temp-token"] = tempToken;
    }

    // If email is provided, send it in body (fallback if token expired/unavailable)
    if (email) {
      requestBody.email = email;
    }

    const response = await api.post(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_OTP,
      requestBody,
      { headers }
    );
    
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise} API response with tokens
   */
  login: async (credentials) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
    
    // Store tokens if login successful
    // if (response.data?.data?.tokens?.accessToken) {
    //   localStorage.setItem("accessToken", response.data.data.tokens.accessToken);
    //   localStorage.setItem("refreshToken", response.data.data.tokens.refreshToken);
    // }
    
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise} API response
   */
  logout: async () => {
    try {
      await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  /**
   * Get current user
   * @returns {Promise} API response with user data
   */
  getCurrentUser: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);
    return response.data;
  },

  /**
   * Forgot password - Send OTP to email
   * @param {string} email - User's email
   * @returns {Promise} API response with tempToken
   */
  forgotPassword: async (email) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email,
    });
    return response.data;
  },

  /**
   * Verify reset OTP
   * @param {string} otp - 6-digit OTP code
   * @param {string} tempToken - Temporary token from forgot password
   * @returns {Promise} API response with new tempToken for password reset
   */
  verifyResetOtp: async (otp, tempToken) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_RESET_OTP,
      { otp },
      {
        headers: {
          "x-temp-token": tempToken,
        },
      }
    );
    return response.data;
  },

  /**
   * Reset password
   * @param {string} newPassword - New password
   * @param {string} tempToken - Temporary token from OTP verification
   * @returns {Promise} API response
   */
  resetPassword: async (newPassword, tempToken) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
      { newPassword },
      {
        headers: {
          "x-temp-token": tempToken,
        },
      }
    );
    return response.data;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} API response with new tokens
   */
  refreshToken: async (refreshToken) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    // Store new tokens
    if (response.data?.data?.accessToken) {
      localStorage.setItem("accessToken", response.data.data.accessToken);
      localStorage.setItem("refreshToken", response.data.data.refreshToken);
    }

    return response.data;
  },
};
