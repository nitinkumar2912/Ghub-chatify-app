import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, MessageCircle, Sparkles, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const level = score <= 1 ? "weak" : score <= 3 ? "fair" : "strong";
  const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : "Strong";

  return (
    <div className="password-strength" data-level={level}>
      <div className="strength-track">
        <div className="strength-fill" style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className="strength-label">{label}</span>
    </div>
  );
}

function SignUpPage({ theme, onToggleTheme }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationEmail, setVerificationEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fullName = formData.fullName.trim();
    if (!fullName) return toast.error("Please enter your name");
    if (formData.password.length < 10)
      return toast.error("Use at least 10 characters for your password");
    if (formData.password !== formData.confirmPassword)
      return toast.error("Those passwords don't match yet");
    const result = await signup({
      fullName,
      email: formData.email.trim(),
      password: formData.password,
    });
    if (result?.requiresEmailVerification) setVerificationEmail(formData.email.trim());
  };

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link className="auth-home-link" to="/">
          <span className="auth-home-mark">
            <MessageCircle size={17} />
          </span>
          <span>
            mingle<span>.</span>
          </span>
        </Link>
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>
      <main className="auth-card">
        <section className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-heading">
              <div className="auth-logo">
                <MessageCircle size={21} />
              </div>
              <h1>Make it personal.</h1>
              <p>Create your space and start talking.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-input-label" htmlFor="signup-name">
                  Your name
                </label>
                <div className="relative">
                  <UserRound className="auth-input-icon" />
                  <input
                    id="signup-name"
                    className="input"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={60}
                    value={formData.fullName}
                    onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                    placeholder="How should we call you?"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-input-label" htmlFor="signup-email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="auth-input-icon" />
                  <input
                    id="signup-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-input-label" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="auth-input-icon" />
                  <input
                    id="signup-password"
                    className="input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={72}
                    required
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    placeholder="At least 10 characters"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={formData.password} />
              </div>

              <div className="auth-field">
                <label className="auth-input-label" htmlFor="signup-confirm">
                  Confirm password
                </label>
                <div className="relative">
                  <LockKeyhole className="auth-input-icon" />
                  <input
                    id="signup-confirm"
                    className="input"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(event) =>
                      setFormData({ ...formData, confirmPassword: event.target.value })
                    }
                    placeholder="One more time"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button className="auth-btn" type="submit" disabled={isSigningUp}>
                {isSigningUp ? (
                  <span
                    className="spinner"
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                  />
                ) : (
                  "Create your account"
                )}
              </button>
            </form>

            {verificationEmail && (
              <div className="auth-notice" role="status">
                We sent a verification link to <strong>{verificationEmail}</strong>. Check your
                inbox, then <Link to="/login">sign in</Link>.
              </div>
            )}

            <p className="auth-switch">
              Already have a space? <Link to="/login">Sign in</Link>
            </p>
            <div className="auth-footnote">
              <LockKeyhole size={13} /> Your conversations are yours alone.
            </div>
          </div>
        </section>

        <aside className="auth-aside">
          <img
            className="auth-art"
            src="/signup.png"
            alt="Colorful chat devices and friendly robots"
          />
          <div className="auth-aside-copy">
            <div className="auth-aside-kicker">
              <Sparkles size={14} /> YOUR PEOPLE, ONE MESSAGE AWAY
            </div>
            <h2>Small messages. Big I'm-thinking-of-you energy.</h2>
            <p>Bring your favorite conversations into one warm little corner.</p>
            <div className="auth-badges">
              <span className="auth-badge">Instant</span>
              <span className="auth-badge">Personal</span>
              <span className="auth-badge">Always yours</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default SignUpPage;
