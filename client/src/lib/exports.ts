export const SERVER_URL: string =
  import.meta.env.VITE_ENV === 'dev'
    ? 'http://localhost:8787'
    : 'https://api.quizforge.shriii.xyz'

export const ROOMS_URL :  string = import.meta.env.VITE_ENV === 'dev' ? "http://localhost:5173" :"https://room.quizforge.shriii.xyz"
export const sidebarRoutes = ['/new','/chat','/quiz' ]