import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  appName: "Finanzas",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "local-development-secret-change-before-production",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: "authUser",
  },
  session: {
    modelName: "authSession",
  },
  account: {
    modelName: "authAccount",
  },
  verification: {
    modelName: "authVerification",
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  plugins: [nextCookies()],
});
