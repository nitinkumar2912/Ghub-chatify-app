import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import {
  MessageCircleIcon,
  MailIcon,
  LoaderIcon,
  LockIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="w-full flex items-center justify-center p-4 bg-transparent">

      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">

        <BorderAnimatedContainer>

          {/* MAIN CARD */}
          <div
            className="
              w-full
              h-full
              flex
              flex-col
              md:flex-row
              overflow-hidden
              rounded-2xl
              bg-[#080b14]/90
            "
          >

            {/* ================= LEFT SIDE ================= */}

            <div
              className="
                md:w-1/2
                p-8
                flex
                items-center
                justify-center
                md:border-r
                border-slate-600/30
                bg-[#080b14]/90
              "
            >

              <div className="w-full max-w-md">

                {/* HEADING */}

                <div className="text-center mb-8">

                  <MessageCircleIcon
                    className="
                      w-12
                      h-12
                      mx-auto
                      text-slate-400
                      mb-4
                    "
                  />

                  <h2
                    className="
                      text-2xl
                      font-bold
                      text-slate-200
                      mb-2
                    "
                  >
                    Welcome Back
                  </h2>

                  <p className="text-slate-400">
                    Login to access to your account
                  </p>

                </div>


                {/* FORM */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >

                  {/* EMAIL */}

                  <div>

                    <label className="auth-input-label">
                      Email
                    </label>

                    <div className="relative">

                      <MailIcon className="auth-input-icon" />

                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
                        className="input"
                        placeholder="johndoe@gmail.com"
                      />

                    </div>

                  </div>


                  {/* PASSWORD */}

                  <div>

                    <label className="auth-input-label">
                      Password
                    </label>

                    <div className="relative">

                      <LockIcon className="auth-input-icon" />

                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        className="input"
                        placeholder="Enter your password"
                      />

                    </div>

                  </div>


                  {/* LOGIN BUTTON */}

                  <button
                    className="auth-btn"
                    type="submit"
                    disabled={isLoggingIn}
                  >

                    {isLoggingIn ? (
                      <LoaderIcon
                        className="
                          w-5
                          h-5
                          animate-spin
                          mx-auto
                        "
                      />
                    ) : (
                      "Sign In"
                    )}

                  </button>

                </form>


                {/* SIGNUP LINK */}

                <div className="mt-6 text-center">

                  <Link
                    to="/signup"
                    className="auth-link"
                  >
                    Don't have an account? Sign Up
                  </Link>

                </div>

              </div>

            </div>


            {/* ================= RIGHT SIDE ================= */}

            <div
              className="
                hidden
                md:w-1/2
                md:flex
                items-center
                justify-center
                p-6
                relative
                overflow-hidden
                bg-gradient-to-br
                from-[#0d172c]
                via-[#101b35]
                to-[#0b1024]
              "
            >

              {/* BLUE GLOW */}

              <div
                className="
                  absolute
                  w-80
                  h-80
                  bg-blue-600/10
                  rounded-full
                  blur-[100px]
                  top-1/2
                  left-1/2
                  -translate-x-1/2
                  -translate-y-1/2
                "
              />

              {/* PURPLE GLOW */}

              <div
                className="
                  absolute
                  w-64
                  h-64
                  bg-purple-600/10
                  rounded-full
                  blur-[100px]
                  bottom-[-100px]
                  right-[-80px]
                "
              />


              <div className="relative z-10 w-full">

                {/* IMAGE */}

                <img
                  src="/login.png"
                  alt="People using mobile devices"
                  className="
                    w-full
                    h-auto
                    object-contain
                    drop-shadow-[0_0_35px_rgba(59,130,246,0.15)]
                  "
                />


                {/* TEXT */}

                <div className="mt-6 text-center">

                  <h3
                    className="
                      text-xl
                      font-medium
                      text-cyan-400
                    "
                  >
                    Connect anytime, anywhere
                  </h3>


                  {/* BADGES */}

                  <div className="mt-4 flex justify-center gap-4">

                    <span className="auth-badge">
                      Free
                    </span>

                    <span className="auth-badge">
                      Easy Setup
                    </span>

                    <span className="auth-badge">
                      Private
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </BorderAnimatedContainer>

      </div>

    </div>
  );
}

export default LoginPage;