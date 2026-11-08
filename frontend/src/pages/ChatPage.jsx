import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  Clock3,
  Copy,
  Flag,
  LogOut,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Paperclip,
  Pin,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const EMOJI_OPTIONS = ["😊", "😂", "🥹", "❤️", "🙌", "✨", "👀", "🔥"];
const getId = (value) => String(value?._id || value || "");
const getInitials = (name = "?") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function Avatar({ user, online = false, size = "avatar-md" }) {
  return (
    <span className={`avatar ${size}`}>
      {user?.profilePic ? (
        <img src={user.profilePic} alt="" />
      ) : (
        <span>{getInitials(user?.fullName)}</span>
      )}
      {online && <i className="presence-dot" />}
    </span>
  );
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateSeparator(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return reject(new Error("Choose a JPEG, PNG, or WebP image"));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Images must be smaller than 8 MB"));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image"));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("Could not open this image"));
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ChatPage({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const { authUser, logout } = useAuthStore();
  const {
    contacts,
    chats,
    selectedUser,
    messages,
    isLoadingContacts,
    isLoadingMessages,
    isSendingMessage,
    onlineUsers,
    presenceDetails,
    typingUsers,
    connectionStatus,
    loadContacts,
    loadOlderMessages,
    hasMoreMessages,
    isLoadingOlderMessages,
    selectUser,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePin,
    sendTyping,
    messageSearchResults,
    isSearchingMessages,
    prepareMessageSearch,
    searchMessages,
    clearMessageSearch,
    setUserMuted,
    setUserBlocked,
    reportUser,
  } = useChatStore();
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState("people");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const messageEndRef = useRef(null);
  const messageStreamRef = useRef(null);
  const searchInputRef = useRef(null);
  const preserveScrollRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const imageInputRef = useRef(null);
  const draftInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (searchMode !== "messages") {
      clearMessageSearch();
      return;
    }
    const requestId = prepareMessageSearch(search);
    if (search.trim().length < 2) return;
    const timeout = setTimeout(() => searchMessages(search, requestId), 250);
    return () => clearTimeout(timeout);
  }, [clearMessageSearch, prepareMessageSearch, search, searchMode, searchMessages]);

  useEffect(() => {
    const stream = messageStreamRef.current;
    if (preserveScrollRef.current && stream) {
      const { scrollTop, scrollHeight } = preserveScrollRef.current;
      stream.scrollTop = scrollTop + stream.scrollHeight - scrollHeight;
      preserveScrollRef.current = null;
    } else if (stickToBottomRef.current) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, selectedUser]);

  useEffect(
    () => () => {
      clearTimeout(typingTimeoutRef.current);
      if (selectedUser) sendTyping(selectedUser._id, false);
    },
    [selectedUser, sendTyping],
  );

  const chatsById = useMemo(() => new Map(chats.map((chat) => [getId(chat._id), chat])), [chats]);
  const visibleContacts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contacts
      .filter((contact) => {
        const contactChat = chatsById.get(getId(contact._id));
        const matchesSearch = !needle || contact.fullName.toLowerCase().includes(needle);
        const matchesFilter = filter !== "unread" || contactChat?.unreadCount > 0;
        return matchesSearch && matchesFilter;
      })
      .sort((first, second) => {
        const firstChat = chatsById.get(getId(first._id));
        const secondChat = chatsById.get(getId(second._id));
        return (
          new Date(secondChat?.lastMessage?.createdAt || 0) -
          new Date(firstChat?.lastMessage?.createdAt || 0)
        );
      });
  }, [contacts, chatsById, filter, search]);

  const isOnline = (user) => onlineUsers.includes(getId(user?._id));
  const isTyping = selectedUser && typingUsers.includes(getId(selectedUser._id));
  const isMuted = (authUser?.mutedUsers || []).some(
    (mutedId) => getId(mutedId) === getId(selectedUser?._id),
  );

  const handleDraftChange = (event) => {
    const nextValue = event.target.value;
    setDraft(nextValue);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 110)}px`;
    if (!selectedUser) return;
    sendTyping(selectedUser._id, Boolean(nextValue.trim()));
    clearTimeout(typingTimeoutRef.current);
    if (nextValue.trim()) {
      typingTimeoutRef.current = setTimeout(() => sendTyping(selectedUser._id, false), 1100);
    }
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setImagePreview(await compressImage(file));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if ((!draft.trim() && !imagePreview) || isSendingMessage) return;
    if (editingMessage) {
      const updated = await editMessage(editingMessage._id, draft.trim());
      if (updated) {
        setDraft("");
        setEditingMessage(null);
        if (draftInputRef.current) draftInputRef.current.style.height = "auto";
      }
      return;
    }
    clearTimeout(typingTimeoutRef.current);
    if (selectedUser) sendTyping(selectedUser._id, false);
    const result = await sendMessage({
      text: draft.trim(),
      image: imagePreview || undefined,
      replyTo: replyingTo?._id,
    });
    if (result) {
      setDraft("");
      setImagePreview("");
      setShowEmoji(false);
      setReplyingTo(null);
      if (draftInputRef.current) draftInputRef.current.style.height = "auto";
    }
  };

  const insertEmoji = (emoji) => {
    setDraft((value) => `${value}${emoji}`);
    setShowEmoji(false);
  };

  const selectContact = (contact) => {
    setDraft("");
    setImagePreview("");
    setShowEmoji(false);
    setEditingMessage(null);
    setReplyingTo(null);
    preserveScrollRef.current = null;
    stickToBottomRef.current = true;
    if (draftInputRef.current) draftInputRef.current.style.height = "auto";
    selectUser(contact);
  };

  const closeConversation = useCallback(() => {
    setDraft("");
    setImagePreview("");
    setShowEmoji(false);
    setEditingMessage(null);
    setReplyingTo(null);
    preserveScrollRef.current = null;
    if (draftInputRef.current) draftInputRef.current.style.height = "auto";
    selectUser(null);
  }, [selectUser]);

  useEffect(() => {
    const handleShortcuts = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchMode("messages");
        searchInputRef.current?.focus();
      } else if (event.key === "Escape") {
        if (showReportDialog) setShowReportDialog(false);
        else if (showContactMenu) setShowContactMenu(false);
        else if (showEmoji) setShowEmoji(false);
        else if (editingMessage || replyingTo) {
          setEditingMessage(null);
          setReplyingTo(null);
          setDraft("");
        } else if (selectedUser) closeConversation();
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [
    closeConversation,
    editingMessage,
    replyingTo,
    selectedUser,
    showContactMenu,
    showEmoji,
    showReportDialog,
  ]);

  useEffect(() => {
    if (!showEmoji) return;
    const handleClickOutside = (event) => {
      const emojiEl = document.querySelector(".emoji-wrap");
      if (emojiEl && !emojiEl.contains(event.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleReport = async (event) => {
    event.preventDefault();
    if (!selectedUser || reportReason.trim().length < 4) return;
    const result = await reportUser(selectedUser._id, reportReason.trim());
    if (result) {
      setReportReason("");
      setShowReportDialog(false);
      setShowContactMenu(false);
    }
  };

  const handleCopyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text || message.image || "");
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy this message");
    }
  };

  const handleBlock = async () => {
    if (!selectedUser) return;
    const result = await setUserBlocked(selectedUser._id, true);
    if (result) {
      toast.success(`${selectedUser.fullName} is blocked`);
      closeConversation();
    }
  };

  const handleToggleMute = async () => {
    if (!selectedUser) return;
    await setUserMuted(selectedUser._id, !isMuted);
    setShowContactMenu(false);
  };

  const openSearchResult = (message) => {
    const userId =
      getId(message.senderId) === getId(authUser?._id)
        ? getId(message.receiverId)
        : getId(message.senderId);
    const contact = contacts.find((person) => getId(person._id) === userId);
    if (!contact) return;
    setSearchMode("people");
    setSearch("");
    clearMessageSearch();
    selectContact(contact);
  };

  return (
    <main className={`chat-workspace ${selectedUser ? "has-selection" : ""}`}>
      <aside className="inbox-panel">
        <div className="inbox-brand-row">
          <div className="brand-mark">
            <MessageCircle size={19} strokeWidth={2.4} />
          </div>
          <span className="brand-name">
            mingle<span>.</span>
          </span>
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          <div
            className={`connection-pill ${connectionStatus}`}
            title={`Realtime ${connectionStatus}`}
          >
            <span />
            <span>
              {connectionStatus === "connected"
                ? "Live"
                : connectionStatus === "connecting"
                  ? "Connecting"
                  : "Offline"}
            </span>
          </div>
        </div>

        <div className="inbox-heading-row">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1>Messages</h1>
          </div>
          <div className="online-count">
            <span />
            {onlineUsers.length} online
          </div>
        </div>

        <label className="search-field">
          <Search size={17} />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchMode === "messages" ? "Search message history…" : "Search people…"}
            aria-label={searchMode === "messages" ? "Search message history" : "Search people"}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </label>

        <div className="search-scope" role="tablist" aria-label="Search scope">
          <button
            type="button"
            role="tab"
            aria-selected={searchMode === "people"}
            className={searchMode === "people" ? "active" : ""}
            onClick={() => setSearchMode("people")}
          >
            People
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={searchMode === "messages"}
            className={searchMode === "messages" ? "active" : ""}
            onClick={() => setSearchMode("messages")}
          >
            Messages
          </button>
        </div>

        <div className="inbox-filters" role="tablist" aria-label="Conversation filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            All people
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>

        <div className="conversation-list">
          <div className="list-caption">
            <span>
              {searchMode === "messages"
                ? "MESSAGE RESULTS"
                : filter === "unread"
                  ? "UNREAD"
                  : chats.length
                    ? "RECENT & PEOPLE"
                    : "PEOPLE"}
            </span>
            <span>
              {searchMode === "messages" ? messageSearchResults.length : visibleContacts.length}
            </span>
          </div>
          {searchMode === "messages" ? (
            search.trim().length < 2 ? (
              <div className="empty-people">
                <div className="empty-icon">
                  <MessageSquareText size={19} />
                </div>
                <strong>Search your conversations</strong>
                <span>Enter at least two characters to find a message.</span>
              </div>
            ) : isSearchingMessages ? (
              <div className="list-loading">
                <span className="spinner" />
                Looking through your messages…
              </div>
            ) : messageSearchResults.length ? (
              messageSearchResults.map((message) => {
                const otherId =
                  getId(message.senderId) === getId(authUser?._id)
                    ? getId(message.receiverId)
                    : getId(message.senderId);
                const contact = contacts.find((person) => getId(person._id) === otherId);
                if (!contact) return null;
                return (
                  <button
                    type="button"
                    className="search-result-item"
                    key={message._id}
                    onClick={() => openSearchResult(message)}
                  >
                    <Avatar user={contact} online={isOnline(contact)} size="avatar-sm" />
                    <span className="search-result-copy">
                      <strong>{contact.fullName}</strong>
                      <span>{message.text || "Shared an image"}</span>
                    </span>
                    <time>{formatTime(message.createdAt)}</time>
                  </button>
                );
              })
            ) : (
              <div className="empty-people">
                <div className="empty-icon">
                  <Search size={19} />
                </div>
                <strong>No messages found</strong>
                <span>Try a different word or phrase.</span>
              </div>
            )
          ) : isLoadingContacts ? (
            <div className="list-loading">
              <span className="spinner" />
              Finding your people…
            </div>
          ) : visibleContacts.length ? (
            visibleContacts.map((contact) => {
              const contactChat = chatsById.get(getId(contact._id));
              const active = getId(selectedUser?._id) === getId(contact._id);
              const lastMessage = contactChat?.lastMessage;
              const preview = lastMessage?.deletedAt
                ? "Message deleted"
                : lastMessage?.image
                  ? "Shared an image"
                  : lastMessage?.text || "Say hello";
              return (
                <button
                  type="button"
                  className={`conversation-item ${active ? "active" : ""}`}
                  key={contact._id}
                  onClick={() => selectContact(contact)}
                >
                  <Avatar user={contact} online={isOnline(contact)} />
                  <span className="conversation-copy">
                    <span className="conversation-topline">
                      <span className="conversation-name">{contact.fullName}</span>
                      <span className="conversation-time">
                        {formatTime(lastMessage?.createdAt)}
                      </span>
                    </span>
                    <span className="conversation-bottomline">
                      <span className="conversation-preview">{preview}</span>
                      {contactChat?.unreadCount > 0 && (
                        <span className="unread-badge">
                          {contactChat.unreadCount > 9 ? "9+" : contactChat.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="empty-people">
              <div className="empty-icon">
                <Search size={19} />
              </div>
              <strong>
                {filter === "unread"
                  ? "All caught up"
                  : search
                    ? "No one found"
                    : "Your people will show up here"}
              </strong>
              <span>
                {filter === "unread"
                  ? "You have no unread messages."
                  : search
                    ? "Try another name."
                    : "Create another account to start a conversation."}
              </span>
            </div>
          )}
        </div>

        <div className="profile-footer">
          <button
            type="button"
            className="profile-user-btn"
            onClick={() => navigate("/profile")}
            title="Edit your profile and settings"
            aria-label="Open your profile and settings"
          >
            <Avatar user={authUser} size="avatar-sm" />
            <div className="profile-copy">
              <strong>{authUser?.fullName}</strong>
              <span>{authUser?.username ? `@${authUser.username}` : authUser?.email}</span>
            </div>
          </button>
          <button
            type="button"
            className="icon-button logout-button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <section className="conversation-panel">
        {selectedUser ? (
          <>
            <header className="conversation-header">
              <button
                className="icon-button mobile-back"
                onClick={closeConversation}
                aria-label="Back to messages"
              >
                <ArrowLeft size={18} />
              </button>
              <Avatar user={selectedUser} online={isOnline(selectedUser)} />
              <div className="header-user-copy">
                <h2>{selectedUser.fullName}</h2>
                <span>
                  {isTyping ? (
                    <span className="typing-label">
                      Typing <i>···</i>
                    </span>
                  ) : isOnline(selectedUser) ? (
                    "Active now"
                  ) : presenceDetails[getId(selectedUser._id)]?.lastSeen ? (
                    `Last seen ${formatTime(presenceDetails[getId(selectedUser._id)].lastSeen)}`
                  ) : (
                    "Offline"
                  )}
                </span>
              </div>
              <div className="header-actions">
                <span className="privacy-label">
                  <ShieldCheck size={14} /> Private conversation
                </span>
                <div className="contact-menu-wrap">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Conversation options"
                    aria-expanded={showContactMenu}
                    aria-controls="contact-options"
                    onClick={() => setShowContactMenu((open) => !open)}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                  {showContactMenu && (
                    <div className="contact-options" id="contact-options">
                      <button type="button" onClick={handleToggleMute}>
                        {isMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                        {isMuted ? "Unmute notifications" : "Mute notifications"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReportDialog(true);
                          setShowContactMenu(false);
                        }}
                      >
                        <Flag size={15} /> Report person
                      </button>
                      <button type="button" className="contact-option-danger" onClick={handleBlock}>
                        <Ban size={15} /> Block person
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div
              className="message-stream"
              ref={messageStreamRef}
              onScroll={(event) => {
                const stream = event.currentTarget;
                stickToBottomRef.current =
                  stream.scrollHeight - stream.scrollTop - stream.clientHeight < 90;
                setShowScrollBtn(
                  stream.scrollHeight - stream.scrollTop - stream.clientHeight > 300,
                );
                if (stream.scrollTop < 36 && hasMoreMessages && !isLoadingOlderMessages) {
                  preserveScrollRef.current = {
                    scrollTop: stream.scrollTop,
                    scrollHeight: stream.scrollHeight,
                  };
                  loadOlderMessages();
                }
              }}
            >
              {isLoadingOlderMessages && (
                <div className="older-messages-loading">
                  <span className="spinner" />
                  Loading older messages…
                </div>
              )}
              <div className="conversation-intro">
                <Avatar user={selectedUser} online={isOnline(selectedUser)} size="avatar-xl" />
                <strong>{selectedUser.fullName}</strong>
                <span>
                  {isOnline(selectedUser) ? "Around and ready to chat" : "Start a conversation"}
                </span>
                <div>
                  <ShieldCheck size={13} /> Messages are private between you two
                </div>
              </div>

              {isLoadingMessages ? (
                <div className="messages-loading">
                  <span className="spinner" />
                  Loading conversation…
                </div>
              ) : messages.length ? (
                <div className="message-list">
                  {messages.map((message, index) => {
                    const ownMessage = getId(message.senderId) === getId(authUser?._id);
                    const quotedMessage =
                      message.replyTo &&
                      messages.find((item) => getId(item._id) === getId(message.replyTo));
                    const prevMessage = messages[index - 1];
                    const showDateSeparator =
                      !prevMessage ||
                      new Date(prevMessage.createdAt).toDateString() !==
                        new Date(message.createdAt).toDateString();
                    const isGrouped =
                      prevMessage &&
                      getId(prevMessage.senderId) === getId(message.senderId) &&
                      new Date(message.createdAt) - new Date(prevMessage.createdAt) < 120000;
                    return (
                      <div key={message._id}>
                        {showDateSeparator && (
                          <div className="date-separator">
                            <span>{formatDateSeparator(message.createdAt)}</span>
                          </div>
                        )}
                        <div
                          className={`message-row ${ownMessage ? "own" : "theirs"}${isGrouped ? " grouped" : ""}`}
                        >
                          {!ownMessage && <Avatar user={selectedUser} size="avatar-xs" />}
                          <div className="message-content">
                            {message.replyTo && (
                              <blockquote className="message-quote">
                                {quotedMessage?.text || "Replied to a message"}
                              </blockquote>
                            )}
                            <div
                              className={`message-bubble ${ownMessage ? "outgoing" : "incoming"}`}
                            >
                              {message.deletedAt ? (
                                <p className="deleted-message">This message was deleted.</p>
                              ) : (
                                <>
                                  {message.image && (
                                    <a
                                      className="message-image-link"
                                      href={message.image}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <img src={message.image} alt="Shared attachment" />
                                    </a>
                                  )}
                                  {message.text && <p>{message.text}</p>}
                                </>
                              )}
                            </div>
                            {message.reactions?.length > 0 && (
                              <div className="message-reactions">
                                {message.reactions.map((reaction, index) => (
                                  <button
                                    type="button"
                                    key={`${reaction.userId}-${reaction.emoji}-${index}`}
                                    onClick={() => toggleReaction(message._id, reaction.emoji)}
                                    aria-label={`React ${reaction.emoji}`}
                                  >
                                    {reaction.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                            {!message.deletedAt && (
                              <div className="message-actions">
                                {message.text && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessage(message)}
                                    aria-label="Copy message"
                                    title="Copy"
                                  >
                                    <Copy size={13} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(message);
                                    setEditingMessage(null);
                                  }}
                                  aria-label="Reply to message"
                                  title="Reply"
                                >
                                  <Reply size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleReaction(message._id, "❤️")}
                                  aria-label="React with a heart"
                                  title="React with a heart"
                                >
                                  ♥
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePin(message._id)}
                                  aria-label={message.isPinned ? "Unpin message" : "Pin message"}
                                  title={message.isPinned ? "Unpin" : "Pin"}
                                >
                                  <Pin
                                    size={13}
                                    fill={message.isPinned ? "currentColor" : "none"}
                                  />
                                </button>
                                {ownMessage && message.text && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMessage(message);
                                        setReplyingTo(null);
                                        setDraft(message.text || "");
                                        draftInputRef.current?.focus();
                                      }}
                                      aria-label="Edit message"
                                      title="Edit"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteMessage(message._id)}
                                      aria-label="Delete message"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            <div className={`message-meta ${ownMessage ? "align-right" : ""}`}>
                              <time>{formatMessageTime(message.createdAt)}</time>
                              {message.editedAt && !message.deletedAt && <span>edited</span>}
                              {message.isPinned && <Pin size={11} title="Pinned" />}
                              {ownMessage &&
                                (message.status === "queued" || message.status === "sending" ? (
                                  <Clock3
                                    size={13}
                                    className="pending-check"
                                    title={message.status === "queued" ? "Queued" : "Sending"}
                                  />
                                ) : message.isRead || message.status === "read" ? (
                                  <CheckCheck size={13} className="read-check" />
                                ) : message.status === "delivered" || message.deliveredAt ? (
                                  <CheckCheck
                                    size={13}
                                    className="delivered-check"
                                    title="Delivered"
                                  />
                                ) : (
                                  <Check size={13} title="Sent" />
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="typing-bubble">
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </div>
              ) : (
                <div className="first-message">
                  <div className="first-message-spark">
                    <Sparkles size={17} />
                  </div>
                  <strong>Make the first move</strong>
                  <span>A little hello can go a long way.</span>
                </div>
              )}
              {showScrollBtn && (
                <button
                  type="button"
                  className="scroll-to-bottom"
                  onClick={() => {
                    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    stickToBottomRef.current = true;
                  }}
                  aria-label="Scroll to latest messages"
                >
                  <ArrowDown size={16} />
                </button>
              )}
            </div>

            <div className="composer-area">
              {(editingMessage || replyingTo) && (
                <div className="composer-context">
                  <span>
                    {editingMessage
                      ? "Editing message"
                      : `Replying to ${getId(replyingTo.senderId) === getId(authUser?._id) ? "yourself" : selectedUser.fullName}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessage(null);
                      setReplyingTo(null);
                      setDraft("");
                    }}
                    aria-label="Cancel message action"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
              {imagePreview && (
                <div className="attachment-preview">
                  <img src={imagePreview} alt="Selected attachment preview" />
                  <span>Ready to share</span>
                  <button
                    type="button"
                    onClick={() => setImagePreview("")}
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <form className="message-composer" onSubmit={handleSend}>
                <button
                  type="button"
                  className="composer-icon"
                  onClick={() => imageInputRef.current?.click()}
                  title="Add an image"
                  aria-label="Add an image"
                >
                  <Paperclip size={19} />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  hidden
                />
                <textarea
                  ref={draftInputRef}
                  value={draft}
                  onChange={handleDraftChange}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend(event);
                    }
                  }}
                  rows="1"
                  maxLength={2000}
                  placeholder={
                    editingMessage
                      ? "Edit your message..."
                      : replyingTo
                        ? "Write a reply..."
                        : "Write a message..."
                  }
                  aria-label="Write a message"
                />
                <div className="emoji-wrap">
                  <button
                    type="button"
                    className={`composer-icon ${showEmoji ? "selected" : ""}`}
                    onClick={() => setShowEmoji((open) => !open)}
                    title="Add an emoji"
                    aria-label="Add an emoji"
                  >
                    <Smile size={19} />
                  </button>
                  {showEmoji && (
                    <div className="emoji-picker">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button type="button" key={emoji} onClick={() => insertEmoji(emoji)}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="send-button"
                  disabled={(!draft.trim() && !imagePreview) || isSendingMessage}
                  aria-label="Send message"
                >
                  {isSendingMessage ? <span className="button-spinner" /> : <Send size={17} />}
                </button>
              </form>
              <div className="composer-hint">
                <span>
                  <kbd>↵</kbd> to send
                </span>
                <span>
                  <kbd>shift</kbd> + <kbd>↵</kbd> for a new line
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="welcome-state">
            <div className="welcome-orbit orbit-one" />
            <div className="welcome-orbit orbit-two" />
            <div className="welcome-art">
              <MessageCircle size={36} />
              <span>✦</span>
            </div>
            <p className="eyebrow">A LITTLE CLOSER, INSTANTLY</p>
            <h2>
              Good conversations
              <br />
              <em>start here.</em>
            </h2>
            <p className="welcome-description">
              Pick someone from your people and make their day with a message.
            </p>
            <div className="welcome-stats">
              <span>
                <i />
                {onlineUsers.length} {onlineUsers.length === 1 ? "person" : "people"} online now
              </span>
              <span>
                <ShieldCheck size={14} />
                Private by default
              </span>
            </div>
            <div className="welcome-decoration">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </section>

      {selectedUser && (
        <aside className="details-panel">
          <div className="details-topline">
            <span>YOUR CONNECTION</span>
            <button
              className="icon-button"
              onClick={closeConversation}
              aria-label="Close conversation"
            >
              <X size={17} />
            </button>
          </div>
          <div className="contact-profile-card">
            <Avatar user={selectedUser} online={isOnline(selectedUser)} size="avatar-xxl" />
            <h3>{selectedUser.fullName}</h3>
            <p>
              {selectedUser.bio ||
                (selectedUser.username ? `@${selectedUser.username}` : "Mingle connection")}
            </p>
            <span className={`profile-status ${isOnline(selectedUser) ? "online" : ""}`}>
              <i />
              {isOnline(selectedUser) ? "Online now" : "Offline"}
            </span>
          </div>
          <div className="details-divider" />
          <div className="detail-note">
            <div>
              <ShieldCheck size={16} />
            </div>
            <strong>Your space, just for two</strong>
            <p>Your messages and shared images stay in this conversation.</p>
          </div>
          <div className="details-bottom">
            <Sparkles size={15} />
            <span>Good things happen when we stay connected.</span>
          </div>
        </aside>
      )}

      {showReportDialog && selectedUser && (
        <div
          className="report-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowReportDialog(false);
          }}
        >
          <form
            className="report-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onSubmit={handleReport}
          >
            <div className="report-dialog-heading">
              <span className="report-icon">
                <Flag size={18} />
              </span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowReportDialog(false)}
                aria-label="Close report form"
              >
                <X size={17} />
              </button>
            </div>
            <h2 id="report-title">Report {selectedUser.fullName}</h2>
            <p>Tell us what happened. Reports are reviewed privately.</p>
            <label htmlFor="report-reason">Reason for report</label>
            <textarea
              id="report-reason"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              minLength={4}
              maxLength={500}
              required
              autoFocus
              placeholder="Share a few details…"
              rows={4}
            />
            <div className="report-dialog-actions">
              <button
                type="button"
                className="report-cancel"
                onClick={() => setShowReportDialog(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="report-submit"
                disabled={reportReason.trim().length < 4}
              >
                Submit report
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default ChatPage;
