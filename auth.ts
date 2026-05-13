import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { isSuperAdminEmail } from '@/lib/super-admin';

// Config base — Edge compatible (JWT only, no PrismaAdapter)
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Importação dinâmica para não expor Prisma no Edge
        const { prisma } = await import('@/lib/prisma');
        const bcryptLib = await import('bcryptjs');

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcryptLib.default.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Bloqueia login Google se o email nao tem User cadastrado.
    // Credentials nao chega aqui (passa por authorize que ja valida).
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        });
        if (!dbUser) {
          // Manda pra /login com erro — usuario precisa se cadastrar primeiro
          return '/login?error=NaoCadastrado';
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Login fresh (Credentials retorna user com tenantId, Google nao)
      if (user) {
        token.id = user.id;
        if ((user as any).tenantId) {
          token.tenantId = (user as any).tenantId;
          token.role = (user as any).role;
        }
      }
      // Se ainda nao temos tenantId (caso Google OAuth), busca no banco
      // por email. Roda 1x — proximas requests usam o token cacheado.
      if (!token.tenantId && token.email) {
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, tenantId: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.tenantId = dbUser.tenantId;
          token.role = dbUser.role;
        }
      }
      // isSuperAdmin é derivado do email — recalcula a cada refresh do JWT
      token.isSuperAdmin = isSuperAdminEmail(token.email as string | undefined);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).tenantId = token.tenantId as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isSuperAdmin = Boolean(token.isSuperAdmin);
      }
      return session;
    },
  },
});
