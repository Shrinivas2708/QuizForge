export const SERVER_URL: string =
  import.meta.env.VITE_ENV === 'dev'
    ? 'http://localhost:8787'
    : 'https://api.quizforge.shriii.xyz'
