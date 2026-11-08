import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageLoader from "./components/PageLoader";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const VerifyEmailPage = lazy(() =>
  import("./pages/RecoveryPages").then((module) => ({ default: module.VerifyEmailPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/RecoveryPages").then((module) => ({ default: module.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/RecoveryPages").then((module) => ({ default: module.ResetPasswordPage })),
);

function App() {
  const location = useLocation();
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = window.localStorage.getItem("mingle-theme");
      if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    } catch {
      // The landing page keeps its cinematic dark default when storage is unavailable.
    }
    return "dark";
  });

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("mingle-theme", nextTheme);
      } catch {
        // The theme still changes for this visit when storage is unavailable.
      }
      return nextTheme;
    });
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#100f1a" : "#f4f1f7");
  }, [theme]);

  useEffect(() => {
    const handleSessionExpired = () => useAuthStore.setState({ authUser: null });
    window.addEventListener("mingle:session-expired", handleSessionExpired);
    return () => window.removeEventListener("mingle:session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    if (authUser) connectSocket(authUser);
    else disconnectSocket();
  }, [authUser, connectSocket, disconnectSocket]);

  if (isCheckingAuth)
    return (
      <div
        className={`app-backdrop ${location.pathname === "/chat" ? "app-backdrop-chat" : ""} ${location.pathname === "/" ? "app-backdrop-home" : ""}`}
        data-theme={theme}
      >
        <PageLoader />
      </div>
    );

  return (
    <div
      className={`app-backdrop ${location.pathname === "/chat" ? "app-backdrop-chat" : ""} ${location.pathname === "/" ? "app-backdrop-home" : ""}`}
      data-theme={theme}
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage theme={theme} onToggleTheme={toggleTheme} isSignedIn={Boolean(authUser)} />
            }
          />
          <Route
            path="/login"
            element={
              !authUser ? (
                <LoginPage theme={theme} onToggleTheme={toggleTheme} />
              ) : (
                <Navigate to="/chat" replace />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !authUser ? (
                <SignUpPage theme={theme} onToggleTheme={toggleTheme} />
              ) : (
                <Navigate to="/chat" replace />
              )
            }
          />

          <Route
            path="/verify-email"
            element={<VerifyEmailPage theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route
            path="/chat"
            element={
              authUser ? (
                <ChatPage theme={theme} onToggleTheme={toggleTheme} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              authUser ? (
                <ProfilePage theme={theme} onToggleTheme={toggleTheme} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
