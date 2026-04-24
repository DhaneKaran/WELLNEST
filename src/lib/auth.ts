// import { NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from 'bcryptjs';
// import prisma from "./prisma";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null;
        
//         // Check for hardcoded Admin credentials (no database lookup)
//         if (credentials.email === 'karandhane0808@gmail.com' && credentials.password === 'Karan@123') {
//           return {
//             id: 'ADMIN',
//             email: 'karandhane0808@gmail.com',
//             role: 'ADMIN',
//             name: 'Admin',
//             roles: ['ADMIN']
//           };
//         }
        
//         try {
//           const user = await Promise.race([
//             prisma.user.findUnique({ 
//               where: { email: credentials.email },
//               include: { roleAssignments: true },
//             }),
//             new Promise((_, reject) => 
//               setTimeout(() => reject(new Error('Database connection timeout')), 5000)
//             )
//           ]) as any;
          
//           if (!user) return null;
          
//           // Prevent Admin from existing in database
//           if (user.role === 'ADMIN') {
//             console.warn(`Attempt to authenticate Admin user from database: ${credentials.email}`);
//             return null;
//           }
          
//           const isValid = await bcrypt.compare(credentials.password, user.password);
//           return isValid ? { 
//             id: user.id.toString(),
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             roles: [user.role, ...(user.roleAssignments?.map(r => r.role) || [])]
//           } : null;
//         } catch (error: any) {
//           console.error("Authorization error:", error?.message || error);
//           if (process.env.NODE_ENV !== 'production') {
//             console.log("Database may be unreachable. Check DATABASE_URL and network connection.");
//           }
//           return null;
//         }
//       },
//     }),
//   ],
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     async jwt({ token, user }: any) {
//       if (user) {
//         token.role = user.role;
//         token.roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
//         token.id = user.id;
//       }
//       return token;
//     },
//     async session({ session, token }: any) {
//       if (token) {
//         session.user.id = token.id;
//         session.user.role = token.role;
//         const rawRoles = token.roles;
//         (session.user as any).roles = Array.isArray(rawRoles)
//           ? rawRoles
//           : rawRoles
//             ? Object.values(rawRoles)
//             : [token.role].filter(Boolean);
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: "/login",
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };


import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import prisma from "./prisma";

// FIX: Admin credentials moved to environment variables
// Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env.local / Vercel env vars
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

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

        // FIX: check env vars exist before using them
        if (
          ADMIN_EMAIL && ADMIN_PASSWORD &&
          credentials.email === ADMIN_EMAIL &&
          credentials.password === ADMIN_PASSWORD
        ) {
          return {
            id: 'ADMIN',
            email: ADMIN_EMAIL,
            role: 'ADMIN',
            name: 'Admin',
            roles: ['ADMIN']
          };
        }

        try {
          const user = await Promise.race([
            prisma.user.findUnique({
              where: { email: credentials.email.trim().toLowerCase() },
              include: { roleAssignments: true },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Database connection timeout')), 5000)
            )
          ]) as any;

          if (!user) return null;

          if (user.role === 'ADMIN') {
            console.warn(`DB Admin login blocked for: ${credentials.email}`);
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          return isValid ? {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            roles: [user.role, ...(user.roleAssignments?.map((r: any) => r.role) || [])]
          } : null;
        } catch (error: any) {
          console.error("Authorization error:", error?.message || error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }: any) {
      // On initial sign-in, seed the token from the user object returned by authorize()
      if (user) {
        token.role = user.role;
        token.roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
        token.id = user.id;
      }

      // On every subsequent request, re-fetch the role from the DB so that
      // admin approvals (PATIENT → DOCTOR / PHARMACIST) are reflected immediately
      // without requiring the user to log out and back in.
      // Skip for the hardcoded ADMIN token (id === 'ADMIN').
      if (token.id && token.id !== 'ADMIN') {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { role: true },
          });
          if (freshUser && freshUser.role !== token.role) {
            token.role = freshUser.role;
            token.roles = [freshUser.role];
          }
        } catch {
          // Non-fatal — keep whatever role is already in the token
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        const rawRoles = token.roles;
        (session.user as any).roles = Array.isArray(rawRoles)
          ? rawRoles
          : rawRoles
            ? Object.values(rawRoles)
            : [token.role].filter(Boolean);
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};