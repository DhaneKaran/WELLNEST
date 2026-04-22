import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Check for hardcoded Admin credentials (no database lookup)
        if (credentials.email === 'karandhane0808@gmail.com' && credentials.password === 'Karan@123') {
          return {
            id: 'ADMIN',
            email: 'karandhane0808@gmail.com',
            role: 'ADMIN',
            name: 'Admin',
            roles: ['ADMIN']
          };
        }
        
        try {
          const user = await Promise.race([
            prisma.user.findUnique({ 
              where: { email: credentials.email },
              include: { roleAssignments: true },
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database connection timeout')), 5000)
            )
          ]) as any;
          
          if (!user) return null;
          
          // Prevent Admin from existing in database
          if (user.role === 'ADMIN') {
            console.warn(`Attempt to authenticate Admin user from database: ${credentials.email}`);
            return null;
          }
          
          const isValid = await bcrypt.compare(credentials.password, user.password);
          return isValid ? { 
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            roles: [user.role, ...(user.roleAssignments?.map(r => r.role) || [])]
          } : null;
        } catch (error: any) {
          console.error("Authorization error:", error?.message || error);
          if (process.env.NODE_ENV !== 'production') {
            console.log("Database may be unreachable. Check DATABASE_URL and network connection.");
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.roles = user.roles || [user.role];
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        (session.user as any).roles = token.roles || [token.role];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 