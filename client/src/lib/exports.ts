export const SERVER_URL: string =
  import.meta.env.VITE_ENV === 'dev'
    ? 'http://127.0.0.1:8787'
    : 'https://server.ssherikar2005.workers.dev' // Changed this!

export const ROOMS_URL: string = 
  import.meta.env.VITE_ENV === 'dev' 
    ? "http://localhost:5173" 
    : "https://room.quizforge.shriii.xyz"

export const sidebarRoutes = ['/new','/chat','/quiz']