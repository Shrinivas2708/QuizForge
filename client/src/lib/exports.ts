export let CALLBACK_URL : string ;
if(import.meta.env.VITE_ENV=="dev"){
    CALLBACK_URL = "http://localhost:3000/auth-callback"
}else{
    CALLBACK_URL = "https://quizforge.shriii.xyz/dashboard"
}