# Indeed Chat System - Complete Socket.IO Integration Guide

> **Purpose**: This guide provides complete technical details for integrating Socket.IO into an existing React frontend. It is designed to be comprehensive enough for both developers and AI assistants to understand and implement.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Backend Configuration](#2-backend-configuration)
3. [Socket.IO Events Specification](#3-socketio-events-specification)
4. [REST API Specification](#4-rest-api-specification)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Data Models](#6-data-models)
7. [Error Handling](#7-error-handling)
8. [Testing Guide](#8-testing-guide)

---

## 1. System Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React Frontend)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐              ┌─────────────────────────────┐  │
│   │  REST API       │              │  Socket.IO Client           │  │
│   │  (axios/fetch)  │              │  (socket.io-client)         │  │
│   └────────┬────────┘              └─────────────┬───────────────┘  │
│            │                                     │                   │
└────────────┼─────────────────────────────────────┼───────────────────┘
             │ HTTP/HTTPS                          │ WebSocket
             │                                     │
┌────────────┴─────────────────────────────────────┴───────────────────┐
│                        SERVER (Node.js Backend)                       │
├──────────────────────────────────────────────────────────────────────┤
│  Port: 5502                                                          │
│                                                                      │
│  ┌──────────────────┐              ┌─────────────────────────────┐  │
│  │  Express Server   │              │  Socket.IO Server           │  │
│  │  /api/v1/chat/*  │              │  Real-time events           │  │
│  └──────────────────┘              └─────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    ChatService.js                              │   │
│  │  Business logic for both REST and Socket.IO                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    MongoDB (ChatModel)                         │   │
│  │  Stores: participants, messages, unreadCount, jobPost         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Communication Pattern

| Feature | Protocol | When to Use |
|---------|----------|-------------|
| Send/Receive messages | Socket.IO | Real-time, instant delivery |
| Typing indicators | Socket.IO | Real-time, no persistence needed |
| Online/Offline status | Socket.IO | Real-time state |
| Message delivery/read status | Socket.IO | Real-time notifications |
| Fetch chat list | REST API | Initial load, reliable data |
| Fetch message history | REST API | Initial load, pagination |
| Get unread count | REST API | Initial load, badge count |
| Delete messages | REST API | Non-time-critical operation |

---

## 2. Backend Configuration

### Server Details

```yaml
Server URL: http://localhost:5502
API Base URL: http://localhost:5502/api/v1
Socket.IO Path: /socket.io (default)
Socket.IO Version: 4.x
CORS Origins: http://localhost:5173, * (development)
```

### Authentication

Both REST API and Socket.IO require JWT authentication.

**REST API Authentication:**
```http
Authorization: Bearer <accessToken>
```

**Socket.IO Authentication (3 methods supported):**
```javascript
// Method 1: auth object (RECOMMENDED)
const socket = io(URL, {
  auth: { token: accessToken }
});

// Method 2: Authorization header
const socket = io(URL, {
  extraHeaders: { Authorization: `Bearer ${accessToken}` }
});

// Method 3: Query parameter
const socket = io(`${URL}?token=${accessToken}`);
```

---

## 3. Socket.IO Events Specification

### 3.1 Client → Server Events (EMIT)

#### `join_chat`
Join or create a chat room between two users for a specific job.

```typescript
// EMIT
socket.emit('join_chat', {
  recipientId: string,  // MongoDB ObjectId of the other user
  jobId: string         // MongoDB ObjectId of the job post
});

// RESPONSE EVENT: 'chat_joined'
{
  chatId: string,
  chat: {
    _id: string,
    participants: [
      { _id: string, firstName: string, lastName: string, profilePhoto: string }
    ],
    jobPost: { _id: string, clinicOrIndividualName: string },
    messages: Message[],
    lastMessageAt: string
  }
}
```

#### `send_message`
Send a message in a chat room.

```typescript
// EMIT
socket.emit('send_message', {
  chatId: string,         // Chat room ID
  content: string,        // Message text (required, max 5000 chars)
  messageType?: string    // Optional: 'text' | 'image' | 'file' (default: 'text')
});

// RESPONSE EVENT: 'message_sent' (to sender)
{
  chatId: string,
  message: {
    _id: string,
    sender: string,
    receiver: string,
    content: string,
    messageType: string,
    isRead: boolean,
    isDelivered: boolean,     // true if receiver is online
    sentAt: string,           // ISO date
    deliveredAt?: string      // ISO date, if delivered
  }
}

// BROADCAST EVENT: 'receive_message' (to other participants)
{
  chatId: string,
  message: { ... }  // Same structure as above
}
```

#### `typing`
Indicate that user started typing.

```typescript
// EMIT
socket.emit('typing', {
  chatId: string
});

// BROADCAST EVENT: 'user_typing' (to other participants)
{
  chatId: string,
  userId: string
}
```

#### `stop_typing`
Indicate that user stopped typing.

```typescript
// EMIT
socket.emit('stop_typing', {
  chatId: string
});

// BROADCAST EVENT: 'user_stopped_typing' (to other participants)
{
  chatId: string,
  userId: string
}
```

#### `mark_read`
Mark all messages in a chat as read.

```typescript
// EMIT
socket.emit('mark_read', {
  chatId: string
});

// BROADCAST EVENT: 'messages_read' (to other participants)
{
  chatId: string,
  userId: string  // User who read the messages
}
```

#### `leave_chat`
Leave a chat room (cleanup).

```typescript
// EMIT
socket.emit('leave_chat', {
  chatId: string
});

// No response event
```

---

### 3.2 Server → Client Events (LISTEN)

#### `connect`
Socket connected successfully.

```typescript
socket.on('connect', () => {
  console.log('Connected with ID:', socket.id);
});
```

#### `disconnect`
Socket disconnected.

```typescript
socket.on('disconnect', (reason: string) => {
  // reason: 'io server disconnect' | 'io client disconnect' | 'transport close' | etc.
});
```

#### `connect_error`
Connection failed.

```typescript
socket.on('connect_error', (error: Error) => {
  // error.message: 'Authentication required' | 'Invalid token'
});
```

#### `chat_joined`
Successfully joined a chat room.

```typescript
socket.on('chat_joined', (data: {
  chatId: string,
  chat: ChatObject
}) => {
  // Store chatId for future messages
});
```

#### `message_sent`
Confirmation that your message was saved.

```typescript
socket.on('message_sent', (data: {
  chatId: string,
  message: MessageObject
}) => {
  // Add message to UI
  // Check message.isDelivered for delivery status
});
```

#### `receive_message`
New message from another user.

```typescript
socket.on('receive_message', (data: {
  chatId: string,
  message: MessageObject
}) => {
  // Add message to UI
  // Show notification if chat is not active
});
```

#### `message_delivered`
Your message was delivered to recipient.

```typescript
socket.on('message_delivered', (data: {
  chatId: string,
  messageId: string
}) => {
  // Update message status to delivered (double grey tick)
});
```

#### `messages_delivered`
All pending messages were delivered (recipient came online).

```typescript
socket.on('messages_delivered', (data: {
  chatId: string,
  deliveredTo: string  // userId who received messages
}) => {
  // Update all pending messages to delivered status
});
```

#### `user_typing`
Another user is typing.

```typescript
socket.on('user_typing', (data: {
  chatId: string,
  userId: string
}) => {
  // Show "User is typing..." indicator
});
```

#### `user_stopped_typing`
Another user stopped typing.

```typescript
socket.on('user_stopped_typing', (data: {
  chatId: string,
  userId: string
}) => {
  // Hide typing indicator
});
```

#### `messages_read`
Your messages were read by recipient.

```typescript
socket.on('messages_read', (data: {
  chatId: string,
  userId: string  // Who read the messages
}) => {
  // Update message status to read (double blue tick)
});
```

#### `user_online`
A user came online.

```typescript
socket.on('user_online', (data: {
  userId: string
}) => {
  // Update user's online status in UI
});
```

#### `user_offline`
A user went offline.

```typescript
socket.on('user_offline', (data: {
  userId: string
}) => {
  // Update user's offline status in UI
});
```

#### `error`
An error occurred.

```typescript
socket.on('error', (data: {
  message: string,
  code: 'INVALID_DATA' | 'JOIN_FAILED' | 'SEND_FAILED' | 'UNAUTHORIZED'
}) => {
  // Handle error appropriately
});
```

---

## 4. REST API Specification

### Base URL
```
http://localhost:5502/api/v1
```

### Authentication Header
```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

### 4.1 Create or Get Chat

```http
POST /chat
```

**Request Body:**
```json
{
  "recipientId": "507f1f77bcf86cd799439011",
  "jobId": "507f1f77bcf86cd799439012"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Chat found" | "Chat created successfully",
  "data": {
    "chat": {
      "_id": "694d1e551a88cd9d916e0879",
      "participants": [
        {
          "_id": "694a7b24afd2369c8deaa5f1",
          "firstName": "John",
          "lastName": "Doe",
          "profilePhoto": "/uploads/profiles/...",
          "fullName": "John Doe"
        }
      ],
      "jobPost": {
        "_id": "694ccc84b21adb35908d4620",
        "clinicOrIndividualName": "Vision Clinic"
      },
      "isActive": true,
      "createdAt": "2025-12-25T10:00:00.000Z"
    },
    "isNew": false
  }
}
```

---

### 4.2 Get User's Chats

```http
GET /chat?page=1&limit=20
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Chats fetched successfully",
  "data": {
    "chats": [
      {
        "_id": "694d1e551a88cd9d916e0879",
        "otherParticipant": {
          "_id": "694d1e17c9828f4ccf6a512f",
          "firstName": "Jane",
          "lastName": "Smith",
          "profilePhoto": "/uploads/..."
        },
        "jobPost": {
          "_id": "694ccc84b21adb35908d4620",
          "clinicOrIndividualName": "Vision Clinic"
        },
        "lastMessage": {
          "content": "Hello!",
          "sentAt": "2025-12-25T11:33:40.879Z",
          "sender": "694a7b24afd2369c8deaa5f1"
        },
        "unreadCount": 3,
        "lastMessageAt": "2025-12-25T11:33:40.879Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalChats": 42,
      "limit": 20
    }
  }
}
```

---

### 4.3 Get Chat Messages

```http
GET /chat/:chatId/messages?page=1&limit=50
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| chatId | string | MongoDB ObjectId of the chat |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages fetched successfully",
  "data": {
    "chat": {
      "_id": "694d1e551a88cd9d916e0879",
      "participants": [
        {
          "_id": "694a7b24afd2369c8deaa5f1",
          "firstName": "John",
          "lastName": "Doe",
          "profilePhoto": "/uploads/...",
          "fullName": "John Doe"
        },
        {
          "_id": "694d1e17c9828f4ccf6a512f",
          "firstName": "Jane",
          "lastName": "Smith",
          "profilePhoto": "/uploads/...",
          "fullName": "Jane Smith"
        }
      ],
      "jobPost": {
        "_id": "694ccc84b21adb35908d4620",
        "clinicOrIndividualName": "Vision Clinic"
      }
    },
    "messages": [
      {
        "_id": "694d21141a88cd9d916e0911",
        "sender": "694a7b24afd2369c8deaa5f1",
        "receiver": "694d1e17c9828f4ccf6a512f",
        "messageType": "text",
        "content": "Hello!",
        "attachments": [],
        "isRead": true,
        "isDelivered": true,
        "isDeleted": false,
        "deletedBy": [],
        "sentAt": "2025-12-25T11:33:40.879Z",
        "readAt": "2025-12-25T11:34:00.000Z",
        "deliveredAt": "2025-12-25T11:33:41.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalMessages": 11,
      "limit": 50
    }
  }
}
```

---

### 4.4 Send Message (REST Fallback)

```http
POST /chat/:chatId/messages
```

**Request Body:**
```json
{
  "content": "Hello, I'm interested in this position!",
  "messageType": "text"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "_id": "694d21141a88cd9d916e0911",
      "sender": "694a7b24afd2369c8deaa5f1",
      "receiver": "694d1e17c9828f4ccf6a512f",
      "messageType": "text",
      "content": "Hello, I'm interested in this position!",
      "isRead": false,
      "isDelivered": false,
      "sentAt": "2025-12-25T11:33:40.879Z"
    }
  }
}
```

---

### 4.5 Mark Messages as Read

```http
PUT /chat/:chatId/read
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

### 4.6 Delete Message

```http
DELETE /chat/:chatId/messages/:messageId
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

### 4.7 Get Unread Count

```http
GET /chat/unread-count
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Unread count fetched successfully",
  "data": {
    "unreadCount": 5
  }
}
```

---

## 5. Frontend Implementation

### 5.1 Required Package

```bash
npm install socket.io-client
```

Version compatibility: `socket.io-client@^4.0.0`

---

### 5.2 Socket Service (Create New File)

**File: `src/services/socketService.js`**

```javascript
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5502';

class SocketService {
  socket = null;
  listeners = new Map();

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
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
      console.warn('[Socket] Not connected, cannot emit:', event);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  // Listen to event
  on(event, callback) {
    if (!this.socket) {
      console.warn('[Socket] Not initialized');
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

  // Chat-specific methods
  joinChat(recipientId, jobId) {
    return this.emit('join_chat', { recipientId, jobId });
  }

  leaveChat(chatId) {
    return this.emit('leave_chat', { chatId });
  }

  sendMessage(chatId, content, messageType = 'text') {
    return this.emit('send_message', { chatId, content, messageType });
  }

  sendTyping(chatId) {
    return this.emit('typing', { chatId });
  }

  sendStopTyping(chatId) {
    return this.emit('stop_typing', { chatId });
  }

  markAsRead(chatId) {
    return this.emit('mark_read', { chatId });
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
```

---

### 5.3 Usage Example - Connecting on Login

```javascript
import socketService from './services/socketService';

// In your login handler or auth context
const handleLoginSuccess = (accessToken) => {
  // Store token
  localStorage.setItem('accessToken', accessToken);
  
  // Connect socket
  socketService.connect(accessToken);
};

// In your logout handler
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  socketService.disconnect();
};

// Auto-connect on app load if token exists
const initializeApp = () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    socketService.connect(token);
  }
};
```

---

### 5.4 Usage Example - Chat Component

```javascript
import { useEffect, useState, useCallback, useRef } from 'react';
import socketService from './services/socketService';

const useChatSocket = (recipientId, jobId) => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Join chat on mount
  useEffect(() => {
    if (!recipientId || !jobId) return;

    socketService.joinChat(recipientId, jobId);

    // Event handlers
    const handleChatJoined = (data) => {
      setChatId(data.chatId);
    };

    const handleMessageSent = (data) => {
      setMessages(prev => [...prev, data.message]);
    };

    const handleReceiveMessage = (data) => {
      setMessages(prev => [...prev, data.message]);
    };

    const handleUserTyping = (data) => {
      setTypingUserId(data.userId);
    };

    const handleUserStoppedTyping = () => {
      setTypingUserId(null);
    };

    const handleMessageDelivered = (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, isDelivered: true, deliveredAt: new Date().toISOString() }
          : msg
      ));
    };

    const handleMessagesRead = (data) => {
      setMessages(prev => prev.map(msg => 
        msg.receiver === data.userId && !msg.isRead
          ? { ...msg, isRead: true, readAt: new Date().toISOString() }
          : msg
      ));
    };

    // Register listeners
    socketService.on('chat_joined', handleChatJoined);
    socketService.on('message_sent', handleMessageSent);
    socketService.on('receive_message', handleReceiveMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('user_stopped_typing', handleUserStoppedTyping);
    socketService.on('message_delivered', handleMessageDelivered);
    socketService.on('messages_read', handleMessagesRead);

    // Cleanup
    return () => {
      if (chatId) {
        socketService.leaveChat(chatId);
      }
      socketService.off('chat_joined', handleChatJoined);
      socketService.off('message_sent', handleMessageSent);
      socketService.off('receive_message', handleReceiveMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_stopped_typing', handleUserStoppedTyping);
      socketService.off('message_delivered', handleMessageDelivered);
      socketService.off('messages_read', handleMessagesRead);
    };
  }, [recipientId, jobId]);

  // Send message function
  const sendMessage = useCallback((content) => {
    if (!chatId || !content.trim()) return false;
    socketService.sendMessage(chatId, content.trim());
    return true;
  }, [chatId]);

  // Typing indicator with debounce
  const handleTyping = useCallback(() => {
    if (!chatId) return;

    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(chatId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendStopTyping(chatId);
    }, 2000);
  }, [chatId, isTyping]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!chatId) return;
    socketService.markAsRead(chatId);
  }, [chatId]);

  return {
    chatId,
    messages,
    typingUserId,
    sendMessage,
    handleTyping,
    markAsRead,
    isConnected: socketService.isConnected(),
  };
};

export default useChatSocket;
```

---

### 5.5 Message Status Display Logic

```javascript
// Component to show message status (ticks)
const MessageStatus = ({ message, currentUserId }) => {
  // Only show status for messages sent by current user
  if (message.sender !== currentUserId) {
    return null;
  }

  // Read = double blue tick
  if (message.isRead) {
    return <span className="status status-read">✓✓</span>;
  }
  
  // Delivered = double grey tick
  if (message.isDelivered) {
    return <span className="status status-delivered">✓✓</span>;
  }
  
  // Sent = single grey tick
  return <span className="status status-sent">✓</span>;
};

// CSS
/*
.status { margin-left: 4px; font-size: 12px; }
.status-sent { color: #999; }
.status-delivered { color: #999; }
.status-read { color: #34B7F1; }
*/
```

---

## 6. Data Models

### Message Object

```typescript
interface Message {
  _id: string;
  sender: string;           // User ID who sent
  receiver: string;         // User ID who receives
  messageType: 'text' | 'image' | 'file';
  content: string;
  attachments: Attachment[];
  isRead: boolean;
  isDelivered: boolean;
  isDeleted: boolean;
  deletedBy: string[];      // User IDs who deleted
  sentAt: string;           // ISO date
  readAt?: string;          // ISO date
  deliveredAt?: string;     // ISO date
}
```

### Chat Object

```typescript
interface Chat {
  _id: string;
  participants: User[];
  jobPost: JobPost;
  messages: Message[];
  lastMessageAt: string;
  unreadCount: Map<string, number>;  // userId -> count
  isActive: boolean;
  createdAt: string;
}
```

### User Object (Participant)

```typescript
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  fullName: string;
}
```

---

## 7. Error Handling

### Socket.IO Errors

```javascript
socketService.on('error', (data) => {
  switch (data.code) {
    case 'INVALID_DATA':
      // Missing required fields
      console.error('Invalid data:', data.message);
      break;
    case 'JOIN_FAILED':
      // Failed to join chat room
      console.error('Join failed:', data.message);
      break;
    case 'SEND_FAILED':
      // Failed to send message
      console.error('Send failed:', data.message);
      break;
    case 'UNAUTHORIZED':
      // Token invalid or expired
      // Redirect to login
      break;
  }
});

// Connection errors
socketService.on('connect_error', (error) => {
  if (error.message === 'Authentication required') {
    // No token provided
  } else if (error.message === 'Invalid token') {
    // Token expired - refresh and reconnect
  }
});
```

### REST API Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "ERROR_CODE",
    "field": "fieldName"
  }
}
```

---

## 8. Testing Guide

### Using chat-tester.html

1. Open: `http://localhost:5173/chat-tester.html`
2. Paste JWT token
3. Click Connect
4. Enter recipientId and jobId
5. Click Join Chat
6. Send messages

### Testing Two Users

1. Open chat-tester.html in two browser tabs
2. Login with different users (different tokens)
3. Join same chat (use each other's user ID as recipientId)
4. Send messages and observe real-time delivery

### Expected Behavior

| Action | Event Emitted | Events Received |
|--------|---------------|-----------------|
| Connect | - | `connect` |
| Join Chat | `join_chat` | `chat_joined` |
| Send Message | `send_message` | Sender: `message_sent`, Receiver: `receive_message` |
| Type | `typing` | Other: `user_typing` |
| Stop Type | `stop_typing` | Other: `user_stopped_typing` |
| Read Messages | `mark_read` | Other: `messages_read` |
| Disconnect | - | Others: `user_offline` |

---

## Summary Checklist

- [ ] Install `socket.io-client`
- [ ] Create `socketService.js`
- [ ] Connect socket after login with JWT token
- [ ] Disconnect socket on logout
- [ ] Implement `join_chat` when opening a chat
- [ ] Implement `send_message` for sending
- [ ] Listen for `receive_message` for incoming messages
- [ ] Implement typing indicators
- [ ] Implement message status (✓ ✓✓ ✓✓)
- [ ] Handle `user_online` / `user_offline` for presence
- [ ] Use REST API for initial data fetch
- [ ] Handle errors and reconnection
