"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ titre: "", contenu: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const postData = {
      ...formData,
      userId: session?.user?.id, // Ajoutez le userId ici
    };

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
      router.push("/"); // Redirige vers l'accueil après la création
    }

    setIsLoading(false);
  };

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Vous devez être connecté pour créer un post.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />
      
      <div className="container max-w-md mx-auto px-4 py-16">
        <Card className="p-6 border-blue-100 shadow-xl bg-white/80 backdrop-blur">
          <h2 className="text-xl font-semibold text-center mb-4">Créer un nouveau post</h2>
          
          {session && (
            <p className="text-center mb-4">User ID: {session.user?.id}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" type="text" onChange={handleChange} required />

            <Label htmlFor="contenu">Contenu</Label>
            <Textarea id="contenu" onChange={handleChange} required />

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Publication en cours..." : "Publier"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}