"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, UserPlus, Check } from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  titre: string;
  contenu: string;
  date: string;
  nbLikes: number;
  nbCommentaires?: number;
  auteur: string;
}

interface UserProfile {
  id: string;
  nom: string;
  email: string;
  posts: number;
  abonnements: number;
  abonnes: number;
  photoProfile: string | null;
  banniere: string | null;
}

export default function ProfileContent({ username }: { username: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Vérifier si c'est le profil de l'utilisateur connecté
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Si le nom d'utilisateur correspond à celui de l'utilisateur connecté, rediriger vers /profile
      if (session.user.name === username) {
        router.push("/profile");
        return;
      }
    }
  }, [username, session, status, router]);

  // Première étape : trouver l'ID de l'utilisateur à partir du nom d'utilisateur
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        // Rechercher l'utilisateur par son nom d'utilisateur
        const response = await fetch(`/api/navbarre?query=@${username}`);
        if (!response.ok) {
          throw new Error("Erreur lors de la recherche de l'utilisateur");
        }
        
        const data = await response.json();
        // Chercher l'utilisateur dans les résultats
        const userResult = data.find((result: any) => 
          result.type === "user" && result.nom === username
        );
        
        if (userResult) {
          setUserId(userResult.id);
        } else {
          console.error("Utilisateur non trouvé dans les résultats de recherche");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'ID utilisateur :", error);
      }
    };

    fetchUserId();
  }, [username]);

  // Deuxième étape : récupérer le profil et les posts lorsque nous avons l'ID
  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        // Récupérer le profil avec l'ID utilisateur
        const profileResponse = await fetch(`/api/profil?userId=${userId}`);
        if (!profileResponse.ok) {
          throw new Error("Erreur lors de la récupération du profil");
        }
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
        
        // Récupérer les posts avec le même ID
        const postsResponse = await fetch(`/api/posts?creatorId=${userId}`);
        if (!postsResponse.ok) {
          throw new Error("Erreur lors de la récupération des posts");
        }
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfileAndPosts();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <NavBar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Chargement du profil...</p>
        </div>
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <NavBar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Profil non trouvé</p>
        </div>
      </main>
    );
  }

  // Calculer le nombre total de likes des posts
  const totalLikes = posts.reduce((sum, post) => sum + (post.nbLikes || 0), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* En-tête du profil */}
        <Card className="p-8 mb-8 border-blue-100 bg-white/80 backdrop-blur">
          {userProfile.banniere && (
            <div className="w-full h-32 mb-4 rounded-lg overflow-hidden -mt-4 -mx-4">
              <img 
                src={userProfile.banniere} 
                alt="Bannière" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-blue-100">
              {userProfile.photoProfile && (
                <img 
                  src={userProfile.photoProfile} 
                  alt={userProfile.nom} 
                  className="w-full h-full object-cover"
                />
              )}
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-blue-900 mb-2">{userProfile.nom}</h1>
                  <p className="text-gray-600">
                    Expert en mécanique automobile. Passionné par les voitures de sport et les courses automobiles.
                  </p>
                </div>
                <Button
                  onClick={() => setIsFollowing(!isFollowing)}
                  variant={isFollowing ? "outline" : "default"}
                  className={`${
                    isFollowing ? "border-blue-200 text-blue-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Abonné
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      S'abonner
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.posts}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.abonnes}</div>
                  <div className="text-sm text-gray-600">Abonnés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.abonnements}</div>
                  <div className="text-sm text-gray-600">Abonnements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalLikes}</div>
                  <div className="text-sm text-gray-600">Likes</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Liste des posts */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-600">Aucun post trouvé pour cet utilisateur.</p>
          ) : (
            posts.map((post) => (
              <Link href={`/post/${post.id}?from=publicProfile&username=${username}`} key={post.id}>
                <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur border-blue-100">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2 text-blue-900">{post.titre}</h3>
                    {/* Afficher le contenu HTML comme dans la page post */}
                    <div 
                      className="text-gray-600 line-clamp-3 prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: post.contenu }}
                    ></div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <Heart className="w-4 h-4 mr-1" />
                      <span className="text-sm">{post.nbLikes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{post.nbCommentaires || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <Share2 className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}