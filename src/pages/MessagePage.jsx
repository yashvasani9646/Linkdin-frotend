import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import EmojiPicker from "emoji-picker-react";
import { SearchIcon } from "../icons/SearchIon";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import socketService from "../services/socketService";
import chatService from "../services/chatService";
import { toAssetUrl } from "../utils/assetUrl";
import { getErrorMessage } from "../utils/errorHandler";

/** Resolve a display name for a participant, falling back to "Unknown". */
const getDisplayName = (participant) => {
  if (!participant) return "Unknown";
  const full = participant.fullName?.trim();
  if (full) return full;
  const composed = `${participant.firstName || ""} ${
    participant.lastName || ""
  }`.trim();
  return composed || participant.email || "Unknown";
};

/** Initials fallback when a participant has no profile photo. */
const getInitials = (participant) => {
  const name = getDisplayName(participant);
  if (name === "Unknown") return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/** Keep the conversation list ordered by most recent activity. */
const sortChats = (list = []) =>
  [...list].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });

/** Patch one conversation in the list and re-sort by most recent activity. */
const patchChat = (list, chatId, patch) =>
  sortChats(
    list.map((chat) =>
      chat._id === chatId
        ? { ...chat, ...(typeof patch === "function" ? patch(chat) : patch) }
        : chat
    )
  );

/** Build the `lastMessage` summary used by the conversation list. */
const toLastMessage = (message) => ({
  content: message.content,
  sentAt: message.sentAt,
  sender: message.sender,
  messageType: message.messageType,
});

const MessagePage = () => {
  // Get current user from Redux
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;
  const location = useLocation();

  // Chat list state
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected chat state
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Input state
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Typing state
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Online users
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Refs
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Message menu state
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Error / retry states
  const [chatsError, setChatsError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Pagination state: the latest page loads first, older pages on demand
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  // Scroll anchoring while older messages are prepended above the viewport
  const scrollAnchorRef = useRef(null);
  const preserveScrollRef = useRef(false);

  // Pending socket send: the draft is only discarded once the server
  // confirms delivery (`message_sent`), otherwise it is restored.
  const pendingSendRef = useRef(null);

  // Scroll tracking: only auto-scroll when the user is near the bottom
  const isNearBottomRef = useRef(true);
  const emojiPickerRef = useRef(null);

  /** Track whether the user is close enough to the bottom to follow new messages. */
  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 96;
  };

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive for app
    };
  }, []);

  // Fetch chat list on mount (re-run on navigation or manual retry)
  const [chatsRetryKey, setChatsRetryKey] = useState(0);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      setChatsError("");
      try {
        const response = await chatService.getChats();
        if (response.success && response.data?.chats) {
          const loaded = sortChats(response.data.chats);
          setChats(loaded);

          // Check if we have a selectedChatId from navigation (e.g., from JobApplicationsPage)
          const navigatedChatId = location.state?.selectedChatId;

          if (navigatedChatId) {
            // Auto-select the chat passed from navigation
            setSelectedChatId(navigatedChatId);
            setIsMobileChatOpen(true);
          } else if (loaded.length > 0 && !selectedChatId) {
            // Auto-select first chat if available
            setSelectedChatId(loaded[0]._id);
          }
        } else {
          setChatsError("We could not load your conversations.");
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
        setChatsError(getErrorMessage(error, "Failed to load conversations"));
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchChats();
  }, [location.state?.selectedChatId, chatsRetryKey]);

  // Fetch messages when chat is selected AND join socket room
  const [messagesRetryKey, setMessagesRetryKey] = useState(0);

  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setMessagesError("");
      setLoadMoreError("");
      setIsLoadingMore(false);
      setPage(1);
      setHasMore(false);
      try {
        const response = await chatService.getChatMessages(selectedChatId, 1);
        if (response.success && response.data) {
          // Reverse messages to show oldest first, newest at bottom (like WhatsApp)
          const messagesFromApi = response.data.messages || [];
          setMessages([...messagesFromApi].reverse());
          setSelectedChat(response.data.chat);

          // Page 1 is the newest window; flag whether older pages exist
          const pagination = response.data.pagination;
          setHasMore(
            pagination
              ? pagination.currentPage < pagination.totalPages
              : messagesFromApi.length === (pagination?.limit || 50)
          );

          // ✅ JOIN THE CHAT ROOM after getting chat data
          // Get the other participant's ID from the chat
          const chat = response.data.chat;
          const otherParticipant =
            chat?.otherParticipant ||
            chat?.participants?.find((p) => p._id !== currentUserId);

          if (otherParticipant) {
            socketService.emit("join_chat", {
              recipientId: otherParticipant._id,
              jobId: chat?.job?._id || chat?.jobId,
            });
          }

          // Mark messages as read (REST fallback when the socket is down)
          if (!socketService.markAsRead(selectedChatId)) {
            chatService.markAsRead(selectedChatId).catch(() => {});
          }

          // Opening a conversation always starts pinned to the newest message
          setSendError("");
          isNearBottomRef.current = true;
        } else {
          setMessagesError("We could not load this conversation.");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessagesError(getErrorMessage(error, "Failed to load messages"));
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    // ✅ LEAVE THE CHAT ROOM when switching to another chat
    return () => {
      socketService.emit("leave_chat", { chatId: selectedChatId });
    };
  }, [selectedChatId, currentUserId, messagesRetryKey]);

  // Manual inline retry handlers for the two list fetches above
  const retryChats = () => setChatsRetryKey((key) => key + 1);
  const retryMessages = () => setMessagesRetryKey((key) => key + 1);

  // Load the next-older page of messages and prepend it above the current
  // window. The backend returns messages newest-first per page, so the page
  // is reversed to oldest-first before merging; duplicates (from socket
  // pushes or an earlier fetch) are dropped by _id, and the scroll position
  // is anchored so the visible messages do not jump.
  const loadOlderMessages = useCallback(async () => {
    if (!selectedChatId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setLoadMoreError("");
    try {
      const nextPage = page + 1;
      const response = await chatService.getChatMessages(
        selectedChatId,
        nextPage
      );
      if (response.success && response.data) {
        const olderFromApi = response.data.messages || [];
        const container = messagesContainerRef.current;
        const prevScrollHeight = container ? container.scrollHeight : 0;
        const prevScrollTop = container ? container.scrollTop : 0;

        const olderOldestFirst = [...olderFromApi].reverse();

        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m._id).filter(Boolean));
          const fresh = olderOldestFirst.filter(
            (m) => !m._id || !seen.has(m._id)
          );
          if (fresh.length === 0) return prev;
          scrollAnchorRef.current = {
            height: prevScrollHeight,
            top: prevScrollTop,
          };
          preserveScrollRef.current = true;
          return [...fresh, ...prev];
        });

        setPage(nextPage);
        const pagination = response.data.pagination;
        setHasMore(
          pagination
            ? pagination.currentPage < pagination.totalPages
            : olderFromApi.length > 0
        );
      } else {
        setLoadMoreError("We could not load older messages.");
      }
    } catch (error) {
      console.error("Error loading older messages:", error);
      setLoadMoreError(
        getErrorMessage(error, "Failed to load older messages")
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedChatId, isLoadingMore, hasMore, page]);

  // Re-join the active chat room after a socket reconnect
  useEffect(() => {
    if (!selectedChat) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const rejoinChat = () => {
      const otherParticipant =
        selectedChat.otherParticipant ||
        selectedChat.participants?.find((p) => p._id !== currentUserId);

      if (!otherParticipant) return;

      socketService.emit("join_chat", {
        recipientId: otherParticipant._id,
        jobId: selectedChat?.job?._id || selectedChat?.jobId,
      });

      if (selectedChatId) {
        socketService.markAsRead(selectedChatId);
      }
    };

    socket.on("connect", rejoinChat);
    return () => socket.off("connect", rejoinChat);
  }, [selectedChat, selectedChatId, currentUserId]);

  // Socket event listeners
  useEffect(() => {
    // Handle incoming messages
    const handleReceiveMessage = (data) => {
      if (data.chatId === selectedChatId) {
        setMessages((prev) =>
          data.message?._id && prev.some((m) => m._id === data.message._id)
            ? prev
            : [...prev, data.message]
        );
        // Mark as read if chat is open
        if (!socketService.markAsRead(selectedChatId)) {
          chatService.markAsRead(selectedChatId).catch(() => {});
        }
      }

      // Update chat list (keep it sorted by most recent activity)
      setChats((prev) =>
        patchChat(prev, data.chatId, (chat) => ({
          lastMessage: toLastMessage(data.message),
          lastMessageAt: data.message.sentAt,
          unreadCount: chat._id === selectedChatId ? 0 : (chat.unreadCount || 0) + 1,
        }))
      );
    };

    // Handle message sent confirmation — this is the success signal that
    // releases the held draft (see handleSend).
    const handleMessageSent = (data) => {
      const pending = pendingSendRef.current;
      if (pending && data.chatId === pending.chatId) {
        pendingSendRef.current = null;
        clearTimeout(pending.timer);
        setIsSending(false);
        setSendError("");

        // Strip only the confirmed draft; keep anything typed since then
        setInput((current) => {
          if (!pending.content) return current;
          if (current.trim() === pending.content) return "";
          const idx = current.indexOf(pending.content);
          if (idx === -1) return current;
          const next =
            current.slice(0, idx) + current.slice(idx + pending.content.length);
          return next.trim() === "" ? "" : next;
        });
        setSelectedAttachments((current) =>
          current.filter((a) => !pending.attachments.includes(a))
        );
      }

      setMessages((prev) =>
        data.message?._id && prev.some((m) => m._id === data.message._id)
          ? prev
          : [...prev, data.message]
      );

      // Update chat list (keep it sorted by most recent activity)
      setChats((prev) =>
        patchChat(prev, data.chatId, {
          lastMessage: toLastMessage(data.message),
          lastMessageAt: data.message.sentAt,
        })
      );
    };

    // Handle typing indicators
    const handleUserTyping = (data) => {
      setTypingUsers((prev) => ({ ...prev, [data.chatId]: data.userId }));
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[data.chatId];
        return updated;
      });
    };

    // Handle message delivery/read status
    const handleMessageDelivered = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                isDelivered: true,
                deliveredAt: new Date().toISOString(),
              }
            : msg
        )
      );
    };

    const handleMessagesRead = (data) => {
      if (data.chatId === selectedChatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === currentUserId && !msg.isRead
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );
      }
    };

    // Handle online/offline status
    const handleOnlineUsers = (data) => {
      if (Array.isArray(data?.users)) {
        setOnlineUsers(new Set(data.users));
      }
    };

    const handleUserOnline = (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    };

    // Handle errors — a send failure releases the held draft so the user
    // can retry (the composer still contains their text).
    const handleError = (data) => {
      console.error("[Socket] Error:", data);
      const pending = pendingSendRef.current;
      if (
        pending &&
        (data?.code === "SEND_FAILED" || data?.code === "INVALID_DATA")
      ) {
        pendingSendRef.current = null;
        clearTimeout(pending.timer);
        setIsSending(false);
        setSendError(
          data?.message || "Message could not be sent. Your draft was kept."
        );
      } else {
        toast.error(data.message || "Chat error occurred");
      }
    };

    // If the connection drops while a send is awaiting confirmation, keep
    // the draft and surface an error; the REST fallback/retry can resend.
    const handleDisconnect = () => {
      const pending = pendingSendRef.current;
      if (pending) {
        pendingSendRef.current = null;
        clearTimeout(pending.timer);
        setIsSending(false);
        setSendError(
          "Connection lost before the message was confirmed. Your draft was kept."
        );
      }
    };

    // Register listeners
    socketService.on("receive_message", handleReceiveMessage);
    socketService.on("message_sent", handleMessageSent);
    socketService.on("user_typing", handleUserTyping);
    socketService.on("user_stopped_typing", handleUserStoppedTyping);
    socketService.on("message_delivered", handleMessageDelivered);
    socketService.on("messages_read", handleMessagesRead);
    socketService.on("online_users", handleOnlineUsers);
    socketService.on("user_online", handleUserOnline);
    socketService.on("user_offline", handleUserOffline);
    socketService.on("error", handleError);
    socketService.on("disconnect", handleDisconnect);

    // Cleanup
    return () => {
      socketService.off("receive_message", handleReceiveMessage);
      socketService.off("message_sent", handleMessageSent);
      socketService.off("user_typing", handleUserTyping);
      socketService.off("user_stopped_typing", handleUserStoppedTyping);
      socketService.off("message_delivered", handleMessageDelivered);
      socketService.off("messages_read", handleMessagesRead);
      socketService.off("online_users", handleOnlineUsers);
      socketService.off("user_online", handleUserOnline);
      socketService.off("user_offline", handleUserOffline);
      socketService.off("error", handleError);
      socketService.off("disconnect", handleDisconnect);
    };
  }, [selectedChatId, currentUserId]);

  // Follow new messages only when the user is already near the bottom
  // (own messages always scroll into view)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    // Older messages were prepended: restore the previous scroll offset
    // instead of jumping to the bottom.
    if (preserveScrollRef.current) {
      preserveScrollRef.current = false;
      const anchor = scrollAnchorRef.current;
      scrollAnchorRef.current = null;
      if (anchor) {
        container.scrollTop = container.scrollHeight - anchor.height + anchor.top;
      }
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.sender === currentUserId;

    if (isNearBottomRef.current || isOwnMessage) {
      container.scrollTop = container.scrollHeight;
      isNearBottomRef.current = true;
    }
  }, [messages, currentUserId]);

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMessageMenu && !e.target.closest(".message-menu-container")) {
        setOpenMessageMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMessageMenu]);

  // Close the emoji picker on outside click or Escape
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handlePointerDown = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEmojiPicker]);

  // Get other participant from selected chat
  const getOtherParticipant = (chat) => {
    if (!chat) return null;
    if (chat.otherParticipant) return chat.otherParticipant;
    if (chat.participants) {
      return chat.participants.find((p) => p._id !== currentUserId);
    }
    return null;
  };

  const selectedParticipant = getOtherParticipant(selectedChat);

  // Handle send message
  const handleSend = useCallback(async () => {
    const content = input.trim();
    if ((!content && selectedAttachments.length === 0) || !selectedChatId)
      return;
    if (isSending) return;

    // Determine message type based on attachments
    let messageType = "text";
    if (selectedAttachments.length > 0) {
      messageType = selectedAttachments[0].fileType?.startsWith("image/")
        ? "image"
        : "document";
    }

    const payload = {
      chatId: selectedChatId,
      content,
      messageType,
      attachments: selectedAttachments,
    };

    setSendError("");

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      socketService.sendStopTyping(selectedChatId);
    }

    // Preferred path: Socket.IO real-time delivery. The draft stays in the
    // composer until the server confirms with `message_sent` — it is only
    // stripped on success (see the message_sent listener below).
    if (socketService.isConnected()) {
      const pending = {
        chatId: selectedChatId,
        content,
        attachments: selectedAttachments,
        timer: null,
      };
      // Safety net: no confirmation within 15s → surface an error and keep
      // the draft so the user can retry manually.
      pending.timer = setTimeout(() => {
        if (pendingSendRef.current === pending) {
          pendingSendRef.current = null;
          setIsSending(false);
          setSendError(
            "Message confirmation timed out. Your draft was kept."
          );
        }
      }, 15000);
      pendingSendRef.current = pending;
      setIsSending(true);

      if (socketService.emit("send_message", payload)) return;

      // Emit failed (connection dropped between the check and the emit):
      // clean up and fall through to the REST fallback below.
      pendingSendRef.current = null;
      clearTimeout(pending.timer);
      setIsSending(false);
    }

    // Fallback: Socket.IO is disconnected, so send through the REST chat
    // service. The draft is also only cleared after a confirmed success.
    setIsSending(true);
    try {
      const response = await chatService.sendMessage(
        selectedChatId,
        content,
        messageType,
        selectedAttachments
      );

      const message = response?.data?.message;
      if (!response?.success || !message) {
        throw new Error(response?.message || "Message could not be sent");
      }

      // Success — strip the confirmed draft from the composer (keep any
      // additional text the user typed while the request was in flight).
      setInput((current) => {
        if (!content) return current;
        if (current.trim() === content) return "";
        const idx = current.indexOf(content);
        if (idx === -1) return current;
        const next = current.slice(0, idx) + current.slice(idx + content.length);
        return next.trim() === "" ? "" : next;
      });
      setSelectedAttachments((current) =>
        current.filter((a) => !selectedAttachments.includes(a))
      );

      setMessages((prev) =>
        message._id && prev.some((m) => m._id === message._id)
          ? prev
          : [...prev, message]
      );
      setChats((prev) =>
        patchChat(prev, selectedChatId, {
          lastMessage: toLastMessage(message),
          lastMessageAt: message.sentAt,
        })
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // The draft was never cleared, so nothing the user typed is lost
      setSendError(getErrorMessage(error, "Message could not be sent."));
    } finally {
      setIsSending(false);
    }
  }, [input, selectedChatId, isTyping, selectedAttachments, isSending]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    const textarea = e.target;
    setInput(textarea.value);

    textarea.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * 3;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";

    // Handle typing indicator
    if (selectedChatId && textarea.value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        socketService.sendTyping(selectedChatId);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.sendStopTyping(selectedChatId);
      }, 2000);
    }
  };

  const handleEmojiClick = (emoji) => {
    setInput((prev) => prev + emoji);
  };

  // Handle file selection and upload immediately
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingFiles(true);
      const response = await chatService.uploadAttachments(files);
      if (response.success) {
        setSelectedAttachments((prev) => [
          ...prev,
          ...response.data.attachments,
        ]);
      }
    } catch (error) {
      console.error("Failed to upload attachments:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove an attachment
  const removeAttachment = (index) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    if (!selectedChatId || !messageId) return;

    setDeletingMessageId(messageId);
    try {
      const response = await chatService.deleteMessage(
        selectedChatId,
        messageId
      );
      if (response.success) {
        // Remove message from local state
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        toast.success("Message deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      if (error.response?.status === 403) {
        toast.error("You can only delete your own messages");
      } else if (error.response?.status === 404) {
        toast.error("Message not found");
      } else {
        toast.error("Failed to delete message");
      }
    } finally {
      setDeletingMessageId(null);
      setOpenMessageMenu(null);
    }
  };

  // Format recording duration
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          // Max 5 minutes (300 seconds)
          if (prev >= 300) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Unable to access microphone. Please check permissions.");
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Cancel voice recording
  const cancelRecording = () => {
    stopRecording();
    audioChunksRef.current = [];
    setRecordingDuration(0);
  };

  // Send voice note
  const sendVoiceNote = async () => {
    if (!selectedChatId || audioChunksRef.current.length === 0) return;

    stopRecording();
    setUploadingVoice(true);

    try {
      // Wait a bit for the last chunk to be added
      await new Promise((resolve) => setTimeout(resolve, 100));

      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      // Upload voice note
      const response = await chatService.uploadVoiceNote(
        audioBlob,
        recordingDuration
      );

      if (response.success && response.data?.attachment) {
        // Send message with voice attachment via socket
        socketService.emit("send_message", {
          chatId: selectedChatId,
          content: "",
          messageType: "voice",
          attachments: [response.data.attachment],
        });
        toast.success("Voice note sent!");
      }
    } catch (error) {
      console.error("Error sending voice note:", error);
      toast.error("Failed to send voice note");
    } finally {
      audioChunksRef.current = [];
      setRecordingDuration(0);
      setUploadingVoice(false);
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for chat list
  const formatChatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateString);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Message status component
  const MessageStatus = ({ message }) => {
    if (message.sender !== currentUserId) return null;

    if (message.isRead) {
      return <span className="text-brand-action text-[10px] ml-1">✓✓</span>;
    }
    if (message.isDelivered) {
      return <span className="text-ink-subtle text-[10px] ml-1">✓✓</span>;
    }
    return <span className="text-ink-subtle text-[10px] ml-1">✓</span>;
  };

  // Get file type display name
  const getFileTypeName = (fileType) => {
    if (fileType?.startsWith("image/")) return "Image";
    if (fileType === "application/pdf") return "PDF Document";
    if (fileType === "application/msword") return "Word Document";
    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return "Word Document";
    return "File";
  };

  // Render attachment based on type
  const renderAttachment = (attachment, isMe) => {
    const fileUrl = toAssetUrl(attachment.fileUrl);

    // Image preview
    if (attachment.fileType?.startsWith("image/")) {
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={fileUrl}
            alt={attachment.originalName || "Image"}
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </a>
      );
    }

    // Voice note player
    if (
      attachment.fileType?.startsWith("audio/") ||
      attachment.category === "voice"
    ) {
      const formatDuration = (seconds) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      };

      return (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg min-w-[200px] max-w-[280px] ${
            isMe ? "bg-brand-tint" : "bg-white border border-line-weak"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isMe ? "bg-brand-action" : "bg-line-weak"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-5 h-5 ${isMe ? "text-white" : "text-ink-muted"}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <audio
              controls
              className="w-full h-8"
              style={{ maxWidth: "180px" }}
            >
              <source
                src={fileUrl}
                type={attachment.fileType || "audio/webm"}
              />
              Your browser does not support audio.
            </audio>
            <p
              className={`text-[10px] mt-1 ${
                isMe ? "text-brand" : "text-ink-muted"
              }`}
            >
              {attachment.duration
                ? formatDuration(attachment.duration)
                : "Voice note"}
            </p>
          </div>
        </div>
      );
    }

    // Document/File box (like WhatsApp)
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition min-w-[200px] ${
          isMe ? "bg-brand-tint" : "bg-white border border-line-weak"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isMe ? "bg-brand-action" : "bg-line-weak"
          }`}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold ${
              isMe ? "text-brand" : "text-ink-muted"
            }`}
          >
            {getFileTypeName(attachment.fileType)}
          </p>
          <p className="text-[10px] text-ink-subtle truncate">
            {attachment.originalName || attachment.fileName || "File"}
          </p>
        </div>
      </a>
    );
  };

  // Check if other user is typing in current chat
  const isOtherUserTyping =
    typingUsers[selectedChatId] &&
    typingUsers[selectedChatId] !== currentUserId;

  // Filter chats by search
  const filteredChats = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) => {
      const participant =
        chat.otherParticipant ||
        chat.participants?.find((p) => p._id !== currentUserId);
      return getDisplayName(participant).toLowerCase().includes(query);
    });
  }, [chats, searchQuery, currentUserId]);

  // Shared avatar: shows the uploaded photo when available, otherwise a
  // deterministic initials badge so the UI never renders an empty circle.
  const renderAvatar = (participant, className = "h-10 w-10", fallbackSrc = "/Person.svg") => {
    const displayName = getDisplayName(participant);
    const photoUrl = participant?.profilePhoto
      ? toAssetUrl(participant.profilePhoto)
      : "";

    if (!photoUrl) {
      return (
        <span
          className={`${className} flex shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-brand-action`}
          aria-hidden="true"
        >
          {getInitials(participant)}
        </span>
      );
    }

    return (
      <img
        src={photoUrl}
        alt={displayName || "User"}
        className={`${className} shrink-0 rounded-full object-cover`}
        onError={(e) => {
          if (e.target.src !== fallbackSrc) e.target.src = fallbackSrc;
        }}
      />
    );
  };

  return (
    <div className="page-shell pb-8">
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">Messages</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            / <span className="font-medium text-ink">Messages</span>
          </p>
        </div>
      </div>

      <div className="app-container-wide pt-4 md:pt-6">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left: conversations list */}
          <div
            className={`panel flex h-[calc(100vh-180px)] min-h-[420px] w-full flex-col overflow-hidden md:h-[700px] xl:h-[780px] ${
              isMobileChatOpen ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="border-b border-line-weak p-4">
              <div className="flex h-11 w-full items-center gap-2.5 rounded-lg border border-line-weak bg-surface-raised px-3 text-sm text-ink-muted focus-within:border-brand-action focus-within:ring-2 focus-within:ring-brand-action/15">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-subtle"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingChats ? (
                <div className="loading-state py-12">
                  <div className="loading-spinner h-6 w-6"></div>
                  <p>Loading conversations...</p>
                </div>
              ) : chatsError ? (
                <div className="alert-error mx-4 mt-4 flex flex-col items-start gap-3 text-sm">
                  <p>{chatsError}</p>
                  <button
                    type="button"
                    onClick={retryChats}
                    className="btn btn-sm btn-secondary"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <p className="text-sm font-medium text-ink-muted">No conversations yet</p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    Your messages will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-5 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                    <img
                      src="/allmsg.svg"
                      alt=""
                      className="h-4 w-4"
                    />
                    <span>All messages</span>
                  </div>

                  <div className="p-2">
                    {filteredChats.map((chat) => {
                      const participant = getOtherParticipant(chat);
                      const isActive = chat._id === selectedChatId;
                      const isOnline = onlineUsers.has(participant?._id);

                      return (
                        <button
                          key={chat._id}
                          type="button"
                          onClick={() => {
                            setSelectedChatId(chat._id);
                            setIsMobileChatOpen(true);
                          }}
                          className={`flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-brand-tint text-brand-ink"
                              : "hover:bg-surface-raised"
                          }`}
                        >
                          <div className="relative shrink-0">
                            {renderAvatar(participant, "h-10 w-10")}
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success"></span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold text-ink">
                                {getDisplayName(participant)}
                              </span>
                              <span className="shrink-0 text-[10px] font-medium text-ink-subtle">
                                {formatChatTime(chat.lastMessageAt)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-ink-muted">
                                {chat.lastMessage?.content || "No messages yet"}
                              </p>
                              {chat.unreadCount > 0 && (
                                <span className="min-w-[18px] rounded-full bg-brand-action px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: chat window */}
          <div
            className={`panel h-[calc(100vh-180px)] min-h-[420px] flex-col overflow-hidden md:h-[700px] xl:h-[780px] ${
              isMobileChatOpen ? "flex" : "hidden lg:flex"
            }`}
          >
            {!selectedChatId ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <h3 className="text-lg font-semibold text-brand-ink">
                  Select a conversation
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Choose a conversation from the list to start chatting.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-4 h-[72px] border-b border-line-weak flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsMobileChatOpen(false)}
                      className="lg:hidden p-1 mr-2 text-ink-muted"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                        />
                      </svg>
                    </button>
                    <div className="relative">
                      {renderAvatar(selectedParticipant, "h-10 w-10")}
                      {onlineUsers.has(selectedParticipant?._id) && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-[100%] -tracking-[2%] text-secondary">
                        {getDisplayName(selectedParticipant)}
                      </p>
                      <p className="text-[10px] font-medium leading-[100%] -tracking-[2%] text-secondary">
                        {isOtherUserTyping
                          ? "Typing..."
                          : onlineUsers.has(selectedParticipant?._id)
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 px-[30px] pt-[30px] overflow-y-auto"
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="loading-spinner h-8 w-8"></div>
                    </div>
                  ) : messagesError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <p className="text-sm font-medium text-ink-muted">
                        {messagesError}
                      </p>
                      <button
                        type="button"
                        onClick={retryMessages}
                        className="btn btn-sm btn-secondary"
                      >
                        Retry
                      </button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-ink-subtle">
                      <p>No messages here yet...</p>
                      <p className="text-sm">
                        Say hello to start the conversation!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Pagination: load older messages above the window */}
                      <div className="mb-4 flex justify-center">
                        {isLoadingMore ? (
                          <span className="flex items-center gap-2 text-sm text-ink-muted">
                            <span className="loading-spinner h-4 w-4"></span>
                            Loading older messages…
                          </span>
                        ) : loadMoreError ? (
                          <span className="flex items-center gap-2 text-sm text-ink-muted">
                            {loadMoreError}
                            <button
                              type="button"
                              onClick={loadOlderMessages}
                              className="btn btn-sm btn-secondary"
                            >
                              Retry
                            </button>
                          </span>
                        ) : hasMore ? (
                          <button
                            type="button"
                            onClick={loadOlderMessages}
                            className="btn btn-sm btn-secondary"
                          >
                            Load earlier messages
                          </button>
                        ) : (
                          <span className="text-xs text-ink-subtle">
                            Beginning of conversation
                          </span>
                        )}
                      </div>

                      {messages.map((msg, index) => {
                      const isMe = msg.sender === currentUserId;
                      const showDateDivider =
                        index === 0 ||
                        new Date(msg.sentAt).toDateString() !==
                          new Date(messages[index - 1]?.sentAt).toDateString();

                      return (
                        <div key={msg._id || index}>
                          {showDateDivider && (
                            <div className="flex items-center justify-center my-4">
                              <span className="rounded-full border border-line-weak bg-surface-raised px-3.5 py-1 text-xs font-semibold text-ink-muted shadow-xs">
                                {new Date(msg.sentAt).toDateString() ===
                                new Date().toDateString()
                                  ? "Today"
                                  : new Date(msg.sentAt).toLocaleDateString(
                                      [],
                                      {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                              </span>
                            </div>
                          )}

                          {isMe ? (
                            <div className="flex justify-end mb-3.5 group">
                              <div className="flex items-center gap-2">
                                {/* Message menu for own messages */}
                                <div className="relative message-menu-container">
                                  <button
                                    onClick={() =>
                                      setOpenMessageMenu(
                                        openMessageMenu === msg._id
                                          ? null
                                          : msg._id
                                      )
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-line-weak rounded-full cursor-pointer"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                      className="w-4 h-4 text-ink-subtle"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                                      />
                                    </svg>
                                  </button>
                                  {openMessageMenu === msg._id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-line-weak rounded-lg shadow-lg z-10 min-w-[120px]">
                                      <button
                                        onClick={() =>
                                          handleDeleteMessage(msg._id)
                                        }
                                        disabled={deletingMessageId === msg._id}
                                        className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                      >
                                        {deletingMessageId === msg._id ? (
                                          <div className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                            />
                                          </svg>
                                        )}
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-[5px]">
                                  <div className="bg-brand-action text-white rounded-2xl rounded-br-xs px-4 py-2.5 shadow-xs max-w-[85%] sm:max-w-[540px]">
                                    {/* Render attachments */}
                                    {msg.attachments &&
                                      msg.attachments.length > 0 && (
                                        <div className="mb-2 space-y-2">
                                          {msg.attachments.map((att, idx) => (
                                            <div key={idx}>
                                              {renderAttachment(att, true)}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    {/* Render text content */}
                                    {msg.content && (
                                      <p className="text-sm font-normal leading-relaxed text-white break-words">
                                        {msg.content}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-[11px] mr-1 font-medium text-ink-muted flex items-center gap-1 mt-0.5">
                                    {formatTime(msg.sentAt)}
                                    <MessageStatus message={msg} />
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2.5 mb-3.5">
                              <span className="mt-[5px] shrink-0">
                                {renderAvatar(
                                  selectedParticipant,
                                  "h-[30px] w-[30px]"
                                )}
                              </span>
                              <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[540px]">
                                <div className="bg-surface-raised border border-line-weak rounded-2xl rounded-bl-xs px-4 py-2.5 shadow-xs">
                                  {/* Render attachments */}
                                  {msg.attachments &&
                                    msg.attachments.length > 0 && (
                                      <div className="mb-2 space-y-2">
                                        {msg.attachments.map((att, idx) => (
                                          <div key={idx}>
                                            {renderAttachment(att, false)}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  {/* Render text content */}
                                  {msg.content && (
                                    <p className="text-sm font-normal leading-relaxed text-brand-ink break-words">
                                      {msg.content}
                                    </p>
                                  )}
                                </div>
                                <p className="text-[11px] pl-1 font-medium text-ink-muted mt-0.5">
                                  {formatTime(msg.sentAt)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </>
                  )}

                  {/* Typing indicator */}
                  {isOtherUserTyping && (
                    <div className="flex items-start gap-2.5 mb-5">
                      <span className="mt-[5px] shrink-0">
                        {renderAvatar(
                          selectedParticipant,
                          "h-[30px] w-[30px]"
                        )}
                      </span>
                      <div className="bg-surface rounded-[10px] px-3.5 py-2.5">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-line rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="w-2 h-2 bg-line rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="w-2 h-2 bg-line rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="px-[30px] pb-[30px]">
                  {sendError && (
                    <div className="alert-error mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <p>{sendError}</p>
                      <button
                        type="button"
                        onClick={handleSend}
                        className="btn btn-sm btn-secondary"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 h-[52px] relative">
                    <div
                      ref={emojiPickerRef}
                      className="flex-1 flex items-center gap-3 bg-surface rounded-sm px-4 py-2 relative"
                    >
                      <div className="flex flex-row gap-4">
                        <button
                          type="button"
                          className="text-ink-subtle cursor-pointer"
                          onClick={() => setShowEmojiPicker((prev) => !prev)}
                        >
                          <img
                            src="/SmileySticker.svg"
                            alt="Emoji"
                            className="w-5 h-5"
                          />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFiles}
                        >
                          {uploadingFiles ? (
                            <div className="w-5 h-5 border-2 border-line border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <img
                              src="/link.svg"
                              alt="Attach"
                              className="w-5 h-5"
                            />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>

                      {/* Selected attachments preview */}
                      {selectedAttachments.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-line-weak rounded-lg p-3 shadow-lg max-h-[300px] overflow-y-auto">
                          <div className="flex flex-wrap gap-3">
                            {selectedAttachments.map((attachment, index) => (
                              <div key={index} className="relative">
                                {/* Image preview */}
                                {attachment.fileType?.startsWith("image/") ? (
                                  <div className="relative group">
                                    <img
                                      src={toAssetUrl(attachment.fileUrl)}
                                      alt={attachment.originalName}
                                      className="w-20 h-20 rounded-lg object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeAttachment(index)}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger/85"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  /* Document preview box */
                                  <div className="relative flex items-center gap-2 bg-surface p-2 rounded-lg min-w-[150px]">
                                    <div className="w-8 h-8 rounded bg-brand-action flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-semibold text-ink-muted">
                                        {getFileTypeName(attachment.fileType)}
                                      </p>
                                      <p className="text-[9px] text-ink-subtle truncate max-w-[100px]">
                                        {attachment.originalName}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeAttachment(index)}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger/85"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 bg-transparent outline-none text-sm text-secondary font-medium resize-none leading-[20px] min-h-[20px] max-h-[60px] overflow-y-auto placeholder:text-ink-subtle"
                      />

                      {showEmojiPicker && (
                        <div className="absolute left-0 bottom-[120%] z-20 rounded-lg bg-white shadow-lg border border-line-weak">
                          <EmojiPicker
                            onEmojiClick={(emojiData) =>
                              handleEmojiClick(emojiData.emoji)
                            }
                            searchDisabled
                            skinTonesDisabled
                            height={320}
                            width={260}
                          />
                        </div>
                      )}
                      <div className="flex flex-row gap-5">
                        {isRecording ? (
                          /* Recording UI */
                          <div className="flex items-center gap-3">
                            {/* Cancel button */}
                            <button
                              type="button"
                              onClick={cancelRecording}
                              className="p-1 hover:bg-line-weak rounded-full cursor-pointer"
                              title="Cancel recording"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-danger"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                            {/* Recording indicator */}
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-danger rounded-full animate-pulse"></span>
                              <span className="text-sm font-medium text-danger">
                                {formatRecordingTime(recordingDuration)}
                              </span>
                            </div>
                            {/* Send voice button */}
                            <button
                              type="button"
                              onClick={sendVoiceNote}
                              disabled={uploadingVoice}
                              className="w-10 h-10 flex items-center justify-center rounded-[2px] bg-brand-action text-white hover:bg-brand-action-hover transition cursor-pointer disabled:opacity-50"
                              title="Send voice note"
                            >
                              {uploadingVoice ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        ) : (
                          /* Normal mic button */
                          <button
                            type="button"
                            onClick={startRecording}
                            className="cursor-pointer hover:bg-line-weak p-1 rounded-full transition"
                            title="Record voice note"
                          >
                            <img
                              src="/mic.svg"
                              alt="Voice"
                              className="w-5 h-5"
                            />
                          </button>
                        )}
                        <button
                          onClick={handleSend}
                          disabled={
                            (!input.trim() &&
                              selectedAttachments.length === 0) ||
                            uploadingFiles ||
                            isSending
                          }
                          className="w-10 h-10 flex items-center justify-center rounded-[2px] bg-brand-action text-white hover:bg-brand-action-hover transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send message"
                        >
                          {isSending ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <img
                              src="/Send_btn.svg"
                              alt="Send"
                              className="w-5 h-5"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagePage;
