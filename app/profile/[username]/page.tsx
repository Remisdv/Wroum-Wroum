"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { 
  Heart, MessageCircle, Share2, UserPlus, Check, 
  Calendar, User, Mail, MapPin, Link as LinkIcon,
  Clock, PenTool, BookOpen, ChevronLeft,
  CalendarIcon
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";


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
  bio?: string;
  dateInscription?: string;
}

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  const username = params.username;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [showToast, setShowToast] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Calculate total likes from posts
  const totalLikes = posts.reduce((sum, post) => sum + post.nbLikes, 0);

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

  // Afficher un toast
  const displayToast = useCallback((type: 'success' | 'error', message: string) => {
    setShowToast({ type, message });
    
    // Masquer le toast après 3 secondes
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  }, []);

  // Trouver l'ID de l'utilisateur à partir du nom d'utilisateur
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        // Rechercher l'utilisateur par son nom d'utilisateur
        const response = await fetch(`/api/navbarre?query=@${username}`);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
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

    if (username) {
      fetchUserId();
    }
  }, [username]);

  // Récupérer le profil et les posts lorsque nous avons l'ID
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
        setUserProfile({
          ...profileData,
          // Ajout de données fictives pour démonstration
          dateInscription: profileData.dateInscription || "2022-06-15",
          bio: profileData.bio || "Expert en mécanique automobile. Passionné par les voitures de sport et les courses automobiles."
        });
        
        // Récupérer les posts avec le même ID
        const postsResponse = await fetch(`/api/posts/get?creatorId=${userId}`);
        
        if (!postsResponse.ok) {
          throw new Error("Erreur lors de la récupération des posts");
        }
        
        const postsData = await postsResponse.json();
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
      displayToast('error', "Vous devez être connecté pour suivre un utilisateur");
      return;
    }

    setIsFollowingLoading(true);

    try {
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

      const result = await response.json();

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
      
      // Notification toast
      displayToast('success', isFollowing ? "Vous vous êtes désabonné" : "Vous êtes maintenant abonné");
    } catch (error) {
      console.error("Erreur lors de la gestion de l'abonnement:", error);
      displayToast('error', "Une erreur est survenue lors de la gestion de l'abonnement");
    } finally {
      setIsFollowingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <NavBar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-gray-700">Chargement du profil...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <NavBar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="p-10 text-center border-red-100">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <User className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Profil non trouvé</h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Le profil que vous recherchez n'existe pas ou a été supprimé.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Retourner à l'accueil
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  // Reste de votre composant (interface utilisateur)...
  // Identique à ce que vous avez déjà
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center
              ${showToast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 
              'bg-red-50 border border-red-200 text-red-700'}`}
          >
            <div className="mr-2">{showToast.type === 'success' ? '✓' : '✗'}</div>
            <div>{showToast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Bouton Retour */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 group transition-all -ml-2"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="h-4 w-4 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Button>
        </motion.div>

        {/* Bannière et En-tête du profil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Bannière */}
          <div className="h-48 md:h-64 rounded-t-xl overflow-hidden relative mb-0 bg-gradient-to-r from-blue-400 to-indigo-600">
            {userProfile.banniere ? (
              <img 
                src={userProfile.banniere} 
                alt="Bannière" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 opacity-50 bg-pattern-cars"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
          
          {/* Carte principale du profil */}
          <Card className="relative px-6 pt-16 pb-6 -mt-16 z-10 border-blue-100 bg-white/90 backdrop-blur shadow-md">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <div className="absolute -top-16 left-6 md:left-6">
                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                  {userProfile.photoProfile ? (
                    <img 
                      src={userProfile.photoProfile} 
                      alt={userProfile.nom} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </Avatar>
              </div>
              
              {/* Infos principales */}
              <div className="flex-1 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">{userProfile.nom}</h1>
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Membre depuis {userProfile.dateInscription ? 
                          new Date(userProfile.dateInscription).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long'
                          }) : 
                          "juin 2022"}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleFollowToggle}
                    disabled={isFollowingLoading}
                    variant={isFollowing ? "outline" : "default"}
                    className={`${
                      isFollowing 
                        ? "border-blue-200 text-blue-700 hover:bg-blue-50" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isFollowingLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Chargement...
                      </>
                    ) : isFollowing ? (
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
                
                {/* Bio */}
                <p className="text-gray-600 mb-6">
                  {userProfile.bio}
                </p>
                
                {/* Statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-700">{userProfile.posts}</div>
                    <div className="text-sm text-gray-600">Publications</div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-indigo-700">{userProfile.abonnes}</div>
                    <div className="text-sm text-gray-600">Abonnés</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">{userProfile.abonnements}</div>
                    <div className="text-sm text-gray-600">Abonnements</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-700">{totalLikes}</div>
                    <div className="text-sm text-gray-600">J'aime reçus</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Navigation par onglets */}
        <div className="flex border-b border-gray-200 mt-8 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            <div className="flex items-center">
              <PenTool className="w-4 h-4 mr-2" />
              Publications
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'about'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('about')}
          >
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              À propos
            </div>
          </button>
        </div>

        {/* Contenu des onglets */}
        <AnimatePresence mode="wait">
          {activeTab === 'posts' ? (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {posts.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 border-gray-200 bg-gray-50">
                  <div className="flex flex-col items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Aucune publication</h3>
                    <p className="text-gray-500">
                      {userProfile.nom} n'a pas encore partagé de contenu.
                    </p>
                  </div>
                </Card>
              ) : (
                posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Link href={`/post/${post.id}?from=publicProfile&username=${username}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-blue-100">
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-8 h-8 border-2 border-blue-100">
                              {userProfile.photoProfile ? (
                                <img 
                                  src={userProfile.photoProfile} 
                                  alt={userProfile.nom} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-gray-400" />
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-800">{userProfile.nom}</div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(post.date), {
                                  addSuffix: true,
                                  locale: fr
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-blue-700 transition-colors">
                            {post.titre}
                          </h3>
                          
                          <div 
                            className="text-gray-600 line-clamp-3 text-sm mb-4"
                            dangerouslySetInnerHTML={{ __html: post.contenu }}
                          ></div>

                          <div className="flex gap-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Heart className={`w-4 h-4 ${post.nbLikes > 0 ? 'text-red-500' : ''}`} />
                              <span className="text-sm">{post.nbLikes}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-gray-500">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{post.nbCommentaires || 0}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-gray-500 ml-auto">
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700 p-1 h-auto">
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 border-blue-100 shadow-md">
                <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-500" />
                  Informations personnelles
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800">******@example.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="text-gray-800">
                        {userProfile.dateInscription ? 
                          new Date(userProfile.dateInscription).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 
                          "15 juin 2022"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <PenTool className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Publications</p>
                      <p className="text-gray-800">{userProfile.posts} publications</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-medium text-gray-800 mb-3">À propos</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {userProfile.bio}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}