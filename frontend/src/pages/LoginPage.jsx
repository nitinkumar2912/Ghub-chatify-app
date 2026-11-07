import { useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, Mail, MessageCircle, Sparkles } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";

function LoginPage({ theme, onToggleTheme }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (event) => {
    event.preventDefault();
    login({ email: formData.email.trim(), password: formData.password });
  };

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link className="auth-home-link" to="/">
          <span className="auth-home-mark"><MessageCircle size={17} /></span>
          <span>mingle<span>.</span></span>
        </Link>
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>
      <main className="auth-card">
      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-heading">
            <div className="auth-logo"><MessageCircle size={21} /></div>
            <h1>Welcome back</h1>
            <p>Your people have been waiting for you.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-input-label" htmlFor="login-email">Email address</label>
              <div className="relative">
                <Mail className="auth-input-icon" />
                <input id="login-email" className="input" type="email" autoComplete="email" required value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="you@example.com" />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-input-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <LockKeyhole className="auth-input-icon" />
                <input id="login-password" className="input" type="password" autoComplete="current-password" required value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} placeholder="Your password" />
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? <span className="spinner" style={{ display: "inline-block", verticalAlign: "middle" }} /> : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">New to mingle? <Link to="/signup">Create an account</Link></p>
          <div className="auth-footnote"><LockKeyhole size={13} /> Your conversations are yours alone.</div>
        </div>
      </section>

      <aside className="auth-aside">
        <img className="auth-art" src="/signup.png" alt="Colorful chat devices and friendly robots" />
        <div className="auth-aside-copy">
          <div className="auth-aside-kicker"><Sparkles size={14} /> STAY CLOSE, FROM ANYWHERE</div>
          <h2>Good conversations make the distance smaller.</h2>
          <p>Share a thought, a moment, or the photo you know will make them smile.</p>
          <div className="auth-badges"><span className="auth-badge">Instant</span><span className="auth-badge">Personal</span><span className="auth-badge">Always yours</span></div>
        </div>
      </aside>
      </main>
    </div>
  );
}

export default LoginPage;
