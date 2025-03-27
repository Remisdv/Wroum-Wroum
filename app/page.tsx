"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Heart, MessageCircle, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?page=${page}&pageSize=3`);
      const data: Post[] = await response.json();

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...data]);
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
      setPage((prevPage) => prevPage + 1);
    }
  };

  const navigateToUserProfile = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const navigateToPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="p-6 bg-white/80 backdrop-blur border-0 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => navigateToPost(post.id)} // Toute la carte est cliquable
            >
              <div className="flex justify-between items-start mb-4">
                {/* Photo de profil */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation(); // Empêche la propagation vers la carte
                    navigateToUserProfile(post.auteur);
                  }}
                >
                  <Avatar className="w-10 h-10 border-2 border-gray-200 hover:border-blue-400 transition-all" />
                  <div>
                    {/* Pseudo souligné au survol */}
                    <h4
                      className="font-medium text-gray-800 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation(); // Empêche la propagation vers la carte
                        navigateToUserProfile(post.auteur);
                      }}
                    >
                      {post.auteur}
                    </h4>
                    <p className="text-sm text-gray-500">Passionné automobile</p>
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
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{post.titre}</h3>
                <div
                  className="text-gray-600 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: post.contenu }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100 mt-4">
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
          ))}

          <div className="text-center mt-8">
            <Button
              variant="outline"
              className="w-full max-w-sm bg-white hover:bg-gray-50"
              onClick={handleLoadMore}
              disabled={isLoading || !hasMore}
            >
              {isLoading ? "Chargement..." : hasMore ? "Voir plus d'articles" : "Aucun autre article"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}