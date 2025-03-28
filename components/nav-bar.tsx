"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Menu, Search, User, Bell, Home, Settings, 
  LogOut, ChevronDown, Car, X, Award, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authenticated";
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  // Fermer les menus si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simuler des notifications
  useEffect(() => {
    if (isAuthenticated) {
      // Simuler une notification qui arrive après 5 secondes
      const timer = setTimeout(() => {
        setHasNotifications(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Recherche
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch(`/api/navbarre?query=${searchQuery}`);
        if (!response.ok) throw new Error("Erreur lors de la recherche");
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Erreur lors de la recherche :", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleResultClick = (result: any) => {
    if (result.type === "post") {
      router.push(`/post/${result.id}`);
    } else if (result.type === "user") {
      router.push(`/profile/${result.nom || result.id}`);
    }
    
    setSearchQuery("");
    setResults([]);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setShowUserMenu(false);
    router.push("/");
  };

  const menuItems = [
    { name: "Accueil", icon: <Home className="w-5 h-5" />, path: "/" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Fond avec effet de flou */}
      <div className="absolute inset-0 bg-white/85 backdrop-blur-md border-b border-gray-200"></div>
      
      {/* Contenu de la navbar */}
      <div className="relative container max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Bouton menu mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-gray-700 hover:bg-gray-100"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? (
              <X className="h-5 w-5 text-gray-800" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-1 md:flex-none">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md p-1.5">
              <Car className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent hidden sm:block">
              WROUM WROUM
            </h1>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {menuItems.map((item) => (
              <Link href={item.path} key={item.name}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`flex items-center gap-1.5 ${
                    pathname === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Recherche - desktop */}
          <div 
            className="hidden md:flex flex-1 max-w-md relative"
            ref={searchRef}
          >
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Rechercher un sujet ou @utilisateur..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Résultats de recherche */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-1 z-50 overflow-hidden"
                >
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <p className="text-gray-500">Recherche en cours...</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {results.map((result, index) => (
                        <motion.div
                          key={result.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleResultClick(result)}
                        >
                          {result.type === "post" ? (
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 line-clamp-1">{result.titre}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Par {result.user?.nom || "Utilisateur inconnu"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 bg-indigo-100 text-indigo-700">
                                <User className="h-4 w-4" />
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-800">@{result.nom}</p>
                                <p className="text-xs text-gray-500">Profil utilisateur</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-1">
            {/* Recherche mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-gray-600 hover:bg-gray-100"
              onClick={() => router.push('/search')}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:bg-gray-100 relative"
                onClick={() => {
                  setHasNotifications(false);
                  // Ici vous pourriez ouvrir un menu de notifications
                }}
              >
                <Bell className="h-5 w-5" />
                {hasNotifications && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full"
                  />
                )}
              </Button>
            </div>
            
            {/* Profil utilisateur */}
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-gray-700 hover:bg-gray-100 flex items-center gap-2 ${showUserMenu ? 'bg-gray-100' : ''}`}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 border border-gray-200">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt={session.user.name || "Avatar"} />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </Avatar>
                    <span className="hidden sm:inline font-medium">{session?.user?.name?.split(' ')[0] || "Utilisateur"}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </Button>
                
                {/* Menu utilisateur */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-50 w-48"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="font-medium text-gray-800">{session?.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/profile" onClick={() => setShowUserMenu(false)}>
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                            <User className="h-4 w-4" />
                            Mon profil
                          </button>
                        </Link>
                        <Link href="/profile/stats" onClick={() => setShowUserMenu(false)}>
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                            <Award className="h-4 w-4" />
                            Statistiques
                          </button>
                        </Link>
                        <Link href="/settings" onClick={() => setShowUserMenu(false)}>
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                            <Settings className="h-4 w-4" />
                            Paramètres
                          </button>
                        </Link>
                      </div>
                      <div className="py-1 border-t border-gray-100">
                        <button 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  size="sm"
                >
                  Connexion
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-white border-b border-gray-200"
          >
            <div className="px-4 py-3">
              <Input
                placeholder="Rechercher..."
                className="bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {results.length > 0 && (
                <div className="mt-3 bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={result.id || index}
                      className="p-3 hover:bg-gray-100 border-b border-gray-100 last:border-none"
                      onClick={() => handleResultClick(result)}
                    >
                      <p className="font-medium text-gray-800">{result.titre || result.nom}</p>
                      <p className="text-xs text-gray-500">
                        {result.type === "post" ? "Article" : "Profil"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <nav className="px-4 pb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                Navigation
              </div>
              {menuItems.map((item) => (
                <Link href={item.path} key={item.name}>
                  <div className={`flex items-center gap-2 px-2 py-2.5 rounded-lg mb-1
                    ${pathname === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
              
              {isAuthenticated && (
                <>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-2">
                    Mon compte
                  </div>
                  <Link href="/profile">
                    <div className="flex items-center gap-2 px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg mb-1">
                      <User className="w-5 h-5" />
                      <span>Mon profil</span>
                    </div>
                  </Link>
                  <Link href="/profile/stats">
                    <div className="flex items-center gap-2 px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg mb-1">
                      <Award className="w-5 h-5" />
                      <span>Statistiques</span>
                    </div>
                  </Link>
                  <Link href="/settings">
                    <div className="flex items-center gap-2 px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg mb-1">
                      <Settings className="w-5 h-5" />
                      <span>Paramètres</span>
                    </div>
                  </Link>
                  <button 
                    className="flex items-center gap-2 px-2 py-2.5 text-red-600 hover:bg-red-50 rounded-lg w-full text-left mt-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}