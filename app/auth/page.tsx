// "use client";

// import { useState } from "react";
// import { NavBar } from "@/components/nav-bar";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Label } from "@/components/ui/label";
// import { Mail, Lock, User, ArrowRight } from "lucide-react";

// export default function AuthPage() {
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     // TODO: Implement authentication logic
//     setTimeout(() => setIsLoading(false), 1000);
//   };

//   return (
//     <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
//       <NavBar />
      
//       <div className="container max-w-md mx-auto px-4 py-16">
//         <Card className="p-6 border-blue-100 shadow-xl bg-white/80 backdrop-blur">
//           <Tabs defaultValue="login" className="w-full">
//             <TabsList className="grid w-full grid-cols-2 mb-6">
//               <TabsTrigger value="login">Connexion</TabsTrigger>
//               <TabsTrigger value="register">Inscription</TabsTrigger>
//             </TabsList>

//             <TabsContent value="login">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="email-login">Email</Label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                       id="email-login"
//                       type="email"
//                       placeholder="votre@email.com"
//                       className="pl-10"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="password-login">Mot de passe</Label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                       id="password-login"
//                       type="password"
//                       placeholder="••••••••"
//                       className="pl-10"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <Button 
//                   type="submit" 
//                   className="w-full bg-blue-600 hover:bg-blue-700"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     "Connexion en cours..."
//                   ) : (
//                     <>
//                       Se connecter
//                       <ArrowRight className="ml-2 h-4 w-4" />
//                     </>
//                   )}
//                 </Button>
//               </form>
//             </TabsContent>

//             <TabsContent value="register">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="username">Nom d'utilisateur</Label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                       id="username"
//                       type="text"
//                       placeholder="JohnDoe"
//                       className="pl-10"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="email-register">Email</Label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                       id="email-register"
//                       type="email"
//                       placeholder="votre@email.com"
//                       className="pl-10"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="password-register">Mot de passe</Label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                       id="password-register"
//                       type="password"
//                       placeholder="••••••••"
//                       className="pl-10"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <Button 
//                   type="submit" 
//                   className="w-full bg-blue-600 hover:bg-blue-700"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     "Inscription en cours..."
//                   ) : (
//                     <>
//                       S'inscrire
//                       <ArrowRight className="ml-2 h-4 w-4" />
//                     </>
//                   )}
//                 </Button>
//               </form>
//             </TabsContent>
//           </Tabs>
//         </Card>
//       </div>
//     </main>
//   );
// }

"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ nom: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // 🔹 Connexion avec NextAuth
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

  // 🔹 Inscription (déjà fonctionnelle)
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
        redirect: true,
        callbackUrl: "/",
      });
    }

    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />
      
      <div className="container max-w-md mx-auto px-4 py-16">
        <Card className="p-6 border-blue-100 shadow-xl bg-white/80 backdrop-blur">
          {session ? (
            <div className="text-center">
              <p className="mb-4">Bienvenue, {session.user?.email} !</p>
              <Button onClick={() => signOut()} className="bg-red-500">
                Déconnexion
              </Button>
            </div>
          ) : (
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
          )}
        </Card>
      </div>
    </main>
  );
}

