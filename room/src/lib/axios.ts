import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_ENV === "dev"
    ? "http://localhost:8787"
    : "https://server.ssherikar2005.workers.dev";

const apiClient = axios.create({
    baseURL: BACKEND_URL,
});

export default apiClient;