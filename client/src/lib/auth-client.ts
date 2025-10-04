import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";
import { SERVER_URL } from "./exports";

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
    basePath:'/auth',
    credentials:true
});
export const handleGoogleLogin = async () => {
  try {
    const serverCallbackUrl = `${SERVER_URL}/auth/sso-callback`;

    await signIn.social({
      provider: 'google',
      callbackURL: serverCallbackUrl,
    });
  } catch (error) {
    toast.error('Could not initiate Google login.');
  }
};

export const { signIn,signUp, signOut, useSession } = authClient;