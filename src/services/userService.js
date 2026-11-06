import api from "./api";
import { API_CONFIG } from "../config/api.config";

export const userService = {
  /**
   * Upload profile photo
   * @param {File} file - Image file to upload
   * @returns {Promise} API response with photo URL
   */
  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append("profilePhoto", file);

    const response = await api.post(
      API_CONFIG.ENDPOINTS.USERS.UPLOAD_PHOTO,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data including role, company, headline, etc.
   * @returns {Promise} API response
   */
  updateProfile: async (profileData) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.USERS.UPDATE_PROFILE,
      profileData
    );
    return response.data;
  },

  editProfile: async (updatedData) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.USERS.EDIT_PROFILE,
      updatedData
    );
    return response.data;
  },

  upload_resume: async (file) => {
    const formData = new FormData();
    formData.append("resume", file);
    
    const response = await api.post(
      API_CONFIG.ENDPOINTS.PROFILE.UPLOAD_RESUME,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data;
    
  },

  /**
   * Delete user's resume
   * @returns {Promise} API response
   */
  delete_resume: async () => {
    const response = await api.delete(
      API_CONFIG.ENDPOINTS.PROFILE.DELETE_RESUME
    );
    return response.data;
  },

  /**
   * Fetch the user's own resume as a blob for in-browser viewing.
   * Direct /uploads/resumes access is blocked server-side (private docs),
   * so viewing requires this authenticated endpoint.
   * @returns {Promise<Blob>} resume file blob
   */
  view_resume: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.PROFILE.VIEW_RESUME, {
      responseType: "blob",
      headers: {
        Accept:
          "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
    return response.data;
  },

  /**
   * Get extended profile details including qualifications, job preferences, and resume
   * @returns {Promise} API response with user and profileDetails
   */
  getProfileDetails: async () => {
    const response = await api.get(
      API_CONFIG.ENDPOINTS.PROFILE.GET_PROFILE_DETAILS
    );
    return response.data;
  },

  /**
   * Update qualifications (work experience, education, skills, licenses, certifications, languages)
   * This uses POST method and REPLACES all qualifications arrays on the backend
   * @param {Object} qualificationsData - Object containing qualification arrays
   * @returns {Promise} API response
   */
  updateQualifications: async (qualificationsData) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.PROFILE.UPDATE_QUALIFICATIONS,
      qualificationsData
    );
    return response.data;
  },

  /**
   * Update job preferences (job titles, types, schedules, pay)
   * This uses POST method and updates all job preferences
   * @param {Object} jobPreferencesData - Object containing job preferences
   * @returns {Promise} API response
   */
  updateJobPreferences: async (jobPreferencesData) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.PROFILE.UPDATE_JOB_PREFERENCES,
      jobPreferencesData
    );
    return response.data;
  },

};

