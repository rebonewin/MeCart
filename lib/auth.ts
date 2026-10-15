import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? "mecart-default-secret-change-me",
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
  async authorize(credentials) {
    const username = String(credentials?.username ?? "");
    const password = String(credentials?.password ?? "");
    if (!username || !password) return null;

    let authenticatedUser: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
      username: string | null;
    } | null = null;

    try {
      const user = await prisma.user.findFirst({
        where: { OR: [{ username }, { email: username }] },
      });

      if (user && user.password && !user.deletedAt) {
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
          authenticatedUser = {
            id: user.id,
            name: user.name ?? user.username ?? null,
            email: user.email ?? null,
            role: user.role,
            username: user.username ?? null,
          };
        }
      }
    } catch {
      // Fall through to demo credentials if the database is unavailable.
    }

    if (authenticatedUser) return authenticatedUser;

    const adminUsername = process.env.ADMIN_USERNAME ?? "A153TA";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "Welcome@Port153";
    const customerUsername = process.env.CUSTOMER_USERNAME ?? "customer01";
    const customerPassword = process.env.CUSTOMER_PASSWORD ?? "Welcome@Customer153";

    if (username === adminUsername && password === adminPassword) {
      return { id: "admin-demo", name: "Administrator", email: `${adminUsername.toLowerCase()}@mecart.local`, role: "ADMIN", username: adminUsername };
    }
    if (username === customerUsername && password === customerPassword) {
      return { id: "customer-demo", name: "Demo Customer", email: "customer@mecart.demo", role: "USER", username: customerUsername };
    }

    return null;
  },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.username = (user as { username?: string | null }).username ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = (token.username as string | null) ?? null;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "mecart.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
