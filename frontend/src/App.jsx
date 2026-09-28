import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";

function App() {
  const {checkAuth,isCheckingAuth,authUser} =useAuthStore();

useEffect( () => {
  checkAuth();
},[checkAuth]);

console.log({authUser});

if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#05070b] relative flex items-center justify-center p-4 overflow-hidden">

      {/* Subtle Grid Background */}
      <div
        className="
          absolute inset-0
          bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)]
          bg-[size:32px_32px]
        "
      />

      {/* Top Left Blue Glow */}
      <div
        className="
          absolute
          top-[-150px]
          left-[-150px]
          size-96
          bg-blue-600/10
          blur-[130px]
          rounded-full
        "
      />

      {/* Bottom Right Purple Glow */}
      <div
        className="
          absolute
          bottom-[-150px]
          right-[-150px]
          size-96
          bg-purple-600/10
          blur-[130px]
          rounded-full
        "
      />
      {/* Routes */}
      <Routes> 
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ?<LoginPage />: <Navigate to={"/"} />}  />
        <Route path="/signup" element={!authUser ?<SignUpPage /> : <Navigate to={"/"} /> } />
      </Routes>

    </div>
  );
}



export default App;