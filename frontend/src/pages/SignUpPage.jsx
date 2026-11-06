import { useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, Mail, MessageCircle, Sparkles, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fullName = formData.fullName.trim();
    if (!fullName) return toast.error("Please enter your name");
    if (formData.password.length < 6) return toast.error("Use at least 6 characters for your password");
    if (formData.password !== formData.confirmPassword) return toast.error("Those passwords don’t match yet");
    await signup({ fullName, email: formData.email.trim(), password: formData.password });
  };

  return (
    <main className="auth-card">
      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-heading">
            <div className="auth-logo"><MessageCircle size={21} /></div>
            <h1>Make it personal.</h1>
            <p>Create your space and start talking.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-input-label" htmlFor="signup-name">Your name</label>
              <div className="relative">
                <UserRound className="auth-input-icon" />
                <input id="signup-name" className="input" type="text" autoComplete="name" required maxLength={60} value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} placeholder="How should we call you?" />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-input-label" htmlFor="signup-email">Email address</label>
              <div className="relative">
                <Mail className="auth-input-icon" />
                <input id="signup-email" className="input" type="email" autoComplete="email" required value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="you@example.com" />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-input-label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <LockKeyhole className="auth-input-icon" />
                <input id="signup-password" className="input" type="password" autoComplete="new-password" minLength={6} required value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} placeholder="At least 6 characters" />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-input-label" htmlFor="signup-confirm">Confirm password</label>
              <div className="relative">
                <LockKeyhole className="auth-input-icon" />
                <input id="signup-confirm" className="input" type="password" autoComplete="new-password" required value={formData.confirmPassword} onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })} placeholder="One more time" />
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={isSigningUp}>
              {isSigningUp ? <span className="spinner" style={{ display: "inline-block", verticalAlign: "middle" }} /> : "Create your account"}
            </button>
          </form>

          <p className="auth-switch">Already have a space? <Link to="/login">Sign in</Link></p>
          <div className="auth-footnote"><LockKeyhole size={13} /> Your conversations are yours alone.</div>
        </div>
      </section>

      <aside className="auth-aside">
        <img className="auth-art" src="/signup.png" alt="Colorful chat devices and friendly robots" />
        <div className="auth-aside-copy">
          <div className="auth-aside-kicker"><Sparkles size={14} /> YOUR PEOPLE, ONE MESSAGE AWAY</div>
          <h2>Small messages. Big I’m-thinking-of-you energy.</h2>
          <p>Bring your favorite conversations into one warm little corner.</p>
          <div className="auth-badges"><span className="auth-badge">Instant</span><span className="auth-badge">Personal</span><span className="auth-badge">Always yours</span></div>
        </div>
      </aside>
    </main>
  );
}

export default SignUpPage;
