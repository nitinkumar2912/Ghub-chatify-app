import axios from "axios";

const configuredBaseURL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
const baseURL =
  configuredBaseURL ||
  (import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api");

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshRequest;
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthRequest = /^\/auth\/(?:login|signup|refresh|logout)/.test(request?.url || "");
    if (error.response?.status !== 401 || !request || request._retried || isAuthRequest) {
      return Promise.reject(error);
    }

    request._retried = true;
    try {
      refreshRequest ||= axiosInstance.post("/auth/refresh").finally(() => {
        refreshRequest = null;
      });
      await refreshRequest;
      return axiosInstance(request);
    } catch (refreshError) {
      window.dispatchEvent(new Event("mingle:session-expired"));
      return Promise.reject(refreshError);
    }
  },
);
