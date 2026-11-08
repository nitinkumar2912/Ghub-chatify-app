import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Heart,
  Image as ImageIcon,
  LockKeyhole,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wifi,
} from "lucide-react";
import { Link } from "react-router-dom";
import HeroConversation from "../components/HeroConversation";
import ThemeToggle from "../components/ThemeToggle";

const people = [
  { initials: "A", name: "Aarav", note: "Sent you a photo", tone: "peach", time: "now" },
  { initials: "M", name: "Maya", note: "That made my day ✨", tone: "mint", time: "2m" },
  { initials: "J", name: "Jordan", note: "Saving this for later", tone: "blue", time: "8m" },
];

function Brand() {
  return (
    <Link className="brand-lockup" to="/" aria-label="Mingle home">
      <span className="brand-mark">
        <MessageCircle size={18} strokeWidth={2.6} />
      </span>
      <span className="brand-name">
        mingle<span>.</span>
      </span>
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="product-device" aria-label="Preview of the Mingle messaging interface">
      <div className="product-device-glow" />
      <div className="product-screen">
        <div className="product-titlebar">
          <div className="product-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span className="product-titlebar-brand">mingle.</span>
          <span className="product-titlebar-private">
            <ShieldCheck size={12} /> Private conversation
          </span>
        </div>
        <div className="product-dashboard">
          <aside className="product-sidebar">
            <div className="product-sidebar-label">YOUR PEOPLE</div>
            {people.map((person, index) => (
              <div className={`product-contact ${index === 0 ? "active" : ""}`} key={person.name}>
                <span className={`product-avatar ${person.tone}`}>{person.initials}</span>
                <span className="product-contact-copy">
                  <strong>{person.name}</strong>
                  <small>{person.note}</small>
                </span>
                <small className="product-contact-time">{person.time}</small>
              </div>
            ))}
            <div className="product-sidebar-presence">
              <span /> 3 people around
            </div>
          </aside>
          <section className="product-conversation">
            <div className="product-conversation-heading">
              <span className="product-avatar peach">A</span>
              <span>
                <strong>Aarav</strong>
                <small>
                  <i /> Around now
                </small>
              </span>
              <span className="product-private-pill">
                <LockKeyhole size={11} /> Just you two
              </span>
            </div>
            <div className="product-chat-messages">
              <span className="product-chat-date">TODAY, A LITTLE WHILE AGO</span>
              <div className="product-bubble received">
                Look what I found on my walk today <span>🌿</span>
              </div>
              <div className="product-shared-photo">
                <div className="product-photo-light" />
                <span>a little piece of the afternoon</span>
              </div>
              <div className="product-bubble sent">
                Saving this for a rainy day <Check size={12} />
              </div>
              <div className="product-heart-reaction">
                <Heart size={12} fill="currentColor" /> 1
              </div>
            </div>
            <div className="product-composer">
              <span>Write a message...</span>
              <span className="product-composer-send">
                <Send size={13} />
              </span>
            </div>
          </section>
        </div>
      </div>
      <div className="product-device-caption">
        <span className="product-caption-spark">
          <Sparkles size={15} />
        </span>
        <span>
          <strong>A little closer</strong>
          <small>Your people, right where they belong.</small>
        </span>
      </div>
    </div>
  );
}

const features = [
  {
    Icon: Wifi,
    tone: "violet",
    title: "Here, as it happens",
    text: "Messages arrive in real time, so the good part of a conversation never has to wait.",
  },
  {
    Icon: UsersRound,
    tone: "mint",
    title: "See who’s around",
    text: "A quiet presence signal helps you find the right moment to say hello.",
  },
  {
    Icon: Heart,
    tone: "rose",
    title: "Make it feel like you",
    text: "Reply, react, pin a favorite, or share a photo that says more than words.",
  },
  {
    Icon: LockKeyhole,
    tone: "blue",
    title: "Just your conversation",
    text: "One-to-one chats are for the two people in them, with controls to mute or block.",
  },
  {
    Icon: Search,
    tone: "amber",
    title: "Find that little moment",
    text: "Search past messages to pick up a story, a plan, or a thought you saved.",
  },
  {
    Icon: ImageIcon,
    tone: "lilac",
    title: "Share a glimpse",
    text: "Send images right in the conversation and keep the moment close together.",
  },
];

function HomePage({ theme, onToggleTheme, isSignedIn }) {
  const primaryHref = isSignedIn ? "/chat" : "/signup";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const revealTargets = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return () => window.removeEventListener("scroll", onScroll);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -45px 0px", threshold: 0.12 },
    );
    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <main className="home-page">
      <div className="home-ambient home-ambient-top" aria-hidden="true" />
      <div className="home-ambient home-ambient-bottom" aria-hidden="true" />

      <nav className={`home-nav ${isScrolled ? "is-scrolled" : ""}`} aria-label="Main navigation">
        <Brand />
        <div className="home-nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>
        <div className="home-nav-actions">
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          {isSignedIn ? (
            <Link className="nav-login" to="/chat">
              Open chat <ArrowRight size={15} />
            </Link>
          ) : (
            <Link className="nav-login" to="/login">
              Login
            </Link>
          )}
          <Link className="nav-signup" to={primaryHref}>
            {isSignedIn ? "Your messages" : "Sign up"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      <section className="home-hero" id="home">
        <div className="hero-rings" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="hero-copy" data-reveal>
          <div className="hero-kicker">
            <span className="hero-kicker-spark">
              <Sparkles size={13} />
            </span>
            A LITTLE MORE HUMAN. A LITTLE LESS NOISY.
          </div>
          <h1>
            Good things happen
            <br />
            when we <em>mingle.</em>
          </h1>
          <p className="hero-description">
            A cozy place for the people who make your day better. Send a thought, share a moment,
            and pick right back up whenever you’re ready.
          </p>
          <div className="hero-actions">
            <Link className="hero-primary" to={primaryHref}>
              {isSignedIn ? "Start chatting" : "Start Chatting — It’s Free"}
              <ArrowRight size={17} />
            </Link>
            <a className="hero-secondary" href="#showcase">
              Explore Mingle <ArrowDown size={14} />
            </a>
          </div>
          <div className="hero-promise" aria-label="Mingle highlights">
            <span>
              <Check size={13} /> One-to-one conversations
            </span>
            <span>
              <Check size={13} /> Find who’s around
            </span>
          </div>
        </div>

        <div className="hero-stage">
          <HeroConversation />
        </div>
        <div className="hero-bottom-line">
          <span>Made for the little moments</span>
          <span className="hero-bottom-dot" />
          <span>Good conversations, a little closer</span>
          <span className="hero-bottom-dot" />
          <span>mingle.</span>
        </div>
      </section>

      <section className="home-showcase" id="showcase">
        <div className="showcase-copy reveal" data-reveal>
          <p className="section-kicker">
            <span /> YOUR PEOPLE, IN ONE PLACE
          </p>
          <h2>Your conversations, beautifully connected.</h2>
          <p>
            Everything you need to stay close to the people who matter. Thoughtful messages, little
            reactions, and moments worth keeping.
          </p>
          <div className="showcase-points">
            <span>
              <Check size={14} /> Pick up where you left off
            </span>
            <span>
              <Check size={14} /> Share a photo or a thought
            </span>
          </div>
          <Link className="text-link" to={primaryHref}>
            {isSignedIn ? "Go to your messages" : "Find your people"} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="showcase-product reveal" data-reveal>
          <DashboardPreview />
        </div>
      </section>

      <section className="home-features" id="features">
        <div className="section-heading reveal" data-reveal>
          <p className="section-kicker">
            <span /> THE GOOD STUFF, WITHOUT THE NOISE
          </p>
          <h2>Small details. A more human kind of chat.</h2>
          <p>All the useful parts of messaging, shaped around the people you care about.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ Icon, tone, title, text }, index) => (
            <article
              className="feature-card reveal"
              data-reveal
              style={{ "--reveal-delay": `${index * 65}ms` }}
              key={title}
            >
              <span className={`feature-icon ${tone}`}>
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feature-card-arrow" aria-hidden="true">
                <ArrowRight size={15} />
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-how" id="how-it-works">
        <div className="how-heading reveal" data-reveal>
          <p className="section-kicker">
            <span /> A SOFTER WAY TO KEEP IN TOUCH
          </p>
          <h2>Three little steps. One lovely space.</h2>
        </div>
        <div className="how-steps">
          <article className="how-step reveal" data-reveal>
            <span className="how-number">01</span>
            <span className="how-step-icon">
              <UsersRound size={21} />
            </span>
            <h3>Create your account</h3>
            <p>Make a little space of your own. Signing up takes just a moment.</p>
          </article>
          <span className="how-connector" aria-hidden="true" />
          <article className="how-step reveal" data-reveal>
            <span className="how-number">02</span>
            <span className="how-step-icon">
              <Search size={21} />
            </span>
            <h3>Find your people</h3>
            <p>Search for someone you know and start a private one-to-one chat.</p>
          </article>
          <span className="how-connector" aria-hidden="true" />
          <article className="how-step reveal" data-reveal>
            <span className="how-number">03</span>
            <span className="how-step-icon">
              <MessageCircle size={21} />
            </span>
            <h3>Start a good thing</h3>
            <p>Share a thought, a photo, or simply pick up where you left off.</p>
          </article>
        </div>
      </section>

      <section className="home-about" id="about">
        <div className="about-orbit about-orbit-one" aria-hidden="true" />
        <div className="about-orbit about-orbit-two" aria-hidden="true" />
        <div className="about-inner reveal" data-reveal>
          <span className="about-mark">
            <MessageCircle size={22} />
          </span>
          <p className="section-kicker">A SMALLER CORNER OF THE INTERNET</p>
          <h2>
            More presence.
            <br />
            Less pressure.
          </h2>
          <p>
            Mingle is for the conversations that make ordinary days feel a little brighter. No
            public rooms to keep up with. Just you, your people, and the next thing you want to say.
          </p>
        </div>
      </section>

      <section className="home-cta" id="your-space">
        <div className="cta-orbit cta-orbit-one" aria-hidden="true" />
        <div className="cta-orbit cta-orbit-two" aria-hidden="true" />
        <span className="cta-spark">
          <Sparkles size={17} />
        </span>
        <p className="section-kicker">YOUR PEOPLE ARE JUST ONE MESSAGE AWAY</p>
        <h2>
          Make a little room
          <br />
          for your people.
        </h2>
        <Link className="hero-primary" to={primaryHref}>
          {isSignedIn ? "Back to your messages" : "Join Mingle — It’s Free"}
          <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="home-footer">
        <Brand />
        <span>Good conversations, a little closer.</span>
        <div className="home-footer-links">
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign up</Link>
        </div>
        <small>© 2026 mingle. Made for your people.</small>
      </footer>
    </main>
  );
}

export default HomePage;
