"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { 
  Heart, MessageCircle, Share2, Edit, BarChart2, 
  Plus, Calendar, User, Users, Award, ChevronDown, 
  Image, Smile, PenTool, X
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface Post {
  id: string;
  titre: string;
  contenu: string;
  date: string;
  nbLikes: number;
  nbCommentaires: number;
}

interface ProfileStats {
  posts: number;
  abonnements: number;
  abonnes: number;
  totalLikes: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [expandedEditor, setExpandedEditor] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    posts: 0,
    abonnements: 0,
    abonnes: 0,
    totalLikes: 0,
  });
  const [bio, setBio] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'stats'>('posts');

  // Scroll jusqu'à l'éditeur quand il est affiché
  useEffect(() => {
    if (showCreatePost && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showCreatePost]);

  const fetchUserPosts = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/posts/get?creatorId=${session.user.id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des posts");
      }
      const data = await response.json();
      setUserPosts(data);

      const totalLikes = data.reduce((sum: number, post: Post) => sum + post.nbLikes, 0);

      setProfileStats((prev) => ({
        ...prev,
        posts: data.length,
        totalLikes,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des posts :", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchProfileStats = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/profil?userId=${session.user.id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques du profil");
      }
      const data = await response.json();

    // Mettre à jour la session avec l'image de profil si elle existe
    if (data.photoProfile && !session.user.image) {
      console.log("Mise à jour de la photo de profil avec:", data.photoProfile);
      setProfilePicture(data.photoProfile);
    }

    setProfileStats((prev) => ({
      ...prev,
      abonnements: data.abonnements?.length || 0,
      abonnes: data.abonnes?.length || 0,
    }));

    setBio(data.bio || "Passionné d'automobile et de mécanique.");
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error);
  }
};

// Ajoutez cet état pour stocker l'URL de la photo de profil
const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPosts();
      fetchProfileStats();
    }
  }, [session?.user?.id]);

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    if (!session?.user) {
      alert("Vous devez être connecté pour créer un post.");
      setIsPosting(false);
      return;
    }

    const sanitizedContent = DOMPurify.sanitize(postContent);

    const postData = {
      titre: postTitle,
      contenu: sanitizedContent,
      userId: session.user.id,
    };

    try {
      const response = await fetch("/api/posts/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Erreur : " + data.error);
      } else {
        // Toast de succès au lieu d'une alerte
        setPostTitle("");
        setPostContent("");
        setShowCreatePost(false);
        fetchUserPosts();
        
        // Afficher notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center';
        notification.innerHTML = `
          <div class="mr-2">✓</div>
          <div>Post publié avec succès!</div>
        `;
        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error("Erreur lors de la création du post :", error);
      alert("Une erreur s'est produite.");
    } finally {
      setIsPosting(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-blue-800">Chargement du profil...</p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès restreint</h2>
          <p className="text-gray-700 mb-6">Vous devez être connecté pour accéder à votre profil.</p>
          <Button onClick={() => router.push("/login")} className="w-full bg-blue-600 hover:bg-blue-700">
            Se connecter
          </Button>
        </Card>
      </main>
    );
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ],
  };
  console.log("Photo de profil:", session.user.image);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Carte de profil - Design amélioré */}
        <div className="relative mb-8">
          {/* Bannière de couverture */}
          <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-xl overflow-hidden">
            {/* Image de couverture optionnelle */}
            <div className="absolute bottom-4 right-4">
              <Button variant="ghost" className="text-white bg-black/30 hover:bg-black/50" size="sm">
                <Edit className="w-4 h-4 mr-1" />
                Modifier la couverture
              </Button>
            </div>
          </div>
          
          {/* Carte d'informations personnelles */}
          <Card className="p-0 mx-4 -mt-16 z-10 relative shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Avatar et infos de base */}
              <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-white shadow-md">
                {(profilePicture || session.user.image) ? (
                  <img 
                    src={profilePicture || session.user.image || undefined} 
                    alt={session.user.name || "Utilisateur"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Edit className="w-6 h-6 text-white" />
              </div>
            </div>
                
                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{session.user.name || "Utilisateur"}</h1>
                  <p className="text-gray-600 mb-4 max-w-md">{bio || "Aucune bio définie"}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => router.push("/profile/edit-profile")}
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => router.push("/profile/stats")}
                      size="sm"
                    >
                      <BarChart2 className="w-4 h-4 mr-1" />
                      Statistiques
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Statistiques */}
              <div className="md:ml-auto md:border-l border-gray-100 p-6 flex flex-row md:flex-col justify-center">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-x-8 gap-y-4">
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <PenTool className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">{profileStats.posts}</div>
                      <div className="text-xs text-gray-500">Publications</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Heart className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">{profileStats.totalLikes}</div>
                      <div className="text-xs text-gray-500">J'aime reçus</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">{profileStats.abonnes}</div>
                      <div className="text-xs text-gray-500">Abonnés</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">{profileStats.abonnements}</div>
                      <div className="text-xs text-gray-500">Abonnements</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Bouton de création de post flottant (mobile) */}
        <div className="md:hidden fixed bottom-6 right-6 z-30">
          <Button 
            className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
            onClick={() => setShowCreatePost(!showCreatePost)}
          >
            {showCreatePost ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </Button>
        </div>
        
        {/* Contenu principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne de gauche (éditeur et actions) */}
          <div className="md:col-span-1 space-y-6">
            {/* Bouton nouveau post (desktop) */}
            <div className="hidden md:block">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 py-6 group transition-all"
                onClick={() => setShowCreatePost(!showCreatePost)}
              >
                <div className="flex items-center">
                  {showCreatePost ? (
                    <>
                      <X className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                      Fermer l'éditeur
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                      Créer un nouveau post
                    </>
                  )}
                </div>
              </Button>
            </div>
            
            {/* Menu de navigation (desktop) */}
            <Card className="hidden md:block overflow-hidden">
              <div className="divide-y divide-gray-100">
                <button 
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center w-full p-4 text-left hover:bg-blue-50 transition-colors ${activeTab === 'posts' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
                  <PenTool className="w-5 h-5 mr-3" />
                  Mes publications
                </button>
                <button 
                  onClick={() => router.push('/profile/stats')}
                  className="flex items-center w-full p-4 text-left hover:bg-blue-50 transition-colors"
                >
                  <BarChart2 className="w-5 h-5 mr-3" />
                  Statistiques avancées
                </button>
                <button 
                  onClick={() => router.push('/profile/edit-profile')}
                  className="flex items-center w-full p-4 text-left hover:bg-blue-50 transition-colors"
                >
                  <Edit className="w-5 h-5 mr-3" />
                  Modifier mon profil
                </button>
              </div>
            </Card>
          </div>
          
          {/* Colonne de droite (publications) */}
          <div className="md:col-span-2">
            {/* Éditeur de post */}
            <AnimatePresence>
              {showCreatePost && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                  ref={editorRef}
                >
                  <Card className="p-6 border-blue-100 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-gray-800">Créer une publication</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowCreatePost(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <form onSubmit={handleSubmitPost} className="space-y-4">
                      <Input
                        placeholder="Titre de votre publication"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        className="text-lg font-medium bg-white/70"
                      />
                      
                      <div className={`relative transition-all ${expandedEditor ? 'h-96' : 'h-64'}`}>
                        <ReactQuill
                          value={postContent}
                          onChange={setPostContent}
                          modules={quillModules}
                          className="h-full bg-white rounded-md"
                        />
                        
                        <button 
                          type="button"
                          onClick={() => setExpandedEditor(!expandedEditor)}
                          className="absolute bottom-14 right-3 text-gray-500 hover:text-gray-700 bg-white/80 backdrop-blur p-1 rounded-md"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedEditor ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button type="button" variant="ghost" size="sm" className="text-gray-500">
                            <Image className="w-4 h-4 mr-1" />
                            Photo
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="text-gray-500">
                            <Smile className="w-4 h-4 mr-1" />
                            Emoji
                          </Button>
                        </div>
                        
                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 transition-colors"
                          disabled={isPosting || !postTitle.trim() || !postContent.trim()}
                        >
                          {isPosting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Publication...
                            </>
                          ) : (
                            "Publier"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Liste des posts */}
            <div className="space-y-4">
              {isLoadingPosts ? (
                <Card className="p-10 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Chargement de vos publications...</p>
                  </div>
                </Card>
              ) : userPosts.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-2 border-gray-200 bg-gray-50">
                  <div className="flex flex-col items-center justify-center">
                    <PenTool className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Aucune publication</h3>
                    <p className="text-gray-500 mb-6">Vous n'avez pas encore partagé de contenu.</p>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowCreatePost(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer votre première publication
                    </Button>
                  </div>
                </Card>
              ) : (
                userPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                  <Link href={`/post/${post.id}?from=profile`}>
                    <Card className="hover:shadow-md transition-all duration-300 overflow-hidden group border-blue-100 cursor-pointer">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12 border-2 border-blue-100">
                            {(profilePicture || session.user.image) ? (
                              <img 
                                src={profilePicture || session.user.image || undefined} 
                                alt={session.user.name || "Utilisateur"} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-gray-400" />
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                              {post.titre}
                            </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                <User className="w-3 h-3" />
                                <span>{session.user.name}</span>
                                <span>•</span>
                                <Calendar className="w-3 h-3" />
                                <span>{formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: fr })}</span>
                              </div>
                              
                              <div
                                className="text-gray-600 prose max-w-none line-clamp-2 text-sm mb-3"
                                dangerouslySetInnerHTML={{ __html: post.contenu }}
                              ></div>
                              
                              <div className="flex items-center gap-4 text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Heart className={`w-4 h-4 ${post.nbLikes > 0 ? 'text-red-500' : ''}`} />
                                  <span>{post.nbLikes}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{post.nbCommentaires}</span>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-auto">
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700">
                                    <Share2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}