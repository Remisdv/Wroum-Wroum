"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, Search, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  // Fonction pour effectuer la recherche
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch(`/api/navbarre?query=${searchQuery}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Erreur lors de la recherche :", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300); // Déclenche la recherche après 300ms
    return () => clearTimeout(timeoutId); // Annule la recherche précédente si l'utilisateur continue à taper
  }, [searchQuery]);

  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex-1 md:flex-none">
            <h1 className="text-xl font-bold text-blue-900">WROUM WROUM</h1>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Menu déroulant des résultats */}
            {results.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-2 z-50">
                {isSearching ? (
                  <p className="p-4 text-gray-500">Recherche en cours...</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {results.map((result) => (
                      <li
                        key={result.id}
                        className="p-4 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          if (result.titre) {
                            // Redirige vers un post
                            router.push(`/post/${result.id}`);
                          } else {
                            // Pour l'instant, ne fait rien pour les profils
                            console.log("Profil sélectionné :", result.nom);
                          }
                        }}
                      >
                        {result.titre ? (
                          <div>
                            <p className="font-medium text-gray-800">{result.titre}</p>
                            <p className="text-sm text-gray-500">Post</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-gray-800">{result.nom}</p>
                            <p className="text-sm text-gray-500">Profil</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-600">
              <Bell className="h-5 w-5" />
            </Button>
            {isAuthenticated ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600"
                  onClick={handleSignOut}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="icon" className="text-gray-600">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="pb-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}