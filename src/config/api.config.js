export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5502",
  TIMEOUT: import.meta.env.VITE_API_TIMEOUT || 30000,
  RETRY_ATTEMPTS: import.meta.env.VITE_API_RETRY_ATTEMPTS || 3,
  ENDPOINTS: {
    AUTH: {
      REGISTER: "/api/v1/auth/register",
      LOGIN: "/api/v1/auth/login",
      LOGOUT: "/api/v1/auth/logout",
      VERIFY_OTP: "/api/v1/auth/verifyOtp",
      RESEND_OTP: "/api/v1/auth/resendOtp",
      FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
      VERIFY_RESET_OTP: "/api/v1/auth/verify-reset-otp",
      RESET_PASSWORD: "/api/v1/auth/reset-password",
      REFRESH_TOKEN: "/api/v1/auth/refresh-token",
      CURRENT_USER: "/api/v1/auth/UserDetails",
    },
    USERS: {
      // LIST: "/api/v1/users",
      // DETAILS: "/api/v1/users/:id",
      EDIT_PROFILE: "/api/v1/user/edit-profile",
      // DELETE: "/api/v1/users/:id",
      UPLOAD_PHOTO: "/api/v1/user/upload-photo",
      UPDATE_PROFILE: "/api/v1/user/complete-profile",
    },
    JOBS: {
      LIST: "/api/v1/job/listAllJobs",
      CREATE: "/api/v1/job/createJob",
      MY_JOBS: "/api/v1/job/my-jobs",
      SAVE: "/api/v1/job", // Will append /{jobId}/save
      DISPLAY_SAVED: "/api/v1/job/saved", 
      DETAILS: "/api/v1/job", // Will append /{jobId}
      // UPDATE: "/api/v1/jobs/:id",
      // DELETE: "/api/v1/jobs/:id",
      // APPLY: "/api/v1/jobs/:id/apply",
    },
    APPLICATIONS: {
      APPLY: "/api/v1/application/apply", // POST - Apply to a job (append /{jobId})
      MY_APPLICATIONS: "/api/v1/application/my-applications", // GET - Fetch user's applied jobs
      JOB_APPLICANTS: "/api/v1/application/job", // GET - Fetch applicants for a job (append /{jobId}/applicants)
      UPDATE_STATUS: "/api/v1/application", // PUT - Update application status (append /{applicationId}/status)
      DOWNLOAD_RESUME: "/api/v1/application", // GET - Download resume (append /{applicationId}/resume/download)
      // LIST: "/api/v1/applications",
      // DETAILS: "/api/v1/applications/:id",
    },
    PROFILE: {
      // GET: "/api/v1/profile",
      // UPDATE: "/api/v1/profile",
      GET_PROFILE_DETAILS: "/api/v1/user/profile-details",
      UPDATE_QUALIFICATIONS: "/api/v1/user/profile-details/qualifications", // POST - replaces all qualifications
      UPDATE_JOB_PREFERENCES: "/api/v1/user/profile-details/job-preferences", // POST - updates job preferences
      UPLOAD_RESUME: "/api/v1/user/profile-details/resume",
      DELETE_RESUME: "/api/v1/user/profile-details/resume",
      VIEW_RESUME: "/api/v1/user/profile-details/resume/view",
      // UPDATE_PHOTO: "/api/v1/profile/photo",
      // QUALIFICATIONS: "/api/v1/profile/qualifications",
      // EXPERIENCE: "/api/v1/profile/experience",
    },
    CHAT: {
      LIST: "/api/v1/chat",
      MESSAGES: "/api/v1/chat/:chatId/messages",
      CREATE: "/api/v1/chat",
      MARK_READ: "/api/v1/chat/:chatId/read",
      DELETE_MESSAGE: "/api/v1/chat/:chatId/messages/:messageId",
      UNREAD_COUNT: "/api/v1/chat/unread-count",
      UPLOAD_ATTACHMENTS: "/api/v1/chat/upload-attachments",
      UPLOAD_VOICE: "/api/v1/chat/upload-voice",
    },
    NOTIFICATION: {
      GET_ALL: "/api/v1/notifications",
      UNREAD_COUNT: "/api/v1/notifications/unread-count",
      READ_ALL: "/api/v1/notifications/read-all",
      MARK_READ: "/api/v1/notifications/:id/read",
      DELETE: "/api/v1/notifications/:id",
    },
    ADMIN:{
      DASHBOARD_STATS: "/api/v1/admin/dashboard/stats",
      USERS: "/api/v1/admin/users",
      JOBS: "/api/v1/admin/jobs",
      CREATE_JOB: "/api/v1/admin/jobs",
      UPDATE_JOB: (jobId) => `/api/v1/admin/jobs/${jobId}`,
      JOB_STATUS: "/api/v1/admin/jobs", // PATCH - Update job status (append /{jobId}/status)
      NOTIFICATION_USERS: "/api/v1/admin/users/notifications", // GET - Get users list for notifications
      SEND_NOTIFICATION: "/api/v1/admin/notifications/send", // POST - Send notification to users
    }
  },
};
