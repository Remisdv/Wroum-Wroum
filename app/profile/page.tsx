"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";

// Extend the Session type to include the `id` property
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Post {
  id: string;
  titre: string;
  contenu: string;
  date: string;
  nbLikes: number;
  nbCommentaires: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Fonction pour récupérer les posts de l'utilisateur connecté
  const fetchUserPosts = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/posts?userId=${session.user.id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des posts");
      }
      const data = await response.json();
      setUserPosts(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des posts :", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPosts();
    }
  }, [session?.user?.id]);

  // Fonction pour créer un nouveau post
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    if (!session?.user) {
      alert("Vous devez être connecté pour créer un post.");
      setIsPosting(false);
      return;
    }

    const postData = {
      titre: postTitle,
      contenu: postContent,
      userId: session.user.id,
    };

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Erreur : " + data.error);
      } else {
        alert("Post créé avec succès !");
        setPostTitle("");
        setPostContent("");
        fetchUserPosts(); // Recharge les posts après la création
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
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Chargement...</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Vous devez être connecté pour accéder à cette page.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* En-tête du profil */}
        <Card className="p-8 mb-8 border-blue-100 bg-white/80 backdrop-blur">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-blue-100" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-blue-900 mb-2">{session.user.name || "Utilisateur"}</h1>
              <p className="text-gray-600 mb-4">Bienvenue sur votre profil !</p>
            </div>
          </div>
        </Card>

        {/* Formulaire de création de post */}
        <Card className="p-6 mb-8 border-blue-100 bg-white/80 backdrop-blur">
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <Input
              placeholder="Titre de votre post"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="text-lg font-semibold"
            />
            <Textarea
              placeholder="Contenu de votre post..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isPosting || !postTitle.trim() || !postContent.trim()}
              >
                {isPosting ? "Publication en cours..." : "Publier"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Liste des posts */}
        <div className="flex flex-col gap-6">
          {isLoadingPosts ? (
            <p className="text-center text-gray-600">Chargement des posts...</p>
          ) : userPosts.length === 0 ? (
            <p className="text-center text-gray-600">Vous n'avez pas encore créé de posts.</p>
          ) : (
            userPosts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}?from=profile`}>
                <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur border-blue-100 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 border-2 border-gray-300" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900">{post.titre}</h3>
                      <p className="text-gray-600">{post.contenu}</p>
                      <div className="flex items-center gap-4 mt-2 text-gray-500">
                        <Heart className="w-4 h-4" />
                        <span>{post.nbLikes}</span>
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.nbCommentaires}</span>
                        <Share2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: fr })}
                    </div>
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