import { create } from "zustand";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

const idOf = (value) => String(value?._id || value || "");
const sortMessages = (messages) =>
  [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

function upsertMessage(messages, incoming) {
  const filtered = messages.filter(
    (message) =>
      idOf(message._id) !== idOf(incoming._id) &&
      !(incoming.clientMessageId && message.clientMessageId === incoming.clientMessageId),
  );
  return sortMessages([...filtered, incoming]);
}

function sortChats(chats) {
  return [...chats].sort(
    (first, second) =>
      new Date(second.lastMessage?.createdAt || 0) - new Date(first.lastMessage?.createdAt || 0),
  );
}

function makeClientMessageId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function playMessageChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.21);
    oscillator.onended = () => context.close();
  } catch {
    // Audio may be unavailable until the user has interacted with the page.
  }
}

function notifyIncomingMessage(message, sender) {
  const user = useAuthStore.getState().authUser;
  const prefs = user?.notificationPrefs || {};
  const muted = (user?.mutedUsers || []).some((id) => idOf(id) === idOf(sender?._id));
  if (muted) return;

  if (prefs.sound !== false) playMessageChime();
  toast(`New message from ${sender?.fullName || "someone"}`, { icon: "✦" });

  if (
    document.hidden &&
    prefs.desktop &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    const preview =
      prefs.messagePreview === false
        ? "You have a new message."
        : message.image
          ? "Shared an image"
          : message.text || "You have a new message.";
    const notification = new Notification(sender?.fullName || "New Mingle message", {
      body: preview,
      icon: sender?.profilePic || "/favicon.svg",
      tag: `mingle:${idOf(sender?._id)}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

function updateChatWithMessage(state, message, otherUserId) {
  const person =
    state.contacts.find((contact) => idOf(contact._id) === otherUserId) ||
    state.chats.find((chat) => idOf(chat._id) === otherUserId);
  const previousChat = state.chats.find((chat) => idOf(chat._id) === otherUserId);
  const currentUserId = state.currentUserId;
  const receivedOutsideCurrent =
    idOf(message.receiverId) === currentUserId && idOf(state.selectedUser?._id) !== otherUserId;
  return sortChats([
    {
      ...(previousChat || person || { _id: otherUserId, fullName: "New conversation" }),
      lastMessage: message,
      unreadCount: receivedOutsideCurrent ? (previousChat?.unreadCount || 0) + 1 : 0,
    },
    ...state.chats.filter((chat) => idOf(chat._id) !== otherUserId),
  ]);
}

export const useChatStore = create((set, get) => ({
  contacts: [],
  blockedContacts: [],
  chats: [],
  selectedUser: null,
  messages: [],
  messageCursor: null,
  hasMoreMessages: false,
  isLoadingOlderMessages: false,
  offlineQueue: [],
  isLoadingContacts: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  messageSearchResults: [],
  isSearchingMessages: false,
  messageSearchRequest: 0,
  onlineUsers: [],
  presenceDetails: {},
  typingUsers: [],
  socket: null,
  currentUserId: null,
  connectionStatus: "offline",

  loadContacts: async () => {
    set({ isLoadingContacts: true });
    try {
      const [contactsResponse, chatsResponse] = await Promise.all([
        axiosInstance.get("/messages/contacts"),
        axiosInstance.get("/messages/chats"),
      ]);
      set({ contacts: contactsResponse.data, chats: chatsResponse.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load your contacts");
    } finally {
      set({ isLoadingContacts: false });
    }
  },

  loadBlockedContacts: async () => {
    try {
      const response = await axiosInstance.get("/messages/contacts/blocked");
      set({ blockedContacts: response.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load blocked people");
    }
  },

  prepareMessageSearch: (query) => {
    const requestId = get().messageSearchRequest + 1;
    set({
      messageSearchRequest: requestId,
      messageSearchResults: [],
      isSearchingMessages: query.trim().length >= 2,
    });
    return requestId;
  },

  searchMessages: async (query, requestId = get().messageSearchRequest) => {
    if (query.trim().length < 2 || requestId !== get().messageSearchRequest) return;
    try {
      const response = await axiosInstance.get("/messages/search", { params: { q: query } });
      if (get().messageSearchRequest === requestId) set({ messageSearchResults: response.data });
    } catch (error) {
      if (get().messageSearchRequest === requestId) {
        set({ messageSearchResults: [] });
        toast.error(error.response?.data?.message || "Could not search messages");
      }
    } finally {
      if (get().messageSearchRequest === requestId) set({ isSearchingMessages: false });
    }
  },

  clearMessageSearch: () =>
    set((state) => ({
      messageSearchRequest: state.messageSearchRequest + 1,
      messageSearchResults: [],
      isSearchingMessages: false,
    })),

  setUserBlocked: async (userId, blocked) => {
    try {
      const response = await axiosInstance.post(`/messages/contacts/${userId}/block`, { blocked });
      useAuthStore.setState((state) => ({
        authUser: state.authUser
          ? { ...state.authUser, blockedUsers: response.data.blockedUsers }
          : null,
      }));
      if (blocked) {
        set((state) => ({
          contacts: state.contacts.filter((contact) => idOf(contact._id) !== idOf(userId)),
          chats: state.chats.filter((chat) => idOf(chat._id) !== idOf(userId)),
          blockedContacts: state.contacts.filter((contact) => idOf(contact._id) === idOf(userId)),
          selectedUser: idOf(state.selectedUser?._id) === idOf(userId) ? null : state.selectedUser,
          messages: idOf(state.selectedUser?._id) === idOf(userId) ? [] : state.messages,
          messageSearchRequest: state.messageSearchRequest + 1,
          messageSearchResults: [],
          isSearchingMessages: false,
          offlineQueue: state.offlineQueue.filter(
            (message) => idOf(message.receiverId) !== idOf(userId),
          ),
        }));
      } else {
        await get().loadContacts();
        await get().loadBlockedContacts();
      }
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update this person");
      return null;
    }
  },

  setUserMuted: async (userId, muted) => {
    try {
      const response = await axiosInstance.post(`/messages/contacts/${userId}/mute`, { muted });
      useAuthStore.setState((state) => ({
        authUser: state.authUser
          ? { ...state.authUser, mutedUsers: response.data.mutedUsers }
          : null,
      }));
      toast.success(muted ? "Notifications muted for this conversation" : "Notifications unmuted");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update notification settings");
      return null;
    }
  },

  reportUser: async (userId, reason) => {
    try {
      const response = await axiosInstance.post(`/messages/contacts/${userId}/report`, { reason });
      toast.success(response.data.message || "Report submitted");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit this report");
      return null;
    }
  },

  selectUser: async (user) => {
    const selectedId = idOf(user?._id);
    set({
      selectedUser: user,
      messages: [],
      messageCursor: null,
      hasMoreMessages: false,
      isLoadingOlderMessages: false,
      isLoadingMessages: Boolean(user),
    });
    if (!user) return;

    set((state) => ({
      chats: state.chats.map((chat) =>
        idOf(chat._id) === selectedId ? { ...chat, unreadCount: 0 } : chat,
      ),
    }));

    try {
      const response = await axiosInstance.get(`/messages/${selectedId}`, {
        params: { limit: 50 },
      });
      if (idOf(get().selectedUser?._id) === selectedId) {
        const payload = response.data;
        const initialMessages = Array.isArray(payload) ? payload : payload.messages || [];
        set({
          messages: initialMessages,
          messageCursor: payload.nextCursor || null,
          hasMoreMessages: Boolean(payload.hasMore),
        });
        get().socket?.emit("message:read", { withUserId: selectedId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load this conversation");
    } finally {
      if (idOf(get().selectedUser?._id) === selectedId) set({ isLoadingMessages: false });
    }
  },

  loadOlderMessages: async () => {
    const { selectedUser, messageCursor, hasMoreMessages, isLoadingOlderMessages } = get();
    if (!selectedUser || !messageCursor || !hasMoreMessages || isLoadingOlderMessages) return;
    const selectedId = idOf(selectedUser._id);
    set({ isLoadingOlderMessages: true });
    try {
      const response = await axiosInstance.get(`/messages/${selectedId}`, {
        params: { cursor: messageCursor, limit: 50 },
      });
      if (idOf(get().selectedUser?._id) !== selectedId) return;
      const payload = response.data;
      set((state) => ({
        messages: sortMessages([...payload.messages, ...state.messages]),
        messageCursor: payload.nextCursor || null,
        hasMoreMessages: Boolean(payload.hasMore),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load older messages");
    } finally {
      set({ isLoadingOlderMessages: false });
    }
  },

  sendMessage: async ({ text, image, replyTo }) => {
    const selectedUser = get().selectedUser;
    if (!selectedUser) return null;
    const previousChat = get().chats.find((chat) => idOf(chat._id) === idOf(selectedUser._id));
    const clientMessageId = makeClientMessageId();
    const receiverId = idOf(selectedUser._id);
    const queuedMessage = {
      _id: clientMessageId,
      clientMessageId,
      senderId: get().currentUserId,
      receiverId,
      text,
      image,
      replyTo,
      createdAt: new Date().toISOString(),
      status: "sending",
      isRead: false,
    };
    set((state) => ({
      messages: upsertMessage(state.messages, queuedMessage),
      chats: updateChatWithMessage(state, queuedMessage, receiverId),
      isSendingMessage: true,
    }));
    try {
      const response = await axiosInstance.post(`/messages/send/${receiverId}`, {
        text,
        image,
        replyTo,
        clientMessageId,
      });
      const message = response.data;
      message.status = message.isRead ? "read" : message.deliveredAt ? "delivered" : "sent";
      set((state) => ({
        messages:
          idOf(state.selectedUser?._id) === receiverId
            ? upsertMessage(state.messages, message)
            : state.messages,
        chats: updateChatWithMessage(state, message, receiverId),
      }));
      return message;
    } catch (error) {
      const networkFailure =
        error.code === "ERR_NETWORK" || (!error.response && Boolean(error.request));
      if (networkFailure) {
        queuedMessage.status = "queued";
        set((state) => ({
          messages:
            idOf(state.selectedUser?._id) === receiverId
              ? upsertMessage(state.messages, queuedMessage)
              : state.messages,
          offlineQueue: [
            ...state.offlineQueue,
            { receiverId, text, image, replyTo, clientMessageId },
          ],
          chats: updateChatWithMessage(state, queuedMessage, receiverId),
        }));
        toast("Message queued. It will send when you’re back online.", { icon: "↗" });
        return queuedMessage;
      }
      set((state) => ({
        messages: state.messages.filter((message) => message.clientMessageId !== clientMessageId),
        chats: sortChats([
          ...(previousChat &&
          state.chats.some(
            (chat) =>
              idOf(chat._id) === idOf(previousChat._id) &&
              chat.lastMessage?.clientMessageId === clientMessageId,
          )
            ? [previousChat]
            : []),
          ...state.chats.filter((chat) => chat.lastMessage?.clientMessageId !== clientMessageId),
        ]),
      }));
      toast.error(error.response?.data?.message || "Message could not be sent");
      return null;
    } finally {
      set({ isSendingMessage: false });
    }
  },

  flushOfflineQueue: async () => {
    if (get().connectionStatus !== "connected") return;
    for (const queued of [...get().offlineQueue]) {
      if (get().connectionStatus !== "connected") return;
      try {
        const response = await axiosInstance.post(`/messages/send/${queued.receiverId}`, queued);
        const message = response.data;
        message.status = message.isRead ? "read" : message.deliveredAt ? "delivered" : "sent";
        set((state) => ({
          offlineQueue: state.offlineQueue.filter(
            (item) => item.clientMessageId !== queued.clientMessageId,
          ),
          messages:
            idOf(state.selectedUser?._id) === queued.receiverId
              ? upsertMessage(state.messages, message)
              : state.messages,
          chats: updateChatWithMessage(state, message, queued.receiverId),
        }));
      } catch (error) {
        if (error.code === "ERR_NETWORK" || !error.response) return;
        set((state) => ({
          offlineQueue: state.offlineQueue.filter(
            (item) => item.clientMessageId !== queued.clientMessageId,
          ),
        }));
        toast.error(error.response?.data?.message || "A queued message could not be sent");
      }
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const response = await axiosInstance.patch(`/messages/${messageId}`, { text });
      set((state) => ({
        messages: state.messages.map((message) =>
          idOf(message._id) === idOf(messageId) ? response.data : message,
        ),
        chats: state.chats.map((chat) =>
          idOf(chat.lastMessage?._id) === idOf(messageId)
            ? { ...chat, lastMessage: response.data }
            : chat,
        ),
      }));
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not edit this message");
      return null;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const response = await axiosInstance.delete(`/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.map((message) =>
          idOf(message._id) === idOf(messageId) ? response.data : message,
        ),
        chats: state.chats.map((chat) =>
          idOf(chat.lastMessage?._id) === idOf(messageId)
            ? { ...chat, lastMessage: response.data }
            : chat,
        ),
      }));
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete this message");
      return null;
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const response = await axiosInstance.post(`/messages/${messageId}/reactions`, { emoji });
      set((state) => ({
        messages: state.messages.map((message) =>
          idOf(message._id) === idOf(messageId) ? response.data : message,
        ),
      }));
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add this reaction");
      return null;
    }
  },

  togglePin: async (messageId) => {
    try {
      const response = await axiosInstance.post(`/messages/${messageId}/pin`);
      set((state) => ({
        messages: state.messages.map((message) =>
          idOf(message._id) === idOf(messageId) ? response.data : message,
        ),
      }));
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not pin this message");
      return null;
    }
  },

  connectSocket: (user) => {
    const userId = idOf(user?._id);
    if (!userId) return;
    if (get().socket && get().currentUserId === userId) return;
    get().disconnectSocket();

    const baseUrl = axiosInstance.defaults.baseURL || "";
    const socketUrl = baseUrl.replace(/\/api\/?$/, "") || undefined;
    const socket = io(socketUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });
    set({ socket, currentUserId: userId, connectionStatus: "connecting" });

    socket.on("connect", () => {
      set({ connectionStatus: "connected" });
      get().flushOfflineQueue();
    });
    socket.on("disconnect", () => set({ connectionStatus: "offline", typingUsers: [] }));
    socket.on("connect_error", (error) => {
      set({ connectionStatus: "offline" });
      if (error.message === "Authentication required" && !socket.refreshing) {
        socket.refreshing = true;
        axiosInstance
          .post("/auth/refresh")
          .then(() => socket.connect())
          .catch(() => window.dispatchEvent(new Event("mingle:session-expired")))
          .finally(() => {
            socket.refreshing = false;
          });
      }
    });
    socket.on("presence:update", (onlineUsers) => set({ onlineUsers }));
    socket.on("presence:details", (users) =>
      set({
        presenceDetails: Object.fromEntries(users.map((user) => [idOf(user._id), user])),
      }),
    );
    socket.on("presence:lastSeen", ({ userId: changedId, ...presence }) =>
      set((state) => ({
        presenceDetails: { ...state.presenceDetails, [changedId]: { _id: changedId, ...presence } },
      })),
    );
    socket.on("typing:update", ({ userId: typingUserId, isTyping }) => {
      set((state) => ({
        typingUsers: isTyping
          ? [...new Set([...state.typingUsers, typingUserId])]
          : state.typingUsers.filter((id) => id !== typingUserId),
      }));
    });
    socket.on("message:delivered", ({ messageIds = [], deliveredAt }) => {
      const deliveredIds = new Set(messageIds.map(idOf));
      set((state) => ({
        messages: state.messages.map((message) =>
          deliveredIds.has(idOf(message._id))
            ? { ...message, deliveredAt, status: message.isRead ? "read" : "delivered" }
            : message,
        ),
      }));
    });
    socket.on("message:read", ({ messageIds = [], readAt }) => {
      const readIds = new Set(messageIds.map(idOf));
      set((state) => ({
        messages: state.messages.map((message) =>
          readIds.has(idOf(message._id))
            ? {
                ...message,
                isRead: true,
                readAt: readAt || new Date().toISOString(),
                status: "read",
              }
            : message,
        ),
      }));
    });
    socket.on("message:updated", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          idOf(message._id) === idOf(updatedMessage._id) ? updatedMessage : message,
        ),
        chats: state.chats.map((chat) =>
          idOf(chat.lastMessage?._id) === idOf(updatedMessage._id)
            ? { ...chat, lastMessage: updatedMessage }
            : chat,
        ),
      }));
    });
    socket.on("message:new", (message) => {
      const senderId = idOf(message.senderId);
      const receiverId = idOf(message.receiverId);
      const otherUserId = senderId === userId ? receiverId : senderId;
      const currentConversation = idOf(get().selectedUser?._id) === otherUserId;
      message.status = message.isRead ? "read" : message.deliveredAt ? "delivered" : "sent";

      set((state) => ({
        messages: currentConversation ? upsertMessage(state.messages, message) : state.messages,
        chats: updateChatWithMessage(state, message, otherUserId),
      }));

      if (currentConversation && receiverId === userId) {
        socket.emit("message:read", { withUserId: senderId });
      } else if (receiverId === userId && !currentConversation) {
        const sender = get().contacts.find((contact) => idOf(contact._id) === senderId);
        notifyIncomingMessage(message, sender);
      }
    });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({
      socket: null,
      currentUserId: null,
      connectionStatus: "offline",
      contacts: [],
      blockedContacts: [],
      chats: [],
      selectedUser: null,
      messages: [],
      messageCursor: null,
      hasMoreMessages: false,
      offlineQueue: [],
      messageSearchResults: [],
      isSearchingMessages: false,
      messageSearchRequest: get().messageSearchRequest + 1,
      onlineUsers: [],
      presenceDetails: {},
      typingUsers: [],
    });
  },

  sendTyping: (toUserId, isTyping) => {
    get().socket?.emit("typing:update", { toUserId: idOf(toUserId), isTyping });
  },
}));
