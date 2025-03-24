"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { Heart, MessageCircle, Share2, Clock, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns"; // Import de date-fns
import { fr } from "date-fns/locale"; // Import de la locale française

interface Post {
  id: string;
  auteur: string;
  titre: string;
  contenu: string;
  date: string;
  nbLikes: number;
  nbCommentaires?: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Indique s'il reste des posts à charger

  const fetchPosts = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?page=${page}&pageSize=3`); // Limite à 3 posts par page
      const data: Post[] = await response.json();

      if (data.length === 0) {
        setHasMore(false); // Si aucun post n'est retourné, désactiver le bouton
      } else {
        setPosts((prevPosts) => [...prevPosts, ...data]); // Ajouter les nouveaux posts
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des posts :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handleLoadMore = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1); // Charger la page suivante
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              Tendances Automobiles
            </h1>
            <p className="text-gray-600 mt-2">Découvrez les dernières actualités du monde automobile</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Populaire
            </Button>
            <Button variant="outline" className="gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Récent
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Avatar 
              key={i}
              className="w-full h-32 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all bg-gradient-to-r from-gray-200 to-gray-100"
            />
          ))}
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <Link href={`/post/${post.id}`} key={post.id}>
              <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur border-0 hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10 border-2 border-gray-200" />
                      <div>
                        <h4 className="font-medium">{post.auteur}</h4>
                        <p className="text-sm text-gray-500">Passionné automobile</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {post.titre}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {post.contenu}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 ml-4">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
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
          ))}

          <div className="text-center mt-8">
            <Button
              variant="outline"
              className="w-full max-w-sm bg-white hover:bg-gray-50"
              onClick={handleLoadMore}
              disabled={isLoading || !hasMore} // Désactiver si en cours de chargement ou plus de posts
            >
              {isLoading ? "Chargement..." : hasMore ? "Voir plus d'articles" : "Aucun autre article"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}