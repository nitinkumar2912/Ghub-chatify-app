import { Check, Heart, LockKeyhole, MessageCircle, Send, Sparkles } from "lucide-react";

function HeroConversation() {
  return (
    <div
      className="hero-conversation-scene"
      role="img"
      aria-label="Animated preview of a private Mingle conversation with a photo, a reply, and a typing indicator."
    >
      <div className="conversation-halo" aria-hidden="true" />
      <span className="conversation-orbit conversation-orbit-one" aria-hidden="true" />
      <span className="conversation-orbit conversation-orbit-two" aria-hidden="true" />

      <div className="conversation-float-card conversation-float-card-left" aria-hidden="true">
        <span className="conversation-avatar conversation-avatar-maya">M</span>
        <span className="conversation-float-copy">
          <strong>Maya</strong>
          <small>That made my day</small>
        </span>
        <span className="conversation-float-heart">
          <Heart size={13} fill="currentColor" />
        </span>
      </div>

      <div className="conversation-float-card conversation-float-card-right" aria-hidden="true">
        <span className="conversation-presence-pulse" />
        <span className="conversation-float-copy">
          <strong>A little closer</strong>
          <small>Aarav is around now</small>
        </span>
        <Sparkles className="conversation-float-sparkle" size={15} />
      </div>

      <div className="conversation-window" aria-hidden="true">
        <header className="conversation-window-topbar">
          <span className="conversation-window-brand">
            <span className="conversation-window-logo">
              <MessageCircle size={14} strokeWidth={2.5} />
            </span>
            mingle<span>.</span>
          </span>
          <span className="conversation-window-private">
            <LockKeyhole size={12} /> Private conversation
          </span>
          <span className="conversation-window-live">
            <i /> Live now
          </span>
        </header>

        <div className="conversation-window-contact">
          <span className="conversation-avatar conversation-avatar-aarav">A</span>
          <span className="conversation-contact-copy">
            <strong>Aarav</strong>
            <small>
              <i /> Around now
            </small>
          </span>
          <span className="conversation-contact-lock">
            <LockKeyhole size={12} /> Just you two
          </span>
        </div>

        <div className="conversation-thread">
          <span className="conversation-thread-date">TODAY · A LITTLE WHILE AGO</span>

          <div className="conversation-message-row conversation-message-incoming">
            <span className="conversation-avatar conversation-avatar-aarav conversation-avatar-small">
              A
            </span>
            <div className="conversation-message-stack">
              <div className="conversation-message-bubble conversation-message-received">
                Look what I found on my walk today.
              </div>
              <div className="conversation-photo-preview">
                <span className="conversation-photo-sun" />
                <span className="conversation-photo-hill conversation-photo-hill-back" />
                <span className="conversation-photo-hill conversation-photo-hill-front" />
                <span className="conversation-photo-caption">a little piece of the afternoon</span>
              </div>
            </div>
          </div>

          <div className="conversation-message-row conversation-message-outgoing">
            <div className="conversation-message-bubble conversation-message-sent">
              This is exactly what I needed today. <Check size={13} />
            </div>
          </div>

          <div className="conversation-typing-row">
            <span className="conversation-avatar conversation-avatar-maya conversation-avatar-small">
              M
            </span>
            <span className="conversation-typing-bubble" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="conversation-typing-label">Maya is typing</span>
          </div>
        </div>

        <footer className="conversation-composer-preview">
          <span>Write a message...</span>
          <span className="conversation-composer-send">
            <Send size={14} />
          </span>
        </footer>
      </div>

      <span className="conversation-scene-caption" aria-hidden="true">
        <i /> good conversations, a little closer
      </span>
    </div>
  );
}

export default HeroConversation;
