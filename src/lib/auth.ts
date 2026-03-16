import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import { compare } from 'bcrypt';
import { releasePendingBalances } from './platform';
import { ActivityAction } from '@prisma/client';
import { logActivity } from './activity';

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      tierId?: string | null;
      tierName?: string;
      discountPercent?: number;
      balance?: number;
      salesBalance?: number;
      pendingBalance?: number;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    tierId?: string | null;
    tier?: {
      name: string;
      discountPercent: number;
    } | null;
    balance?: number;
    salesBalance?: number;
    pendingBalance?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    tierId?: string | null;
    tierName?: string;
    discountPercent?: number;
    balance?: number;
    salesBalance?: number;
    pendingBalance?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { tier: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        // Check if user is banned
        if (user.isBanned) {
          throw new Error('UserBanned');
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        // Auto-release pending balances on login
        try {
          await releasePendingBalances(user.id);
        } catch (error) {
          console.error('Failed to release pending balances:', error);
          // Continue with login even if release fails
        }

        // Fetch updated user data after potential balance release
        const updatedUser = await db.user.findUnique({
          where: { id: user.id },
          include: { tier: true },
        });

        return {
          id: updatedUser!.id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          role: updatedUser!.role,
          tierId: updatedUser!.tierId,
          tier: updatedUser!.tier,
          balance: updatedUser!.balance,
          salesBalance: updatedUser!.salesBalance,
          pendingBalance: updatedUser!.pendingBalance,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tierId = user.tierId;
        token.tierName = user.tier?.name;
        token.discountPercent = user.tier?.discountPercent;
        token.balance = user.balance;
        token.salesBalance = user.salesBalance;
        token.pendingBalance = user.pendingBalance;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tierId = token.tierId;
        session.user.tierName = token.tierName;
        session.user.discountPercent = token.discountPercent;
        session.user.balance = token.balance;
        session.user.salesBalance = token.salesBalance;
        session.user.pendingBalance = token.pendingBalance;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      // Default redirect after login
      return `${baseUrl}/dashboard/overview`;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      // Log successful login
      if (!isNewUser) {
        try {
          await logActivity({
            action: ActivityAction.LOGIN,
            userId: user.id,
            entityType: 'User',
            entityId: user.id,
            entityName: user.name || user.email || 'Unknown',
          });
        } catch (error) {
          console.error('Failed to log login activity:', error);
        }
      }
    },
    async signOut({ token }) {
      // Log logout
      if (token?.id) {
        try {
          await logActivity({
            action: ActivityAction.LOGOUT,
            userId: token.id as string,
          });
        } catch (error) {
          console.error('Failed to log logout activity:', error);
        }
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to true in production with HTTPS
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
};
