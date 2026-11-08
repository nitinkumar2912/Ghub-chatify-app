import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, MessageCircle } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { axiosInstance } from "../lib/axios";

function RecoveryLayout({ theme, onToggleTheme, title, description, children }) {
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
      <main className="auth-card auth-card-simple">
        <section className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-heading">
              <div className="auth-logo">
                <MessageCircle size={21} />
              </div>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

export function VerifyEmailPage({ theme, onToggleTheme }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState(
    token ? "Confirming your email…" : "This verification link is missing its token.",
  );
  const [isError, setIsError] = useState(!token);

  useEffect(() => {
    let active = true;
    if (!token)
      return () => {
        active = false;
      };
    axiosInstance
      .post("/auth/verify-email", { token })
      .then((response) => {
        if (active) setMessage(response.data.message);
      })
      .catch((error) => {
        if (!active) return;
        setMessage(
          error.response?.data?.message ||
            "We could not verify this link. Request a fresh one and try again.",
        );
        setIsError(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <RecoveryLayout
      theme={theme}
      onToggleTheme={onToggleTheme}
      title="Email check-in"
      description="One last step to make your space yours."
    >
      <p className={`auth-notice ${isError ? "error" : ""}`} role="status">
        {message}
      </p>
      {isError && <ResendVerification />}
      <p className="auth-switch">
        <Link to="/login">Go to sign in</Link>
      </p>
    </RecoveryLayout>
  );
}

function ResendVerification() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSending(true);
    try {
      await axiosInstance.post("/auth/resend-verification", { email });
      setSent(true);
    } catch {
      setErrorMessage("Could not request a new link right now. Please try again shortly.");
    } finally {
      setIsSending(false);
    }
  };
  if (sent)
    return (
      <p className="auth-notice" role="status">
        If the account needs verification, a fresh link is on its way.
      </p>
    );
  return (
    <form className="auth-form recovery-form" onSubmit={handleSubmit}>
      {errorMessage && (
        <p className="auth-notice error" role="alert">
          {errorMessage}
        </p>
      )}
      <label className="auth-input-label" htmlFor="resend-email">
        Send another verification link
      </label>
      <div className="relative">
        <Mail className="auth-input-icon" />
        <input
          id="resend-email"
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <button className="auth-btn" type="submit" disabled={isSending}>
        {isSending ? "Sending…" : "Resend link"}
      </button>
    </form>
  );
}

export function ForgotPasswordPage({ theme, onToggleTheme }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSending(true);
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setErrorMessage("Could not request a reset link right now. Please try again shortly.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <RecoveryLayout
      theme={theme}
      onToggleTheme={onToggleTheme}
      title="Reset your password"
      description="We'll send you a private link to choose a new one."
    >
      {sent ? (
        <p className="auth-notice" role="status">
          If an account matches that address, a reset link will be sent shortly.
        </p>
      ) : (
        <form className="auth-form recovery-form" onSubmit={handleSubmit}>
          {errorMessage && (
            <p className="auth-notice error" role="alert">
              {errorMessage}
            </p>
          )}
          <label className="auth-input-label" htmlFor="reset-email">
            Email address
          </label>
          <div className="relative">
            <Mail className="auth-input-icon" />
            <input
              id="reset-email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button className="auth-btn" type="submit" disabled={isSending}>
            {isSending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="auth-switch">
        <Link to="/login">Back to sign in</Link>
      </p>
    </RecoveryLayout>
  );
}

export function ResetPasswordPage({ theme, onToggleTheme }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Those passwords do not match yet.");
      setIsError(true);
      return;
    }
    if (!token) {
      setMessage("This reset link is missing its token.");
      setIsError(true);
      return;
    }
    setIsSaving(true);
    setIsError(false);
    try {
      const response = await axiosInstance.post("/auth/reset-password", { token, password });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login", { replace: true }), 1600);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "We could not update your password. Request a new link and try again.",
      );
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RecoveryLayout
      theme={theme}
      onToggleTheme={onToggleTheme}
      title="Choose a new password"
      description="Use at least 10 characters that you have not used before."
    >
      {message && (
        <p className={`auth-notice ${isError ? "error" : ""}`} role="status">
          {message}
        </p>
      )}
      <form className="auth-form recovery-form" onSubmit={handleSubmit}>
        <label className="auth-input-label" htmlFor="new-password">
          New password
        </label>
        <div className="relative">
          <LockKeyhole className="auth-input-icon" />
          <input
            id="new-password"
            className="input"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={10}
            maxLength={72}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
        <label className="auth-input-label" htmlFor="confirm-password">
          Confirm password
        </label>
        <div className="relative">
          <LockKeyhole className="auth-input-icon" />
          <input
            id="confirm-password"
            className="input"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            minLength={10}
            maxLength={72}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter it one more time"
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
        <button className="auth-btn" type="submit" disabled={isSaving}>
          {isSaving ? "Updating…" : "Update password"}
        </button>
      </form>
    </RecoveryLayout>
  );
}
