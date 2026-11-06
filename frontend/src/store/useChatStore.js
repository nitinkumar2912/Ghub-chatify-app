import { create } from "zustand";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const idOf = (value) => String(value?._id || value || "");

function upsertMessage(messages, incoming) {
  if (messages.some((message) => idOf(message._id) === idOf(incoming._id))) return messages;
  return [...messages, incoming].sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
  );
}

function sortChats(chats) {
  return [...chats].sort(
    (first, second) =>
      new Date(second.lastMessage?.createdAt || 0) -
      new Date(first.lastMessage?.createdAt || 0)
  );
}

export const useChatStore = create((set, get) => ({
  contacts: [],
  chats: [],
  selectedUser: null,
  messages: [],
  isLoadingContacts: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  onlineUsers: [],
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

  selectUser: async (user) => {
    set({ selectedUser: user, messages: [], isLoadingMessages: Boolean(user) });
    if (!user) return;

    const selectedId = idOf(user._id);
    set((state) => ({
      chats: state.chats.map((chat) =>
        idOf(chat._id) === selectedId ? { ...chat, unreadCount: 0 } : chat
      ),
    }));

    try {
      const response = await axiosInstance.get(`/messages/${selectedId}`);
      if (idOf(get().selectedUser?._id) === selectedId) {
        const mergedMessages = response.data.reduce(upsertMessage, get().messages);
        set({
          messages: mergedMessages.sort(
            (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
          ),
        });
        get().socket?.emit("message:read", { userId: selectedId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load this conversation");
    } finally {
      if (idOf(get().selectedUser?._id) === selectedId) {
        set({ isLoadingMessages: false });
      }
    }
  },

  sendMessage: async ({ text, image }) => {
    const selectedUser = get().selectedUser;
    if (!selectedUser) return null;
    set({ isSendingMessage: true });
    try {
      const response = await axiosInstance.post(`/messages/send/${idOf(selectedUser._id)}`, {
        text,
        image,
      });
      const message = response.data;
      set((state) => ({
        messages:
          idOf(state.selectedUser?._id) === idOf(selectedUser._id)
            ? upsertMessage(state.messages, message)
            : state.messages,
        chats: sortChats([
          {
            ...(state.chats.find((chat) => idOf(chat._id) === idOf(selectedUser._id)) || selectedUser),
            lastMessage: message,
            unreadCount: 0,
          },
          ...state.chats.filter((chat) => idOf(chat._id) !== idOf(selectedUser._id)),
        ]),
      }));
      return message;
    } catch (error) {
      toast.error(error.response?.data?.message || "Message could not be sent");
      return null;
    } finally {
      set({ isSendingMessage: false });
    }
  },

  connectSocket: (user) => {
    const userId = idOf(user?._id);
    if (!userId) return;
    if (get().socket && get().currentUserId === userId) return;
    get().disconnectSocket();

    const baseUrl = axiosInstance.defaults.baseURL || "";
    const socketUrl = baseUrl.replace(/\/api\/?$/, "") || undefined;
    const socket = io(socketUrl, { withCredentials: true });
    set({ socket, currentUserId: userId, connectionStatus: "connecting" });

    socket.on("connect", () => set({ connectionStatus: "connected" }));
    socket.on("disconnect", () => set({ connectionStatus: "offline", typingUsers: [] }));
    socket.on("connect_error", () => set({ connectionStatus: "offline" }));
    socket.on("presence:update", (onlineUsers) => set({ onlineUsers }));
    socket.on("typing:update", ({ userId: typingUserId, isTyping }) => {
      set((state) => ({
        typingUsers: isTyping
          ? [...new Set([...state.typingUsers, typingUserId])]
          : state.typingUsers.filter((id) => id !== typingUserId),
      }));
    });
    socket.on("message:read", ({ messageIds = [] }) => {
      const readIds = new Set(messageIds.map(idOf));
      set((state) => ({
        messages: state.messages.map((message) =>
          readIds.has(idOf(message._id)) ? { ...message, isRead: true } : message
        ),
      }));
    });
    socket.on("message:new", (message) => {
      const senderId = idOf(message.senderId);
      const receiverId = idOf(message.receiverId);
      const otherUserId = senderId === userId ? receiverId : senderId;
      const isCurrentConversation = idOf(get().selectedUser?._id) === otherUserId;

      set((state) => {
        const person =
          state.contacts.find((contact) => idOf(contact._id) === otherUserId) ||
          state.chats.find((chat) => idOf(chat._id) === otherUserId);
        const previousChat = state.chats.find((chat) => idOf(chat._id) === otherUserId);
        const nextChat = {
          ...(previousChat || person || { _id: otherUserId, fullName: "New conversation" }),
          lastMessage: message,
          unreadCount:
            receiverId === userId && !isCurrentConversation
              ? (previousChat?.unreadCount || 0) + 1
              : 0,
        };
        return {
          messages: isCurrentConversation ? upsertMessage(state.messages, message) : state.messages,
          chats: sortChats([
            nextChat,
            ...state.chats.filter((chat) => idOf(chat._id) !== otherUserId),
          ]),
        };
      });

      if (isCurrentConversation && receiverId === userId) {
        socket.emit("message:read", { userId: senderId });
      } else if (receiverId === userId && !isCurrentConversation) {
        const sender = get().contacts.find((contact) => idOf(contact._id) === senderId);
        if (sender) toast(`New message from ${sender.fullName}`, { icon: "✦" });
      }
    });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({
      socket: null,
      currentUserId: null,
      connectionStatus: "offline",
      onlineUsers: [],
      typingUsers: [],
    });
  },

  sendTyping: (toUserId, isTyping) => {
    get().socket?.emit("typing:update", { toUserId: idOf(toUserId), isTyping });
  },
}));
