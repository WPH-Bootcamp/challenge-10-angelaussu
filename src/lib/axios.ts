import axios from "axios";

export const api = axios.create({
  baseURL: "https://be-blg-production.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Ambil token user yang sedang login
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  }

  return config;
});
