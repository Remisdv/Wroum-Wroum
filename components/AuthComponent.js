// components/AuthComponent.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthComponent() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Bienvenue, {session.user.name}</p>
        <button onClick={() => signOut()}>Se déconnecter</button>
      </div>
    );
  }
  return (
    <div>
      <p>Vous n'êtes pas connecté.</p>
      <button onClick={() => signIn('google')}>Se connecter avec Google</button>
    </div>
  );
}
