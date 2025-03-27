import { useEffect, useState } from "react";

export default function UserProfile({ userId }: { userId: string }) {
  interface User {
    nom: string;
    photoProfil?: string;
  }

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/user/${userId}`);
      const data = await response.json();
      setUser(data);
    };

    fetchUser();
  }, [userId]);

  return (
    <div>
      {user ? (
        <div>
          <h1>{user.nom}</h1>
          {user.photoProfil ? (
            <img src={user.photoProfil} alt="Photo de profil" width={150} />
          ) : (
            <p>Aucune photo de profil</p>
          )}
        </div>
      ) : (
        <p>Chargement...</p>
      )}
    </div>
  );
}
