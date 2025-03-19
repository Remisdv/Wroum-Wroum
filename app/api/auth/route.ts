// app/api/auth/[...nextauth]/route.ts
import NextAuth, { Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Vérifiez que les crédentials sont définis
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Ajoutez ici la logique pour rechercher l'utilisateur à partir des crédentials fournis
        const user = { id: '1', name: 'John Doe', email: 'john@example.com' };

        if (credentials.email === user.email && credentials.password === 'password') {
          // Si l'utilisateur est trouvé et que le mot de passe correspond, retournez l'utilisateur
          return user;
        } else {
          // Si aucun utilisateur ou mot de passe incorrect, retournez null
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = 'your-generated-token'; // Remplacez par la logique réelle de génération de token
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
