import { ArrowDown, ArrowRight, Check, Heart, LockKeyhole, MessageCircle, Send, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const people = [
  { initials: "A", name: "Aarav", note: "Sent you a photo", tone: "peach", time: "now" },
  { initials: "M", name: "Maya", note: "That made my day ✨", tone: "mint", time: "2m" },
  { initials: "J", name: "Jordan", note: "Voice note · 0:18", tone: "blue", time: "8m" },
];

function Brand() {
  return (
    <Link className="brand-lockup" to="/" aria-label="mingle home">
      <span className="brand-mark"><MessageCircle size={18} strokeWidth={2.6} /></span>
      <span className="brand-name">mingle<span>.</span></span>
    </Link>
  );
}

function ChatPreview() {
  return (
    <div className="preview-wrap" aria-label="Preview of a mingle conversation">
      <div className="preview-glow" />
      <div className="preview-window">
        <aside className="preview-sidebar">
          <div className="preview-brand"><span className="preview-brand-icon"><MessageCircle size={14} /></span> mingle<span>.</span></div>
          <div className="preview-label">YOUR PEOPLE</div>
          {people.map((person, index) => (
            <div className={`preview-person ${index === 0 ? "selected" : ""}`} key={person.name}>
              <span className={`preview-avatar ${person.tone}`}>{person.initials}<i /></span>
              <span className="preview-person-copy"><strong>{person.name}</strong><small>{person.note}</small></span>
              <small className="preview-time">{person.time}</small>
            </div>
          ))}
          <div className="preview-side-note"><span className="preview-live-dot" /> 3 people around</div>
        </aside>
        <section className="preview-chat">
          <header className="preview-chat-header">
            <span className="preview-avatar peach">A<i /></span>
            <span><strong>Aarav</strong><small><i /> Around now</small></span>
            <span className="preview-private"><ShieldCheck size={13} /> Just you two</span>
          </header>
          <div className="preview-messages">
            <div className="preview-day">TODAY, A LITTLE WHILE AGO</div>
            <div className="preview-message incoming"><span className="preview-avatar peach">A</span><p>Look what I found on my walk 🌿</p></div>
            <div className="preview-photo"><span>☀️</span><small>a little piece of the afternoon</small></div>
            <div className="preview-message outgoing"><p>Saving this for a rainy day</p><Check size={12} /></div>
            <div className="preview-reaction"><Heart size={12} fill="currentColor" /> 1</div>
          </div>
          <div className="preview-composer"><span>Write a message...</span><span className="preview-send"><Send size={14} /></span></div>
        </section>
        <div className="preview-float-card"><span className="preview-float-icon"><Sparkles size={16} /></span><span><strong>A little closer</strong><small>One message at a time</small></span></div>
      </div>
      <div className="preview-caption"><span className="preview-caption-dot" /> A quieter corner for your favorite people</div>
    </div>
  );
}

function HomePage({ theme, onToggleTheme, isSignedIn }) {
  const primaryHref = isSignedIn ? "/chat" : "/signup";
  return (
    <main className="home-page">
      <div className="home-backdrop-stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <nav className="home-nav">
        <Brand />
        <div className="home-nav-links">
          <a href="#why-mingle">Why mingle</a>
          <a href="#your-space">Your space</a>
        </div>
        <div className="home-nav-actions">
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          {isSignedIn ? <Link className="nav-login" to="/chat">Open chat <ArrowRight size={15} /></Link> : <Link className="nav-login" to="/login">Log in</Link>}
          <Link className="nav-signup" to={primaryHref}>{isSignedIn ? "Go to messages" : "Get started"}<ArrowRight size={15} /></Link>
        </div>
      </nav>

      <section className="home-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="hero-kicker-spark"><Sparkles size={13} /></span> A LITTLE MORE HUMAN, A LITTLE LESS NOISY</div>
          <h1>Good things happen when we <em>mingle.</em></h1>
          <p className="hero-description">A cozy place for the people who make your day better. Send a thought, share a moment, and pick right back up whenever you’re ready.</p>
          <div className="hero-actions">
            <Link className="hero-primary" to={primaryHref}>{isSignedIn ? "Open your messages" : "Create your space"}<ArrowRight size={17} /></Link>
            <Link className="hero-secondary" to={isSignedIn ? "/chat" : "/login"}>{isSignedIn ? "Go to chat" : "I already have an account"}</Link>
          </div>
          <div className="hero-promise"><span><Check size={13} /> Private conversations</span><span><Check size={13} /> Just the people you choose</span></div>
          <a className="scroll-cue" href="#why-mingle"><span>Take a look around</span><ArrowDown size={14} /></a>
        </div>
        <ChatPreview />
      </section>

      <section className="home-values" id="why-mingle">
        <div className="values-heading">
          <span className="section-kicker">MADE FOR THE LITTLE MOMENTS</span>
          <h2>Your people, a little closer.</h2>
          <p>Keep the conversation feeling like yours.</p>
        </div>
        <div className="value-grid">
          <article className="value-card"><span className="value-icon violet"><MessageCircle size={19} /></span><h3>Talk like yourselves</h3><p>Easy, familiar chats that feel more like catching up than keeping up.</p></article>
          <article className="value-card"><span className="value-icon green"><LockKeyhole size={18} /></span><h3>A space just for you</h3><p>Your conversations stay between you and the people you invite in.</p></article>
          <article className="value-card"><span className="value-icon amber"><UsersRound size={19} /></span><h3>Always find your people</h3><p>See who’s around and pick up right where your favorite story left off.</p></article>
        </div>
      </section>

      <section className="home-cta" id="your-space">
        <div className="cta-orbit cta-orbit-one" /><div className="cta-orbit cta-orbit-two" />
        <span className="cta-spark"><Sparkles size={17} /></span>
        <p className="section-kicker">YOUR CORNER IS WAITING</p>
        <h2>Make a little room<br />for your people.</h2>
        <Link className="hero-primary" to={primaryHref}>{isSignedIn ? "Back to your messages" : "Come on in"}<ArrowRight size={17} /></Link>
      </section>

      <footer className="home-footer"><Brand /><span>Good conversations, a little closer.</span><small>© 2026 mingle. Made for your people.</small></footer>
    </main>
  );
}

export default HomePage;
