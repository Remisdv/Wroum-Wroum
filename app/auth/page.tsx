"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Import useRouter
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter(); // Initialize useRouter
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ nom: "", email: "", password: "" });

  // Redirection vers la page de profil si l'utilisateur est connecté
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/profile");
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Connexion avec NextAuth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      alert("Erreur : " + result.error);
    }

    setIsLoading(false);
  };

  // Inscription
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      alert("Erreur : " + data.error);
    } else {
      alert("Inscription réussie ! Connexion en cours...");
      await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
    }

    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />
      
      <div className="container max-w-md mx-auto px-4 py-16">
        <Card className="p-6 border-blue-100 shadow-xl bg-white/80 backdrop-blur">
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="register">Inscription</TabsTrigger>
              <TabsTrigger value="login">Connexion</TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <Label htmlFor="nom">Nom d'utilisateur</Label>
                <Input id="nom" type="text" onChange={handleChange} required />

                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" onChange={handleChange} required />

                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" onChange={handleChange} required />

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Inscription en cours..." : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" onChange={handleChange} required />

                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" onChange={handleChange} required />

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  );
}