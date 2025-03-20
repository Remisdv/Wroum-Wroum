"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, PenSquare } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

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
      userId: session.user.id, // Assurez-vous que `id` est défini dans votre session
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
        router.push("/profile"); // Recharge la page de profil
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

        {/* Création de post */}
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
                {isPosting ? (
                  "Publication en cours..."
                ) : (
                  <>
                    <PenSquare className="w-4 h-4 mr-2" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Liste des posts */}
        <div className="space-y-6">
          {[1, 2, 3].map((post) => (
            <Card key={post} className="p-6 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur border-blue-100">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 text-blue-900">
                  La BMW M3 CS : Une Symphonie de Puissance
                </h3>
                <p className="text-gray-600 line-clamp-3">
                  La BMW M3 CS est bien plus qu'une simple voiture : c'est une déclaration d'amour à la performance automobile. Depuis sa création, la M3 a toujours été synonyme de dynamisme...
                </p>
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  <Heart className="w-4 h-4 mr-1" />
                  <span className="text-sm">24</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">12</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  <Share2 className="w-4 h-4 mr-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}