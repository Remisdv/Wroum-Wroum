"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Key, Lock, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, check if user is admin
    if (status === "authenticated" && session?.user?.id) {
      fetch(`/api/admin/check?userId=${session.user.id}`)
        .then(res => {
          if (res.ok) {
            router.push("/admin/dashboard");
          } else {
            setError("Accès non autorisé. Vous devez être administrateur.");
          }
        })
        .catch(err => {
          console.error("Erreur lors de la vérification admin:", err);
          setError("Une erreur est survenue lors de la vérification de vos droits d'accès.");
        });
    }
  }, [status, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Identifiants incorrects. Veuillez réessayer.");
        setIsLoading(false);
        return;
      }

      // Check admin role after successful login
      const adminCheckResponse = await fetch(`/api/admin/check?userId=${session?.user?.id || result?.url?.split('=')[1]}`);
      
      if (!adminCheckResponse.ok) {
        setError("Accès refusé. Vous n'avez pas les droits d'administration.");
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push("/admin/dashboard");
      
    } catch (error) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error("Erreur de connexion admin:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-8 shadow-lg border-0">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full">
            <ShieldAlert className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">Administration</h1>
        <p className="text-gray-500 text-center mb-6">Connexion sécurisée</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md mb-4 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email administrateur</Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@example.com" 
                onChange={handleChange} 
                required 
                className="pl-10"
              />
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                onChange={handleChange} 
                required 
                className="pl-10"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Authentification...
              </>
            ) : (
              "Accéder à l'administration"
            )}
          </Button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Accès restreint aux administrateurs autorisés. Toutes les tentatives de connexion sont enregistrées.
          </p>
        </div>
      </Card>
    </div>
  );
}