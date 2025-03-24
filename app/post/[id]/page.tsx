"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { NavBar } from "@/components/nav-bar";
import { Heart, MessageCircle, Share2, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Comment {
  id: string;
  contenu: string;
  date: string;
  user?: {
    name: string;
  };
}

interface Post {
  id: string;
  titre: string;
  contenu: string; // Contenu en HTML
  date: string;
  nbLikes: number;
  nbCommentaires: number;
}

export default function PostPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts?postId=${params.id}`);
        if (!response.ok) {
          throw new Error("Post introuvable");
        }
        const data: Post = await response.json();
        setPost(data);
      } catch (error) {
        console.error("Erreur lors de la récupération du post :", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments?postId=${params.id}`);
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des commentaires");
        }
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des commentaires :", error);
      }
    };

    if (status === "authenticated") {
      fetchPost();
      fetchComments();
    }
  }, [params.id, status]);

  const handleCreateComment = async () => {
    if (!newComment.trim()) {
      alert("Le contenu du commentaire ne peut pas être vide.");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
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
        alert(errorData.error || "Erreur lors de la création du commentaire.");
        return;
      }

      const data = await response.json();
      setComments((prev) => [...prev, data.commentaire]);
      setNewComment("");
    } catch (error) {
      console.error("Erreur lors de la création du commentaire :", error);
      alert("Une erreur s'est produite.");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <p className="text-xl font-semibold text-gray-800">Chargement...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <p className="text-xl font-semibold text-red-600">Post introuvable</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <NavBar />
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-blue-600 -ml-2"
            onClick={() => {
              if (from === "profile") {
                router.push("/profile");
              } else {
                router.push("/");
              }
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </div>

        <Card className="p-6 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">{post.titre}</h1>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: fr })}
              </span>
            </div>
          </div>

          {/* Afficher le contenu HTML */}
          <div
            className="prose max-w-none mb-6 text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.contenu }}
          ></div>

          <div className="flex gap-4 border-t pt-4 border-gray-200">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
              <Heart className="h-4 w-4 mr-1" />
              J'aime ({post.nbLikes})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600"
              onClick={() => setShowCommentForm((prev) => !prev)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Commenter ({comments.length})
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
          </div>
        </Card>

        {showCommentForm && (
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow mt-6">
            <Avatar className="w-8 h-8 border-2 border-gray-300" />
            <div className="flex-1">
              <textarea
                className="w-full p-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Écrire votre commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
              <div className="flex justify-end mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600"
                  onClick={handleCreateComment}
                >
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-600 text-center">Aucun commentaire pour le moment.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow"
              >
                <Avatar className="w-8 h-8 border-2 border-gray-300" />
                <div>
                  <div className="font-medium text-gray-800">{comment.user?.name || "Utilisateur inconnu"}</div>
                  <p className="text-sm text-gray-600">{comment.contenu}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(comment.date), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}