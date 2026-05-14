import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fs_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Quiet 400/404 in dev so the webpack-overlay doesn't blanket the screen.
// We never auto-toast errors here — call sites decide UX in their .catch().
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // optional: clear stale token
    }
    return Promise.reject(err);
  }
);

export default api;
