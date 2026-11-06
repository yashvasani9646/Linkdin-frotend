import api from "./api";
import { API_CONFIG } from "../config/api.config";

export const notificationService = {
  // Get notifications with optional filters
  getNotifications: async ({ page = 1, limit = 20, type, isRead } = {}) => {
    const params = { page, limit };
    
    if (type) {
      params.type = type;
    }
    if (isRead !== undefined && isRead !== null) {
      params.isRead = isRead;
    }
    
    const response = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATION.GET_ALL, {
      params
    });
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATION.UNREAD_COUNT);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put(API_CONFIG.ENDPOINTS.NOTIFICATION.READ_ALL);
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    const url = API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_READ.replace(':id', notificationId);
    const response = await api.put(url);
    return response.data;
  },

  // Delete notification (soft delete)
  deleteNotification: async (notificationId) => {
    const url = API_CONFIG.ENDPOINTS.NOTIFICATION.DELETE.replace(':id', notificationId);
    const response = await api.delete(url);
    return response.data;
  },
};

export default notificationService;
