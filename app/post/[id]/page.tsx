"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { NavBar } from "@/components/nav-bar";
import { 
  Heart, MessageCircle, Share2, Clock, ChevronLeft, 
  User, Eye, BookmarkPlus, Flag, Copy, Send, Smile, 
  AlertTriangle, ThumbsUp, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

declare module "next-auth" {
  interface User {
    id: string;
  }

  interface Session {
    user: User;
  }
}

interface Comment {
  id: string;
  contenu: string;
  date: string;
  user?: {
    name: string;
    id?: string;
  };
}

interface Post {
  id: string;
  titre: string;
  contenu: string;
  date: string;
  nbLikes: number;
  nbCommentaires: number;
  userId?: string;
  user?: {
    name: string;
    id: string;
  };
}

export default function PostPage({ params }: { params: { id: string } }) {
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showReactions, setShowReactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/get?postId=${params.id}`);
        if (!response.ok) throw new Error("Post introuvable");
    
        const data: Post = await response.json();
        setPost(data);
        setLikesCount(data.nbLikes);
    
        // Vérifier si l'utilisateur a liké
        if (session?.user?.id) {
          const likeRes = await fetch(`/api/likes?postId=${params.id}`);
          const likesData = await likeRes.json();
          const userHasLiked = likesData.some((like: any) => like.userId === session.user.id);
          setHasLiked(userHasLiked);
        }

        // Récupérer le nombre de vues
        const viewsRes = await fetch(`/api/vues?postId=${params.id}&count=true`);
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          setViewsCount(viewsData.count || 0);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du post :", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments/get?postId=${params.id}`);
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des commentaires");
        }
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des commentaires :", error);
      }
    };

    const registerView = async () => {
      if (!params.id || !session?.user?.id) {
        console.warn("Impossible d'enregistrer la vue : postId ou userId manquant");
        return;
      }
    
      try {
        const response = await fetch("/api/vues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: params.id,
            userId: session.user.id,
          }),
        });
    
        if (!response.ok) {
          console.error("Erreur lors de l'enregistrement de la vue :", await response.json());
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de la vue :", error);
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      const fetchData = async () => {
        try {
          await fetchPost();
          await fetchComments();
          await registerView();
        } catch (error) {
          console.error("Erreur lors du chargement des données :", error);
        }
      };
    
      fetchData();
    }
  }, [params.id, status, session?.user?.id]);

  const handleCreateComment = async () => {
    if (!newComment.trim()) {
      // Toast d'erreur
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50';
      toast.innerHTML = `
        <AlertTriangle className="w-4 h-4 mr-2" />
        <div>Le commentaire ne peut pas être vide</div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch("/api/comments/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: params.id,
          contenu: newComment,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Toast d'erreur
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50';
        toast.innerHTML = `
          <AlertTriangle className="w-4 h-4 mr-2" />
          <div>${errorData.error || "Erreur lors de la création du commentaire"}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
        return;
      }

      const data = await response.json();
      
      // Ajouter le commentaire avec l'info utilisateur
      const newCommentData = {
        ...data.commentaire,
        user: {
          name: session?.user?.name || "Vous",
        }
      };
      
      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
      
      // Toast de succès
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50';
      toast.innerHTML = `
        <div class="mr-2">✓</div>
        <div>Commentaire publié avec succès</div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
    } catch (error) {
      console.error("Erreur lors de la création du commentaire :", error);
      // Toast d'erreur
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50';
      toast.innerHTML = `
        <AlertTriangle className="w-4 h-4 mr-2" />
        <div>Une erreur s'est produite</div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleLike = async () => {
    if (!session?.user?.id) return;
    
    setIsLikeAnimating(true);

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: params.id,
          userId: session.user.id,
        }),
      });
  
      await response.json();
  
      setHasLiked((prev) => !prev);
      setLikesCount((prev) => (hasLiked ? prev - 1 : prev + 1));
      
      setTimeout(() => {
        setIsLikeAnimating(false);
      }, 500);
    } catch (error) {
      console.error("Erreur lors du like :", error);
      setIsLikeAnimating(false);
    }
  };
  
  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    
    // Toast de succès
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50';
    toast.innerHTML = `
      <div class="mr-2">✓</div>
      <div>Lien copié dans le presse-papier</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
    
    setTimeout(() => {
      setIsCopied(false);
      setShowShareOptions(false);
    }, 1500);
  };
  
  const scrollToComments = () => {
    setShowCommentForm(true);
    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const toggleReaction = (commentId: string) => {
    setShowReactions(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Squelettes de chargement
  if (status === "loading" || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <NavBar />
        <div className="container max-w-3xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-gray-200 rounded mb-8"></div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
              <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-1/4 bg-gray-100 rounded mb-6"></div>
              
              <div className="space-y-3 mb-6">
                <div className="h-4 w-full bg-gray-100 rounded"></div>
                <div className="h-4 w-full bg-gray-100 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
              </div>
              
              <div className="h-10 border-t border-gray-100 pt-4 flex gap-4">
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-full bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <NavBar />
        <div className="container max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="bg-white p-8 rounded-xl shadow-md border border-red-100">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Publication introuvable</h1>
            <p className="text-gray-600 mb-6">Le contenu que vous recherchez n'existe pas ou a été supprimé.</p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/')}
            >
              Retourner à l'accueil
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const isAuthor = post.userId === session?.user?.id;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <div className="container max-w-3xl mx-auto px-4 py-6">
        {/* Bouton de retour */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 group transition-all -ml-2 rounded-lg"
            onClick={() => {
              if (from === "profile") {
                router.push("/profile");
              } else if (from === "publicProfile") {
                const username = searchParams.get("username");
                if (username) {
                  router.push(`/profile/${username}`);
                } else {
                  router.push("/");
                }
              } else {
                router.push("/");
              }
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Retour à {from === "profile" ? "votre profil" : from === "publicProfile" ? "profil" : "l'accueil"}
          </Button>
        </motion.div>

        {/* Carte principale du post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            {/* Barre décorative en haut */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <div className="p-6">
              {/* Auteur et date */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-blue-100">
                    <User className="h-5 w-5 text-gray-400" />
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-800">
                      {post.user?.name || "Utilisateur"}
                      {isAuthor && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Vous</span>}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: fr })}
                      
                      <span className="mx-1">•</span>
                      
                      <Eye className="h-3 w-3" />
                      {viewsCount} vues
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Titre et contenu */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4 leading-tight">{post.titre}</h1>
                
                <div
                  className="prose prose-blue max-w-none mb-6 text-gray-700"
                  dangerouslySetInnerHTML={{ __html: post.contenu }}
                ></div>
              </div>

              {/* Stats et actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className={`h-4 w-4 ${hasLiked ? 'text-red-500 fill-red-500' : ''}`} />
                    {likesCount} j'aime
                  </span>
                  
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {comments.length} commentaires
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  Partager
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex bg-gray-50 border-t border-gray-100">
              <Button
                variant="ghost"
                className={`flex-1 rounded-none flex items-center justify-center py-3 ${
                  hasLiked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                }`}
                onClick={toggleLike}
              >
                <motion.div
                  animate={isLikeAnimating ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Heart className={`h-5 w-5 mr-2 ${hasLiked ? 'fill-red-500' : ''}`} />
                </motion.div>
                J'aime
              </Button>
              
              <div className="w-px h-full bg-gray-200"></div>
              
              <Button
                variant="ghost"
                className="flex-1 rounded-none text-gray-700 hover:text-blue-600 flex items-center justify-center py-3"
                onClick={scrollToComments}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Commenter
              </Button>
              
              <div className="w-px h-full bg-gray-200"></div>
              
              <div className="relative flex-1">
                <Button
                  variant="ghost"
                  className="w-full rounded-none text-gray-700 hover:text-green-600 flex items-center justify-center py-3"
                  onClick={() => setShowShareOptions(!showShareOptions)}
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Partager
                </Button>
                
                <AnimatePresence>
                  {showShareOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48 z-10"
                    >
                      <div className="p-2">
                        <button 
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md"
                          onClick={copyToClipboard}
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                          <span>
                            {isCopied ? "Copié !" : "Copier le lien"}
                          </span>
                        </button>
                        
                        <Link href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.titre)}`} target="_blank">
                          <div className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md">
                            <svg className="h-4 w-4 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                            <span>Twitter</span>
                          </div>
                        </Link>
                        
                        <Link href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank">
                          <div className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md">
                            <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Facebook</span>
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section des commentaires */}
        <div 
          className="mt-8"
          ref={commentSectionRef}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Commentaires ({comments.length})</h2>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowCommentForm(!showCommentForm)}
              >
                {showCommentForm ? "Masquer" : "Ajouter un commentaire"}
              </Button>
            </div>

            <AnimatePresence>
              {showCommentForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <Card className="p-4 mb-6 border-blue-100 bg-white shadow-md">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 border-2 border-blue-100">
                        {session?.user?.image ? (
                          <img src={session.user.image} alt="Avatar" />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-1">
                          <textarea
                            className="w-full p-2 bg-transparent border-none focus:ring-0 focus:outline-none rounded-lg resize-none text-gray-700"
                            placeholder="Partagez votre avis..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                          ></textarea>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                            onClick={handleCreateComment}
                            disabled={isSubmittingComment || !newComment.trim()}
                          >
                            {isSubmittingComment ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                Publication...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Publier
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Liste des commentaires */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun commentaire</h3>
                  <p className="text-gray-500 mb-4">Soyez le premier à partager votre avis sur ce post.</p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={scrollToComments}
                  >
                    Ajouter un commentaire
                  </Button>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Card className="p-4 bg-white hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 border-2 border-gray-200">
                          <User className="h-5 w-5 text-gray-400" />
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-800">
                                {comment.user?.name || "Utilisateur"} 
                                {comment.user?.id === session?.user?.id && (
                                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Vous</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(comment.date), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-gray-700 p-1 h-auto"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="my-2 text-gray-700">{comment.contenu}</div>
                          
                          <div className="flex items-center gap-1 mt-1">
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-blue-600 p-1 h-auto text-xs"
                                onClick={() => toggleReaction(comment.id)}
                              >
                                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                                J'aime
                              </Button>
                              
                              <AnimatePresence>
                                {showReactions[comment.id] && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full left-0 mb-1 bg-white rounded-full shadow-lg border border-gray-200 z-10 flex p-1"
                                  >
                                    {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => (
                                      <button 
                                        key={emoji}
                                        className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                                        onClick={() => {
                                          // Simuler réaction
                                          toggleReaction(comment.id);
                                          
                                          // Toast
                                          const toast = document.createElement('div');
                                          toast.className = 'fixed bottom-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg shadow-lg flex items-center z-50';
                                          toast.innerHTML = `
                                            <div>Vous avez réagi avec ${emoji}</div>
                                          `;
                                          document.body.appendChild(toast);
                                          setTimeout(() => document.body.removeChild(toast), 2000);
                                        }}
                                      >
                                        <div className="text-lg">{emoji}</div>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-blue-600 p-1 h-auto text-xs"
                            >
                              Répondre
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Actions flottantes mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around z-40">
          <Button
            variant="ghost"
            className={`text-gray-700 ${hasLiked ? 'text-red-500' : ''}`}
            onClick={toggleLike}
          >
            <Heart className={`h-5 w-5 ${hasLiked ? 'fill-red-500' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            className="text-gray-700"
            onClick={scrollToComments}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            className="text-gray-700"
            onClick={() => setShowShareOptions(!showShareOptions)}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            className="text-gray-700"
          >
            <BookmarkPlus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </main>
  );
}