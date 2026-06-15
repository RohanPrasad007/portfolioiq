import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import jwt from 'jsonwebtoken';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
      authorization: { params: { scope: 'read:user user:email public_repo' } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.login = (profile as any)?.login;
        token.githubId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session && token) {
        const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only-needs-to-be-replaced';
        const signedToken = jwt.sign(
          {
            sub: token.githubId || token.sub,
            login: token.login,
            email: token.email || session.user?.email,
            picture: token.picture || session.user?.image,
            accessToken: token.accessToken,
          },
          secret
        );
        session.accessToken = signedToken;
        if (session.user) {
          (session.user as any).login = token.login as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only-needs-to-be-replaced',
});
