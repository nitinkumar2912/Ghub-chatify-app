import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Camera,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  User,
  Volume2,
  Bell,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return reject(new Error("Choose a JPEG, PNG, or WebP image"));
    }
    if (file.size > 8 * 1024 * 1024) {
      return reject(new Error("Images must be smaller than 8 MB"));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image"));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("Could not open this image"));
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePage({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const { authUser, updateProfile, updateProfilePic, logout } = useAuthStore();
  const { blockedContacts, loadBlockedContacts, setUserBlocked } = useChatStore();

  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [username, setUsername] = useState(authUser?.username || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [soundPref, setSoundPref] = useState(authUser?.notificationPrefs?.sound ?? true);
  const [desktopPref, setDesktopPref] = useState(
    () =>
      Boolean(authUser?.notificationPrefs?.desktop) &&
      "Notification" in window &&
      Notification.permission === "granted",
  );
  const [previewPref, setPreviewPref] = useState(
    authUser?.notificationPrefs?.messagePreview ?? true,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBlockedContacts();
  }, [loadBlockedContacts]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImage(file);
      await updateProfilePic(compressed);
    } catch (err) {
      toast.error(err.message || "Failed to process image");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDesktopPrefToggle = async () => {
    const nextVal = !desktopPref;
    if (nextVal && !("Notification" in window)) {
      toast.error("Desktop notifications are not supported in this browser");
      return;
    }
    if (nextVal && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied in browser");
        return;
      }
    }
    setDesktopPref(nextVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        username: username.trim() || undefined,
        bio: bio.trim(),
        notificationPrefs: {
          sound: soundPref,
          desktop: desktopPref,
          messagePreview: previewPref,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getInitials = (name = "?") =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="profile-page">
      <div className="auth-topbar">
        <Link className="auth-home-link" to="/chat">
          <span className="auth-home-mark">
            <ArrowLeft size={17} />
          </span>
          <span>Back to Messages</span>
        </Link>
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>

      <div className="profile-header-card">
        <div className="profile-avatar-area">
          <button
            type="button"
            className="avatar avatar-xxl profile-avatar-clickable"
            onClick={() => fileInputRef.current?.click()}
            title="Change photo"
            aria-label="Change profile picture"
            disabled={isUploadingPhoto}
          >
            {authUser?.profilePic ? (
              <img src={authUser.profilePic} alt={authUser.fullName} />
            ) : (
              <span>{getInitials(authUser?.fullName)}</span>
            )}
            <div className="avatar-upload-overlay">
              {isUploadingPhoto ? <span className="button-spinner" /> : <Camera size={20} />}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            hidden
          />
          <button
            type="button"
            className="profile-avatar-label"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploadingPhoto ? "Uploading photo…" : "Change profile picture"}
          </button>
        </div>

        <div className="profile-header-meta">
          <h2>{authUser?.fullName}</h2>
          <p>{authUser?.email}</p>
          {authUser?.username && <span className="profile-username-tag">@{authUser.username}</span>}
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <section className="profile-section">
          <h3 className="profile-section-title">PROFILE DETAILS</h3>

          <div className="profile-field">
            <label htmlFor="profile-fullName">Display Name</label>
            <div className="relative">
              <User className="auth-input-icon" />
              <input
                id="profile-fullName"
                className="input"
                type="text"
                required
                maxLength={60}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="How your name appears"
              />
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="profile-username">Username</label>
            <div className="relative">
              <span className="profile-prefix-symbol">@</span>
              <input
                id="profile-username"
                className="input input-with-prefix"
                type="text"
                maxLength={30}
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="username"
              />
            </div>
            <span className="field-hint">
              Letters, numbers, and underscores only. Max 30 chars.
            </span>
          </div>

          <div className="profile-field">
            <label htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              className="input profile-bio-input"
              maxLength={200}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about you..."
            />
            <div className="bio-char-count">{bio.length} / 200</div>
          </div>

          <div className="profile-field profile-field-readonly">
            <label htmlFor="profile-email">Email Address</label>
            <div className="relative">
              <Mail className="auth-input-icon" />
              <input
                id="profile-email"
                className="input"
                type="email"
                readOnly
                value={authUser?.email || ""}
              />
              <span
                className={`email-verified-badge ${authUser?.emailVerified ? "verified" : "unverified"}`}
                title={authUser?.emailVerified ? "Verified account" : "Email not verified"}
              >
                <CheckCircle2 size={15} /> {authUser?.emailVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h3 className="profile-section-title">NOTIFICATIONS & PRIVACY</h3>

          <div className="pref-toggle">
            <div className="pref-toggle-copy">
              <strong>
                <Volume2 size={15} className="inline-icon" /> Sound Notifications
              </strong>
              <span>Play an ambient audio chime when a message arrives</span>
            </div>
            <button
              type="button"
              className={`toggle-switch ${soundPref ? "active" : ""}`}
              onClick={() => setSoundPref(!soundPref)}
              aria-label="Toggle sound notifications"
              role="switch"
              aria-checked={soundPref}
            />
          </div>

          <div className="pref-toggle">
            <div className="pref-toggle-copy">
              <strong>
                <Bell size={15} className="inline-icon" /> Desktop Notifications
              </strong>
              <span>Receive alert popups when Mingle is in the background</span>
            </div>
            <button
              type="button"
              className={`toggle-switch ${desktopPref ? "active" : ""}`}
              onClick={handleDesktopPrefToggle}
              aria-label="Toggle desktop notifications"
              role="switch"
              aria-checked={desktopPref}
            />
          </div>

          <div className="pref-toggle">
            <div className="pref-toggle-copy">
              <strong>
                <Eye size={15} className="inline-icon" /> Message Preview
              </strong>
              <span>Display sender and snippet content in notifications</span>
            </div>
            <button
              type="button"
              className={`toggle-switch ${previewPref ? "active" : ""}`}
              onClick={() => setPreviewPref(!previewPref)}
              aria-label="Toggle message preview"
              role="switch"
              aria-checked={previewPref}
            />
          </div>
        </section>

        <section className="profile-section blocked-people-section">
          <h3 className="profile-section-title">BLOCKED PEOPLE</h3>
          <p className="blocked-people-copy">
            People you block can no longer start a conversation with you. You can unblock them here.
          </p>
          {blockedContacts.length ? (
            <div className="blocked-people-list">
              {blockedContacts.map((person) => (
                <div className="blocked-person-row" key={person._id}>
                  <div className="blocked-person-avatar">
                    {person.profilePic ? (
                      <img src={person.profilePic} alt="" />
                    ) : (
                      person.fullName.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <span>{person.fullName}</span>
                  <button type="button" onClick={() => setUserBlocked(person._id, false)}>
                    <Ban size={13} /> Unblock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="blocked-empty">No one is blocked.</p>
          )}
        </section>

        <section className="profile-section">
          <h3 className="profile-section-title">ACCOUNT OVERVIEW</h3>
          <div className="profile-info-row">
            <ShieldCheck size={16} />
            <span>Private sign-in session with rotating refresh tokens</span>
          </div>
          <div className="profile-info-row">
            <Clock size={16} />
            <span>Member since {formatDate(authUser?.createdAt)}</span>
          </div>
        </section>

        <div className="profile-save-row">
          <button type="submit" className="profile-save-btn" disabled={isSaving}>
            {isSaving ? (
              <span className="button-spinner" />
            ) : (
              <>
                <Save size={15} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <section className="profile-section danger-zone">
        <h3 className="profile-section-title">SESSION</h3>
        <p className="danger-zone-desc">Sign out of your active session on this device.</p>
        <button type="button" className="danger-btn" onClick={handleLogout}>
          <LogOut size={15} /> Sign Out of Mingle
        </button>
      </section>
    </div>
  );
}

export default ProfilePage;
