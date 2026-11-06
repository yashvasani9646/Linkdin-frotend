import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5502';

class SocketService {
  socket = null;
  listeners = new Map();

  connect(token) {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return this.socket;
    }

    // Reuse an existing socket instance that is still connecting or reconnecting
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.disconnected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] ✅ Connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] ❌ Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] ❌ Connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('[SocketService] ❌ Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('[SocketService] 🔌 Disconnecting');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Emit event
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn('[SocketService] ⚠️ Not connected, cannot emit:', event);
      return false;
    }
    console.log(`[SocketService] 📤 Emitting: ${event}`, data);
    this.socket.emit(event, data);
    return true;
  }

  // Listen to event
  on(event, callback) {
    if (!this.socket) {
      console.warn('[SocketService] ⚠️ Not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  // Remove listener
  off(event, callback) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // Chat-specific helper methods

  /**
   * Join a chat (legacy method for backward compatibility)
   */
  joinChat(recipientId, jobId) {
    return this.emit('join_chat', { recipientId, jobId });
  }

  /**
   * Leave a chat (legacy method for backward compatibility)
   */
  leaveChat(chatId) {
    return this.emit('leave_chat', { chatId });
  }

  /**
   * Send a message via socket
   */
  sendMessage(chatId, content, messageType = 'text', attachments = []) {
    return this.emit('send_message', { chatId, content, messageType, attachments });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId) {
    return this.emit('typing', { chatId });
  }

  /**
   * Send stop typing indicator
   */
  sendStopTyping(chatId) {
    return this.emit('stop_typing', { chatId });
  }

  /**
   * Mark messages as read
   */
  markAsRead(chatId) {
    return this.emit('mark_read', { chatId });
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
