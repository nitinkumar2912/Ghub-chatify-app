import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      set({ authUser: response.data });
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      set({ authUser: response.data });
      toast.success("Your account is ready");
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (error.code === "ERR_NETWORK"
            ? "The chat server can’t be reached. Start the backend and try again."
            : "Could not create your account")
      );
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/auth/login", data);
      set({ authUser: response.data });
      toast.success("Welcome back");
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (error.code === "ERR_NETWORK"
            ? "The chat server can’t be reached. Start the backend and try again."
            : "Could not sign in")
      );
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("You’re signed out");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not sign out");
    }
  },
}));
