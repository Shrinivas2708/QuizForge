import { betterAuth, type User, type Account } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { usersTable, accountsTable, sessionsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { DbInstance, EnvBindings } from "../types";

export const createAuth = (env: EnvBindings, db: DbInstance) => {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: usersTable,
        account: accountsTable,
        session: sessionsTable,
        verification: schema.verificationTokensTable,
      },
    }),
    basePath: "/auth",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    callbacks: {
      signIn: async ({
        profile,
        account,
        isNewUser,
      }: {
        profile: User;
        account: Account;
        isNewUser: boolean;
      }) => {
        console.log(
          "signIn callback invoked. providerId:",
          account?.providerId
        );
        console.log("profile:", profile);
        console.log("isNewUser:", isNewUser);

        if (account?.providerId === "google" && profile?.email) {
          const existingUser = await db.query.usersTable.findFirst({
            where: eq(schema.usersTable.email, profile.email),
          });
          if (!existingUser) {
            await db.insert(usersTable).values({
              email: profile.email,
              name: profile.name,
              image: profile.image,
              emailVerified: true,
            });
          }
          console.log("Returning redirect to dashboard for google login");
          return {
            redirect: `${env.FRONTEND_URL}/dashboard`,
          };
        }

        console.log("Falling back to default / redirect");
        return {
          redirect: `${env.FRONTEND_URL}/`,
        };
      },
    },
    trustedOrigins: [
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "https://quizforge.shriii.xyz",
    ],
    cookie: {
      domain: env.IS_PROD ? ".shriii.xyz" : undefined,
      secure: env.IS_PROD,
      httpOnly: true,
      sameSite: "none",
    },
  });
};
