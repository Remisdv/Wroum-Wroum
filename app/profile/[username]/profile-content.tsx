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

// Interface adaptée à la structure de données renvoyée par l'API
interface UserProfile {
  id: string;
  nom: string;
  email: string;
  posts: number; // nombre de posts (pas un tableau)
  abonnements: number; // nombre d'abonnements (pas un tableau)
  abonnes: number; // nombre d'abonnés (pas un tableau)
  photoProfile: string | null;
  banniere: string | null;
}

export default function ProfileContent({ username }: { username: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
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

  // Trouver l'ID de l'utilisateur à partir du nom d'utilisateur
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        console.log("Recherche de l'utilisateur:", username);
        // Rechercher l'utilisateur par son nom d'utilisateur
        const response = await fetch(`/api/navbarre?query=@${username}`);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Résultats de recherche navbarre:", data);
        
        // Chercher l'utilisateur dans les résultats
        const userResult = data.find((result: any) => 
          result.type === "user" && result.nom === username
        );
        
        if (userResult) {
          console.log("Utilisateur trouvé avec ID:", userResult.id);
          setUserId(userResult.id);
        } else {
          console.error("Utilisateur non trouvé dans les résultats de recherche");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'ID utilisateur :", error);
      }
    };

    if (username) {
      fetchUserId();
    }
  }, [username]);

  // Récupérer le profil et les posts lorsque nous avons l'ID
  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      if (!userId) {
        console.log("Pas d'ID utilisateur, impossible de charger le profil");
        return;
      }
      
      try {
        setIsLoading(true);
        console.log("Chargement du profil pour userId:", userId);
        
        // Récupérer le profil avec l'ID utilisateur
        const profileResponse = await fetch(`/api/profil?userId=${userId}`);
        console.log("Statut de la réponse profil:", profileResponse.status);
        
        if (!profileResponse.ok) {
          throw new Error("Erreur lors de la récupération du profil");
        }
        
        const profileData = await profileResponse.json();
        console.log("Données du profil reçues:", profileData);
        setUserProfile(profileData);
        
        // Récupérer les posts avec le même ID
        const postsResponse = await fetch(`/api/posts?creatorId=${userId}`);
        console.log("Statut de la réponse posts:", postsResponse.status);
        
        if (!postsResponse.ok) {
          throw new Error("Erreur lors de la récupération des posts");
        }
        
        const postsData = await postsResponse.json();
        console.log("Données des posts reçues:", postsData);
        setPosts(postsData);

        // Vérifier l'état d'abonnement si l'utilisateur est connecté
        if (status === "authenticated" && session?.user?.id) {
          checkFollowingStatus(session.user.id, userId);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfileAndPosts();
    }
  }, [userId, session, status]);

  // Fonction pour vérifier l'état d'abonnement
  const checkFollowingStatus = async (currentUserId: string, profileUserId: string) => {
    try {
      const response = await fetch(`/api/check-abonnement?followerId=${currentUserId}&followingId=${profileUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'abonnement:", error);
    }
  };

  // Fonction pour gérer l'abonnement/désabonnement
  const handleFollowToggle = async () => {
    if (!session?.user?.id || !userId) {
      alert("Vous devez être connecté pour suivre un utilisateur");
      return;
    }

    setIsFollowingLoading(true);

    try {
      console.log("Envoi de la requête d'abonnement:", {
        followerId: session.user.id,
        followingId: userId
      });
      
      const response = await fetch("/api/abonnement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followerId: session.user.id,
          followingId: userId,
        }),
      });

      console.log("Statut de la réponse abonnement:", response.status);
      const result = await response.json();
      console.log("Résultat de l'opération d'abonnement:", result);

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la gestion de l'abonnement");
      }

      // Mettre à jour l'état d'abonnement
      setIsFollowing(!isFollowing);
      
      // Mettre à jour le compteur d'abonnés dans l'interface
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          abonnes: isFollowing ? Math.max(0, userProfile.abonnes - 1) : userProfile.abonnes + 1
        });
      }
      
      // Notification simple
      alert(isFollowing ? "Vous vous êtes désabonné" : "Vous êtes maintenant abonné");
    } catch (error) {
      console.error("Erreur lors de la gestion de l'abonnement:", error);
      alert("Une erreur est survenue lors de la gestion de l'abonnement");
    } finally {
      setIsFollowingLoading(false);
    }
  };

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
                  onClick={handleFollowToggle}
                  disabled={isFollowingLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className={`${
                    isFollowing ? "border-blue-200 text-blue-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isFollowingLoading ? (
                    "Chargement..."
                  ) : isFollowing ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Se désabonner
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