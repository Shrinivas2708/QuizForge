import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_ENV === "dev"
    ? "http://localhost:8787"
    : "https://api.quizforge.shriii.xyz";

const apiClient = axios.create({
    baseURL: BACKEND_URL,
});

export default apiClient;