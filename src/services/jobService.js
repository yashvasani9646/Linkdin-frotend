import api from "./api";
import { API_CONFIG } from "../config/api.config";

export const jobService = {
  createJob: async (jobData) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.JOBS.CREATE, jobData);
    return response.data;
  },

  getMyJobs: async (params = {}) => {
    const { page = 1, limit = 10, status = "all" } = params;
    const response = await api.get(API_CONFIG.ENDPOINTS.JOBS.MY_JOBS, {
      params: { page, limit, status }
    });
    return response.data;
  },

  getAllJobs: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });

    // Ensure q and where are passed
    if (params.q) cleanParams.q = params.q;
    if (params.where) cleanParams.where = params.where;

    const response = await api.get(API_CONFIG.ENDPOINTS.JOBS.LIST, {
      params: cleanParams
    });
    return response.data;
  },

  // Toggle save/unsave job
  toggleSaveJob: async (jobId) => {
    const response = await api.post(`${API_CONFIG.ENDPOINTS.JOBS.SAVE}/${jobId}/save`);
    return response.data;
  },

  getSavedJobs: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.JOBS.DISPLAY_SAVED);
    return response.data;
  },

  /**
   * Get job details by ID
   * @param {string} jobId - MongoDB ObjectId of the job
   * @returns {Promise} API response with job details
   */
  getJobDetails: async (jobId) => {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.JOBS.DETAILS}/${jobId}`);
    return response.data;
  },

  /**
   * Apply for a job
   * @param {string} jobId - MongoDB ObjectId of the job
   * @param {Object} applicationData - Application data with resumeUrl, resumeFileName, coverLetter
   * @returns {Promise} API response
   */
  applyForJob: async (jobId, applicationData) => {
    const response = await api.post(
      `${API_CONFIG.ENDPOINTS.APPLICATIONS.APPLY}/${jobId}`,
      applicationData
    );
    return response.data;
  },

  /**
   * Get user's job applications (jobs they have applied to)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.status - Filter by status: all, New, Shortlisted, Interviewed, Rejected, Accepted
   * @returns {Promise} API response with applications list and pagination
   */
  getMyApplications: async (params = {}) => {
    const { page = 1, limit = 10, status = "all" } = params;
    const response = await api.get(API_CONFIG.ENDPOINTS.APPLICATIONS.MY_APPLICATIONS, {
      params: { page, limit, status }
    });
    return response.data;
  },

  /**
   * Get applicants for a specific job (for employers/job posters)
   * @param {string} jobId - MongoDB ObjectId of the job
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.status - Filter by status: all, New, Shortlisted, Interviewed, Rejected, Accepted
   * @returns {Promise} API response with applicants list, job info, and pagination
   */
  getJobApplicants: async (jobId, params = {}) => {
    const { page = 1, limit = 10, status = "all" } = params;
    const response = await api.get(
      `${API_CONFIG.ENDPOINTS.APPLICATIONS.JOB_APPLICANTS}/${jobId}/applicants`,
      { params: { page, limit, status } }
    );
    return response.data;
  },

  /**
   * Update application status (for employers/job posters)
   * @param {string} applicationId - MongoDB ObjectId of the application
   * @param {string} status - New status: New, Shortlisted, Interviewed, Accepted, Rejected
   * @returns {Promise} API response with updated application info
   */
  updateApplicationStatus: async (applicationId, status) => {
    const response = await api.put(
      `${API_CONFIG.ENDPOINTS.APPLICATIONS.UPDATE_STATUS}/${applicationId}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Download applicant's resume (for employers/job posters only)
   * @param {string} applicationId - MongoDB ObjectId of the application
   * @returns {Promise} Downloads the resume file
   */
  downloadResume: async (applicationId) => {
    const response = await api.get(
      `${API_CONFIG.ENDPOINTS.APPLICATIONS.DOWNLOAD_RESUME}/${applicationId}/resume/download`,
      {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      }
    );
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'resume.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/"/g, '');
      }
    }
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
  },

  /**
   * Fetch an applicant's resume as a blob for in-browser viewing.
   * Uses the same authenticated, ownership-checked download endpoint —
   * direct /uploads/resumes access is blocked server-side.
   * @param {string} applicationId
   * @returns {Promise<Blob>} resume file blob
   */
  viewApplicantResume: async (applicationId) => {
    const response = await api.get(
      `${API_CONFIG.ENDPOINTS.APPLICATIONS.DOWNLOAD_RESUME}/${applicationId}/resume/download`,
      {
        responseType: "blob",
        headers: {
          Accept: "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      }
    );
    return response.data;
  },

};
