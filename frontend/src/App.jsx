import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import PageLoader from "./components/PageLoader";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem("mingle-theme") || "dark";
    } catch {
      return "dark";
    }
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#100f1a" : "#f4f1f7"
    );
  }, [theme]);

  useEffect(() => {
    if (authUser) connectSocket(authUser);
    else disconnectSocket();
  }, [authUser, connectSocket, disconnectSocket]);

  if (isCheckingAuth) return <div className="app-backdrop" data-theme={theme}><PageLoader /></div>;

  return (
    <div className="app-backdrop" data-theme={theme}>
      <Routes>
        <Route path="/" element={<HomePage theme={theme} onToggleTheme={toggleTheme} isSignedIn={Boolean(authUser)} />} />
        <Route path="/login" element={!authUser ? <LoginPage theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/chat" replace />} />
        <Route path="/signup" element={!authUser ? <SignUpPage theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/chat" replace />} />
        <Route path="/chat" element={authUser ? <ChatPage theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
