import api from "./api";
import { API_CONFIG } from "../config/api.config";

export const chatService = {
  // Get user's chat list
  getChats: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.CHAT.LIST, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('[chatService] Error fetching chats:', error);
      throw error;
    }
  },

  // Get messages for a specific chat
  getChatMessages: async (chatId, page = 1, limit = 50) => {
    try {
      const url = API_CONFIG.ENDPOINTS.CHAT.MESSAGES.replace(':chatId', chatId);
      const response = await api.get(url, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('[chatService] Error fetching messages:', error);
      throw error;
    }
  },

  // Create or get existing chat
  createOrGetChat: async (recipientId, jobId) => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.CHAT.CREATE, {
        recipientId,
        jobId
      });
      return response.data;
    } catch (error) {
      console.error('[chatService] Error creating/getting chat:', error);
      throw error;
    }
  },

  /**
   * Send a message over REST.
   *
   * This is the fallback used by the UI when the Socket.IO connection is
   * unavailable. `attachments` is optional and must already have been
   * uploaded through `uploadAttachments` / `uploadVoiceNote`.
   *
   * @param {string} chatId
   * @param {string} content
   * @param {string} messageType - text | file | image | document | voice
   * @param {Array<Object>} attachments
   * @returns {Promise} API response
   */
  sendMessage: async (chatId, content, messageType = 'text', attachments = []) => {
    try {
      const url = API_CONFIG.ENDPOINTS.CHAT.MESSAGES.replace(':chatId', chatId);
      const response = await api.post(url, {
        content,
        messageType,
        ...(Array.isArray(attachments) && attachments.length > 0
          ? { attachments }
          : {}),
      });
      return response.data;
    } catch (error) {
      console.error('[chatService] Error sending message:', error);
      throw error;
    }
  },

  // Mark messages as read (using PUT)
  markAsRead: async (chatId) => {
    try {
      const url = API_CONFIG.ENDPOINTS.CHAT.MARK_READ.replace(':chatId', chatId);
      const response = await api.put(url);
      return response.data;
    } catch (error) {
      console.warn('[chatService] Failed to mark as read (non-critical):', error.message);
      return { success: false, error: error.message };
    }
  },

  // Delete a message
  deleteMessage: async (chatId, messageId) => {
    try {
      const url = API_CONFIG.ENDPOINTS.CHAT.DELETE_MESSAGE
        .replace(':chatId', chatId)
        .replace(':messageId', messageId);
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      console.error('[chatService] Error deleting message:', error);
      throw error;
    }
  },

  // Get total unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.CHAT.UNREAD_COUNT);
      return response.data;
    } catch (error) {
      console.error('[chatService] Error getting unread count:', error);
      throw error;
    }
  },

  // Upload attachments for chat (max 5 files, 10MB each)
  uploadAttachments: async (files) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('attachments', file));
      const response = await api.post(API_CONFIG.ENDPOINTS.CHAT.UPLOAD_ATTACHMENTS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('[chatService] Error uploading attachments:', error);
      throw error;
    }
  },

  // Upload voice note for chat (max 5MB, ~5 minutes)
  uploadVoiceNote: async (voiceBlob, duration) => {
    try {
      const formData = new FormData();
      formData.append('voice', voiceBlob, 'voice-note.webm');
      if (duration) {
        formData.append('duration', duration);
      }
      const response = await api.post(API_CONFIG.ENDPOINTS.CHAT.UPLOAD_VOICE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('[chatService] Error uploading voice note:', error);
      throw error;
    }
  }
};

export default chatService;
