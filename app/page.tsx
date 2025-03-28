"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { 
  Heart, MessageCircle, Share2, Clock, TrendingUp, Filter, 
  Search, ChevronDown, BookOpen, Award, Bookmark, Image, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Post {
  id: string;
  auteur: string;
  titre: string;
  contenu: string;
  date: string;
  nbLikes: number;
  nbCommentaires?: number;
  auteurPhoto?: string;
}
const categories = [
  { name: "Tous", icon: <BookOpen className="w-4 h-4" /> },
  { name: "Tendances", icon: <TrendingUp className="w-4 h-4" /> },
  { name: "Actualités", icon: <Award className="w-4 h-4" /> },
  { name: "Conseils", icon: <Bookmark className="w-4 h-4" /> },
];

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [showFilters, setShowFilters] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [authorProfiles, setAuthorProfiles] = useState<{[key: string]: string}>({});


  const fetchPosts = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/get?page=${page}&pageSize=3`);
      const data: Post[] = await response.json();

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((post) => post.id));
          const newPosts = data.filter((post) => !existingIds.has(post.id));
          return [...prevPosts, ...newPosts];
        });

        // Récupérer les photos de profil pour les nouveaux auteurs
        const authors = data.map(post => post.auteur);
        fetchAuthorProfiles(authors);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des posts :", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };


  const fetchAuthorProfiles = async (authors: string[]) => {
    const uniqueAuthors = Array.from(new Set(authors));
    
    for (const author of uniqueAuthors) {
      if (!authorProfiles[author]) {
        try {
          // Utilisez votre API existante ou créez un nouveau endpoint
          const response = await fetch(`/api/navbarre?query=@${author}`);
          if (response.ok) {
            const data = await response.json();
            const userResult = data.find((result: any) => 
              result.type === "user" && result.nom === author
            );
            
            if (userResult && userResult.id) {
              const profileResponse = await fetch(`/api/profil?userId=${userResult.id}`);
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                
                if (profileData.photoProfile) {
                  setAuthorProfiles(prev => ({
                    ...prev,
                    [author]: profileData.photoProfile
                  }));
                }
              }
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du profil pour ${author}:`, error);
        }
      }
    }
  };


  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setPage((prevPage) => prevPage + 1);
      
      // Scroll animation après chargement
      setTimeout(() => {
        if (feedRef.current) {
          const lastChild = feedRef.current.lastElementChild;
          if (lastChild) {
            lastChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 1000);
    }
  };

  const navigateToUserProfile = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${username}`);
  };

  const navigateToPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  // Indicateur de "J'aime" simulé
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  
  const handleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });
    
    // Simulation d'un changement visuel immédiat
    setPosts(posts => 
      posts.map(post => 
        post.id === postId 
          ? { ...post, nbLikes: likedPosts.has(postId) ? post.nbLikes - 1 : post.nbLikes + 1 } 
          : post
      )
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Hero section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Bienvenue sur <span className="text-blue-600">Wroum-Wroum</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Découvrez les dernières actualités, astuces et discussions de la communauté automobile.
          </p>
          

        </motion.div>
        
        {/* Filtres et catégories */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Fil d'actualité</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 border-gray-300"
            >
              <Filter className="w-4 h-4" />
              Filtrer
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {/* Catégories horizontales */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={activeCategory === category.name ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 ${
                  activeCategory === category.name 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.icon}
                {category.name}
              </Button>
            ))}
          </div>
          
          {/* Filtres avancés collapsible */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white/80 backdrop-blur mt-4 p-4 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm p-2 text-sm">
                        <option>Les plus récents</option>
                        <option>Les plus populaires</option>
                        <option>Les plus commentés</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm p-2 text-sm">
                        <option>Aujourd'hui</option>
                        <option>Cette semaine</option>
                        <option>Ce mois</option>
                        <option>Toutes les dates</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm p-2 text-sm">
                        <option>Toutes</option>
                        <option>Renault</option>
                        <option>Peugeot</option>
                        <option>Citroën</option>
                        <option>BMW</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm p-2 text-sm">
                        <option>Tous</option>
                        <option>Questions</option>
                        <option>Guides</option>
                        <option>Actualités</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button size="sm" variant="outline" className="mr-2">Réinitialiser</Button>
                    <Button size="sm" className="bg-blue-600">Appliquer</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Posts */}
        <div className="space-y-6" ref={feedRef}>
          {isInitialLoading ? (
            // Skeleton loader pendant le chargement initial
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <Card className="p-6 bg-white/80 border-0">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-36 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="mb-4">
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
                    <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
                  </div>
                  <div className="border-t border-gray-100 pt-4 flex gap-4">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </Card>
              </div>
            ))
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center bg-white/90 backdrop-blur">
              <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Aucun contenu disponible</h3>
              <p className="text-gray-500 mb-6">Il n'y a pas encore de publications à afficher.</p>
              <Button 
                onClick={() => router.push('/profile')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Créer votre première publication
              </Button>
            </Card>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -5,
                  transition: { 
                    duration: 0.2,
                    type: "tween"
                  }
                }}
              >
                <Card
                  className="p-6 bg-white/90 backdrop-blur border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                  onClick={() => navigateToPost(post.id)}
                >
                  {/* Élément décoratif */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    {/* Photo de profil */}
                    <div
                      className="flex items-center gap-3 group"
                      onClick={(e) => navigateToUserProfile(post.auteur, e)}
                    >
                        <Avatar className="w-12 h-12 border-2 border-gray-200 group-hover:border-blue-400 transition-all">
                        {authorProfiles[post.auteur] ? (
                          <img 
                            src={authorProfiles[post.auteur]} 
                            alt={post.auteur} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                          {post.auteur}
                        </h4>
                      </div>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-1 text-gray-500 ml-4">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {post.date
                          ? formatDistanceToNow(new Date(post.date), {
                              addSuffix: true,
                              locale: fr,
                            })
                          : "Date invalide"}
                      </span>
                    </div>
                  </div>

                  {/* Titre + contenu */}
                  <div className="mb-2">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">{post.titre}</h3>
                    <div
                      className="text-gray-600 line-clamp-3 prose-sm"
                      dangerouslySetInnerHTML={{ __html: post.contenu }}
                    />
                  </div>

                  {/* Indication pour voir plus */}
                  <div className="text-sm text-blue-600 mb-4 hover:underline">
                    Voir l'article complet...
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`${likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                      onClick={(e) => handleLike(post.id, e)}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${likedPosts.has(post.id) ? 'fill-red-500' : ''}`} />
                      <span className="text-sm">{post.nbLikes}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-600 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToPost(post.id);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{post.nbCommentaires || 0}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-600 hover:text-green-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Simulation de partage
                        navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
                        
                        // Notification toast
                        const toast = document.createElement('div');
                        toast.className = 'fixed bottom-4 right-4 bg-green-50 text-green-700 py-2 px-4 rounded-lg shadow-lg';
                        toast.textContent = 'Lien copié !';
                        document.body.appendChild(toast);
                        setTimeout(() => document.body.removeChild(toast), 2000);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      <span className="text-sm">Partager</span>
                    </Button>
                    
                    <Link href={`/post/${post.id}`} legacyBehavior>
                      <a 
                        className="ml-auto text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Lire plus
                      </a>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))
          )}

          {/* Bouton "Charger plus" */}
          {posts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-10"
            >
              <Button
                variant={hasMore ? "default" : "outline"}
                className={`w-full max-w-md py-6 ${
                  hasMore 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                    : 'bg-white text-gray-400'
                }`}
                onClick={handleLoadMore}
                disabled={isLoading || !hasMore}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Chargement des publications...
                  </div>
                ) : hasMore ? (
                  "Voir plus d'articles"
                ) : (
                  "Vous avez tout vu !"
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}