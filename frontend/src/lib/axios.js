import axios from "axios";

const configuredBaseURL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
const baseURL =
  configuredBaseURL ||
  (import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api");

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});
