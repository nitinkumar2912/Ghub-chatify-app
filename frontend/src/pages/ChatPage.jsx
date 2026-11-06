import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  LogOut,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
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

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Choose an image file"));
    if (file.size > 12 * 1024 * 1024) return reject(new Error("Images must be smaller than 12 MB"));

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

function ChatPage() {
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
    typingUsers,
    connectionStatus,
    loadContacts,
    selectUser,
    sendMessage,
    sendTyping,
  } = useChatStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messageEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const draftInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedUser]);

  useEffect(
    () => () => {
      clearTimeout(typingTimeoutRef.current);
      if (selectedUser) sendTyping(selectedUser._id, false);
    },
    [selectedUser, sendTyping]
  );

  const chatsById = useMemo(
    () => new Map(chats.map((chat) => [getId(chat._id), chat])),
    [chats]
  );
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

  const handleDraftChange = (event) => {
    const nextValue = event.target.value;
    setDraft(nextValue);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 110)}px`;
    if (!selectedUser) return;
    sendTyping(selectedUser._id, Boolean(nextValue.trim()));
    clearTimeout(typingTimeoutRef.current);
    if (nextValue.trim()) {
      typingTimeoutRef.current = setTimeout(
        () => sendTyping(selectedUser._id, false),
        1100
      );
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
    clearTimeout(typingTimeoutRef.current);
    if (selectedUser) sendTyping(selectedUser._id, false);
    const result = await sendMessage({ text: draft.trim(), image: imagePreview || undefined });
    if (result) {
      setDraft("");
      setImagePreview("");
      setShowEmoji(false);
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
    if (draftInputRef.current) draftInputRef.current.style.height = "auto";
    selectUser(contact);
  };

  const closeConversation = () => {
    setDraft("");
    setImagePreview("");
    setShowEmoji(false);
    if (draftInputRef.current) draftInputRef.current.style.height = "auto";
    selectUser(null);
  };

  return (
    <main className={`chat-workspace ${selectedUser ? "has-selection" : ""}`}>
      <aside className="inbox-panel">
        <div className="inbox-brand-row">
          <div className="brand-mark"><MessageCircle size={19} strokeWidth={2.4} /></div>
          <span className="brand-name">mingle<span>.</span></span>
          <div className={`connection-pill ${connectionStatus}`} title={`Realtime ${connectionStatus}`}>
            <span />
            <span>{connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Connecting" : "Offline"}</span>
          </div>
        </div>

        <div className="inbox-heading-row">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1>Messages</h1>
          </div>
          <div className="online-count"><span />{onlineUsers.length} online</div>
        </div>

        <label className="search-field">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people..."
            aria-label="Search people"
          />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
        </label>

        <div className="inbox-filters" role="tablist" aria-label="Conversation filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All people</button>
          <button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Unread</button>
        </div>

        <div className="conversation-list">
          <div className="list-caption">
            <span>{filter === "unread" ? "UNREAD" : chats.length ? "RECENT & PEOPLE" : "PEOPLE"}</span>
            <span>{visibleContacts.length}</span>
          </div>
          {isLoadingContacts ? (
            <div className="list-loading"><span className="spinner" />Finding your people…</div>
          ) : visibleContacts.length ? (
            visibleContacts.map((contact) => {
              const contactChat = chatsById.get(getId(contact._id));
              const active = getId(selectedUser?._id) === getId(contact._id);
              const lastMessage = contactChat?.lastMessage;
              const preview = lastMessage?.image ? "Shared an image" : lastMessage?.text || "Say hello";
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
                      <span className="conversation-time">{formatTime(lastMessage?.createdAt)}</span>
                    </span>
                    <span className="conversation-bottomline">
                      <span className="conversation-preview">{preview}</span>
                      {contactChat?.unreadCount > 0 && <span className="unread-badge">{contactChat.unreadCount > 9 ? "9+" : contactChat.unreadCount}</span>}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="empty-people">
              <div className="empty-icon"><Search size={19} /></div>
              <strong>{filter === "unread" ? "All caught up" : search ? "No one found" : "Your people will show up here"}</strong>
              <span>{filter === "unread" ? "You have no unread messages." : search ? "Try another name." : "Create another account to start a conversation."}</span>
            </div>
          )}
        </div>

        <div className="profile-footer">
          <Avatar user={authUser} size="avatar-sm" />
          <div className="profile-copy">
            <strong>{authUser?.fullName}</strong>
            <span>{authUser?.email}</span>
          </div>
          <button type="button" className="icon-button logout-button" onClick={logout} title="Sign out" aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <section className="conversation-panel">
        {selectedUser ? (
          <>
            <header className="conversation-header">
              <button className="icon-button mobile-back" onClick={closeConversation} aria-label="Back to messages"><ArrowLeft size={18} /></button>
              <Avatar user={selectedUser} online={isOnline(selectedUser)} />
              <div className="header-user-copy">
                <h2>{selectedUser.fullName}</h2>
                <span>{isTyping ? <span className="typing-label">Typing <i>···</i></span> : isOnline(selectedUser) ? "Active now" : "Offline"}</span>
              </div>
              <div className="header-actions">
                <span className="privacy-label"><ShieldCheck size={14} /> Private conversation</span>
              </div>
            </header>

            <div className="message-stream">
              <div className="conversation-intro">
                <Avatar user={selectedUser} online={isOnline(selectedUser)} size="avatar-xl" />
                <strong>{selectedUser.fullName}</strong>
                <span>{isOnline(selectedUser) ? "Around and ready to chat" : "Start a conversation"}</span>
                <div><ShieldCheck size={13} /> Messages are private between you two</div>
              </div>

              {isLoadingMessages ? (
                <div className="messages-loading"><span className="spinner" />Loading conversation…</div>
              ) : messages.length ? (
                <div className="message-list">
                  {messages.map((message) => {
                    const ownMessage = getId(message.senderId) === getId(authUser?._id);
                    return (
                      <div className={`message-row ${ownMessage ? "own" : "theirs"}`} key={message._id}>
                        {!ownMessage && <Avatar user={selectedUser} size="avatar-xs" />}
                        <div className="message-content">
                          <div className={`message-bubble ${ownMessage ? "outgoing" : "incoming"}`}>
                            {message.image && <a className="message-image-link" href={message.image} target="_blank" rel="noreferrer"><img src={message.image} alt="Shared attachment" /></a>}
                            {message.text && <p>{message.text}</p>}
                          </div>
                          <div className={`message-meta ${ownMessage ? "align-right" : ""}`}>
                            <time>{formatMessageTime(message.createdAt)}</time>
                            {ownMessage && (message.isRead ? <CheckCheck size={13} className="read-check" /> : <Check size={13} />)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && <div className="typing-bubble"><span /><span /><span /></div>}
                  <div ref={messageEndRef} />
                </div>
              ) : (
                <div className="first-message"><div className="first-message-spark"><Sparkles size={17} /></div><strong>Make the first move</strong><span>A little hello can go a long way.</span></div>
              )}
              {messages.length > 0 && <div ref={messageEndRef} />}
            </div>

            <div className="composer-area">
              {imagePreview && (
                <div className="attachment-preview">
                  <img src={imagePreview} alt="Selected attachment preview" />
                  <span>Ready to share</span>
                  <button type="button" onClick={() => setImagePreview("")} aria-label="Remove image"><X size={14} /></button>
                </div>
              )}
              <form className="message-composer" onSubmit={handleSend}>
                <button type="button" className="composer-icon" onClick={() => imageInputRef.current?.click()} title="Add an image" aria-label="Add an image"><Paperclip size={19} /></button>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImage} hidden />
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
                  placeholder="Write a message..."
                  aria-label="Write a message"
                />
                <div className="emoji-wrap">
                  <button type="button" className={`composer-icon ${showEmoji ? "selected" : ""}`} onClick={() => setShowEmoji((open) => !open)} title="Add an emoji" aria-label="Add an emoji"><Smile size={19} /></button>
                  {showEmoji && <div className="emoji-picker">{EMOJI_OPTIONS.map((emoji) => <button type="button" key={emoji} onClick={() => insertEmoji(emoji)}>{emoji}</button>)}</div>}
                </div>
                <button type="submit" className="send-button" disabled={(!draft.trim() && !imagePreview) || isSendingMessage} aria-label="Send message">
                  {isSendingMessage ? <span className="button-spinner" /> : <Send size={17} />}
                </button>
              </form>
              <div className="composer-hint"><span><kbd>↵</kbd> to send</span><span><kbd>shift</kbd> + <kbd>↵</kbd> for a new line</span></div>
            </div>
          </>
        ) : (
          <div className="welcome-state">
            <div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" />
            <div className="welcome-art"><MessageCircle size={36} /><span>✦</span></div>
            <p className="eyebrow">A LITTLE CLOSER, INSTANTLY</p>
            <h2>Good conversations<br /><em>start here.</em></h2>
            <p className="welcome-description">Pick someone from your people and make their day with a message.</p>
            <div className="welcome-stats"><span><i />{onlineUsers.length} people online now</span><span><ShieldCheck size={14} />Private by default</span></div>
            <div className="welcome-decoration"><span /><span /><span /></div>
          </div>
        )}
      </section>

      {selectedUser && <aside className="details-panel">
        <div className="details-topline"><span>YOUR CONNECTION</span><button className="icon-button" onClick={closeConversation} aria-label="Close conversation"><X size={17} /></button></div>
        <div className="contact-profile-card">
          <Avatar user={selectedUser} online={isOnline(selectedUser)} size="avatar-xxl" />
          <h3>{selectedUser.fullName}</h3>
          <p>{selectedUser.email}</p>
          <span className={`profile-status ${isOnline(selectedUser) ? "online" : ""}`}><i />{isOnline(selectedUser) ? "Online now" : "Offline"}</span>
        </div>
        <div className="details-divider" />
        <div className="detail-note"><div><ShieldCheck size={16} /></div><strong>Your space, just for two</strong><p>Your messages and shared images stay in this conversation.</p></div>
        <div className="details-bottom"><Sparkles size={15} /><span>Good things happen when we stay connected.</span></div>
      </aside>}
    </main>
  );
}

export default ChatPage;
