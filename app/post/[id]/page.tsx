"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Import du hook useSession
import { NavBar } from "@/components/nav-bar";
import { Heart, MessageCircle, Share2, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Comment {
  id: string;
  auteur: string;
  contenu: string;
  date: string;
}

interface Post {
  id: string;
  auteur: string;
  titre: string;
  contenu: string;
  date: string;
  nbLikes: number;
  nbCommentaires: number;
  commentaires?: Comment[];
}

export default function PostPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession(); // Récupère la session utilisateur
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    // Redirige vers la page d'authentification si l'utilisateur n'est pas connecté
    if (status === "unauthenticated") {
      router.push("/auth"); // Redirige vers /auth
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

    if (status === "authenticated") {
      fetchPost();
    }
  }, [params.id, status]);

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

  const commentsToDisplay = post.commentaires && post.commentaires.length > 0 ? post.commentaires : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <NavBar />
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600 -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
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

          <div className="prose max-w-none mb-6 text-gray-700">
            <p>{post.contenu}</p>
          </div>

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
              Commenter ({post.nbCommentaires})
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
              ></textarea>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {commentsToDisplay.map((comment) => (
            <div
              key={comment.id}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow"
            >
              <Avatar className="w-8 h-8 border-2 border-gray-300" />
              <div>
                <div className="font-medium text-gray-800">{comment.auteur}</div>
                <p className="text-sm text-gray-600">{comment.contenu}</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {formatDistanceToNow(new Date(comment.date), { addSuffix: true, locale: fr })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}