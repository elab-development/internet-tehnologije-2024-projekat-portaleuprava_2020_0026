import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const authRaw = sessionStorage.getItem("auth");
  if (authRaw) {
    const auth = JSON.parse(authRaw);
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
  }
  return config;
});

export default api;
