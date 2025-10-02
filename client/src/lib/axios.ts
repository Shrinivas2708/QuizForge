import axios from "axios"

let BACKEND_URL;
if(import.meta.env.VITE_ENV == "dev"){
    BACKEND_URL = "http://127.0.0.1:8787"
}else{
    BACKEND_URL = "https://api.quizforge.shriii.xyz"
}

const apiClient = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 error AND that we are NOT already on the login page
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      // If we get a 401, it means the user is not logged in.
      // We can redirect them to the login page.
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
)

export default apiClient