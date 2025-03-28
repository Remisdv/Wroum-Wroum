"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Trash2, Flag, FileText, User,
  Bell, RefreshCw, Filter, Eye, ChevronLeft,
  ChevronRight, Search, ShieldAlert, LogOut
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Interfaces pour les types de données
interface Signalement {
  id: string;
  date: string;
  motif?: string;
  contenu: string;
  userId: string;
  status: "en_attente" | "traité" | "ignoré";
}

interface SignalementGroup {
  contentId: string;
  type: "post" | "commentaire";
  postId?: string;
  commentId?: number;
  postData?: {
    id: string;
    titre: string;
    contenu: string;
    date: string;
  };
  commentaireData?: {
    id: number;
    contenu: string;
    date: string;
    postTitre: string;
    postId: string;
  };
  auteurId: string;
  auteurNom: string;
  signalements: Signalement[];
  count: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [signalementGroups, setSignalementGroups] = useState<SignalementGroup[]>([]);
  const [activeTab, setActiveTab] = useState<"tous" | "posts" | "commentaires">("tous");
  const [selectedStatus, setSelectedStatus] = useState<string>("tous");
  const [selectedGroup, setSelectedGroup] = useState<SignalementGroup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [totalSignalements, setTotalSignalements] = useState({ posts: 0, commentaires: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Vérification si l'utilisateur est admin
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      checkAdminStatus();
    } else if (status === "unauthenticated") {
      router.push("/admin-secret");
    }
  }, [status, session, router]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`/api/admin/check?userId=${session?.user?.id}`);
      if (!response.ok) {
        router.push("/admin-secret");
      } else {
        fetchSignalements();
      }
    } catch (error) {
      console.error("Erreur lors de la vérification admin:", error);
      router.push("/admin-secret");
    }
  };

  const fetchSignalements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/signalements");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des signalements");
      }
      
      const data = await response.json();
      setSignalementGroups(data);
      
      // Calculer les totaux
      const postsCount = data.filter((g: SignalementGroup) => g.type === "post").length;
      const commentsCount = data.filter((g: SignalementGroup) => g.type === "commentaire").length;
      
      setTotalSignalements({
        posts: postsCount,
        commentaires: commentsCount
      });
      
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedGroup) return;
    
    // Utiliser le premier signalement pour avoir un ID
    const signalementId = selectedGroup.signalements[0]?.id;
    if (!signalementId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/admin/delete-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalementId: signalementId,
          contentType: selectedGroup.type,
          contentId: selectedGroup.type === "post" 
            ? selectedGroup.postId 
            : selectedGroup.commentId,
          userId: selectedGroup.auteurId
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      await fetchSignalements();
      showNotification("success", "Contenu supprimé avec succès");
      setDeleteConfirmOpen(false);
      setSelectedGroup(null);
      
    } catch (error) {
      console.error("Erreur de suppression:", error);
      showNotification("error", "Erreur lors de la suppression du contenu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWarning = async () => {
    if (!selectedGroup || !warningMessage.trim()) return;
    
    // Utiliser le premier signalement pour avoir un ID
    const signalementId = selectedGroup.signalements[0]?.id;
    if (!signalementId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/admin/avertissement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedGroup.auteurId,
          message: warningMessage,
          signalementId: signalementId
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'avertissement");
      }

      setIsDialogOpen(false);
      setWarningMessage("");
      await fetchSignalements();
      showNotification("success", "Avertissement envoyé à l'utilisateur");
      
    } catch (error) {
      console.error("Erreur d'envoi d'avertissement:", error);
      showNotification("error", "Erreur lors de l'envoi de l'avertissement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    const notif = document.createElement("div");
    notif.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
      type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
    }`;
    
    notif.innerHTML = `
      <span class="mr-2">${type === "success" ? "✓" : "✕"}</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
      notif.style.opacity = "0";
      notif.style.transition = "opacity 0.5s";
      setTimeout(() => {
        document.body.removeChild(notif);
      }, 500);
    }, 3000);
  };

  // Filtrer les signalements
  const filteredSignalementGroups = signalementGroups
    .filter(group => {
      // Filtre par type
      if (activeTab === "posts" && group.type !== "post") return false;
      if (activeTab === "commentaires" && group.type !== "commentaire") return false;
      
      // Filtre par statut
      if (selectedStatus !== "tous") {
        const hasStatus = group.signalements.some(s => s.status === selectedStatus);
        if (!hasStatus) return false;
      }
      
      // Filtre par recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        // Recherche dans le post
        if (group.type === "post" && group.postData) {
          return (
            group.postData.titre?.toLowerCase().includes(searchLower) ||
            stripHtml(group.postData.contenu).toLowerCase().includes(searchLower) ||
            group.auteurNom?.toLowerCase().includes(searchLower)
          );
        } 
        // Recherche dans le commentaire
        else if (group.type === "commentaire" && group.commentaireData) {
          return (
            group.commentaireData.contenu?.toLowerCase().includes(searchLower) ||
            group.auteurNom?.toLowerCase().includes(searchLower)
          );
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      // Trier par date du dernier signalement
      const dateA = new Date(a.signalements[0]?.date || 0).getTime();
      const dateB = new Date(b.signalements[0]?.date || 0).getTime();
      return dateB - dateA;
    });

  // Pagination
  const totalPages = Math.ceil(filteredSignalementGroups.length / itemsPerPage);
  const currentPageItems = filteredSignalementGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fonction utilitaire pour nettoyer le HTML
  const stripHtml = (html: string): string => {
    if (typeof window !== "undefined") {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || "";
    }
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <ShieldAlert className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Panel d'administration</h1>
              <p className="text-sm text-gray-500">
                Connecté en tant que {session?.user?.name || "Administrateur"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-600"
              onClick={() => router.push("/")}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour au site
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-blue-100">
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-full mr-4">
                <Flag className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total des signalements</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {signalementGroups.reduce((acc, group) => acc + group.count, 0)}
                </h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-orange-100">
            <div className="flex items-center">
              <div className="bg-orange-50 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Posts signalés</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalSignalements.posts}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-purple-100">
            <div className="flex items-center">
              <div className="bg-purple-50 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Commentaires signalés</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalSignalements.commentaires}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Gestion des signalements
              </h2>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Rechercher..." 
                    className="pl-10 w-full md:w-64" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-blue-600 border-blue-200"
                  onClick={fetchSignalements}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="tous" value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
            <div className="px-6 pt-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <TabsList className="mb-0">
                  <TabsTrigger value="tous" className="data-[state=active]:bg-gray-100">
                    Tous les signalements
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="data-[state=active]:bg-gray-100">
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="commentaires" className="data-[state=active]:bg-gray-100">
                    Commentaires
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les statuts</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="traité">Traités</SelectItem>
                      <SelectItem value="ignoré">Ignorés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <TabsContent value="tous" className="m-0">
              <SignalementsGroupTable 
                groups={currentPageItems}
                isLoading={isLoading}
                onView={(group) => {
                  setSelectedGroup(group);
                  setIsDialogOpen(true);
                }}
                onDelete={(group) => {
                  setSelectedGroup(group);
                  setDeleteConfirmOpen(true);
                }}
                onWarn={(group) => {
                  setSelectedGroup(group);
                  setIsDialogOpen(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="posts" className="m-0">
              <SignalementsGroupTable 
                groups={currentPageItems}
                isLoading={isLoading}
                onView={(group) => {
                  setSelectedGroup(group);
                  setIsDialogOpen(true);
                }}
                onDelete={(group) => {
                  setSelectedGroup(group);
                  setDeleteConfirmOpen(true);
                }}
                onWarn={(group) => {
                  setSelectedGroup(group);
                  setIsDialogOpen(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="commentaires" className="m-0">
              <SignalementsGroupTable 
                groups={currentPageItems}
                isLoading={isLoading}
                onView={(group) => {
                  setSelectedGroup(group);
                  setIsDialogOpen(true);
                }}
                onDelete={(group) => {
                  setSelectedGroup(group);
                  setDeleteConfirmOpen(true);
                }}
                onWarn={(group) => {
                  setSelectedGroup(group);
                  setIsDialogOpen(true);
                }}
              />
            </TabsContent>
            
            {/* Pagination */}
            {filteredSignalementGroups.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSignalementGroups.length)} à {Math.min(currentPage * itemsPerPage, filteredSignalementGroups.length)} sur {filteredSignalementGroups.length} signalements
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm font-medium">
                    Page {currentPage} sur {totalPages || 1}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        </Card>
      </div>

      {/* Dialog pour avertissement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedGroup?.type === "post" ? "Post signalé" : "Commentaire signalé"}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.count} signalement(s) pour ce contenu
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {/* Affichage détaillé du contenu signalé */}
            <div className="bg-gray-50 p-4 rounded-md">
              {selectedGroup?.type === "post" && selectedGroup?.postData ? (
                <>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedGroup.postData.titre}</h4>
                  <div className="prose prose-sm max-w-none text-gray-700 mb-4 max-h-[200px] overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedGroup.postData.contenu }} />
                  </div>
                </>
              ) : selectedGroup?.type === "commentaire" && selectedGroup?.commentaireData ? (
                <>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Commentaire sur : {selectedGroup.commentaireData.postTitre}
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-700 mb-4 p-3 bg-white rounded border border-gray-200">
                    {selectedGroup.commentaireData.contenu}
                  </div>
                </>
              ) : (
                <p className="text-gray-600">Contenu non disponible</p>
              )}
              
              <div className="flex justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>{selectedGroup?.auteurNom}</span>
                </div>
                <div>
                  {selectedGroup?.type === "post" && selectedGroup?.postData ? (
                    formatDistanceToNow(new Date(selectedGroup.postData.date), { addSuffix: true, locale: fr })
                  ) : selectedGroup?.type === "commentaire" && selectedGroup?.commentaireData ? (
                    formatDistanceToNow(new Date(selectedGroup.commentaireData.date), { addSuffix: true, locale: fr })
                  ) : (
                    "Date inconnue"
                  )}
                </div>
              </div>
            </div>
            
            {/* Liste des signalements */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Signalements ({selectedGroup?.count || 0})</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedGroup?.signalements.map((signalement, index) => (
                  <div key={signalement.id} className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Motif: {signalement.motif || "Non spécifié"}
                      </span>
                      <Badge variant="outline" className="border-gray-200 text-gray-600">
                        {signalement.status === "en_attente" ? "En attente" : 
                         signalement.status === "traité" ? "Traité" : "Ignoré"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{signalement.contenu}</p>
                    <div className="text-xs text-gray-500">
                      Signalé {formatDistanceToNow(new Date(signalement.date), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="warning-message" className="block text-sm font-medium text-gray-700 mb-1">
                Message d'avertissement
              </label>
              <Textarea
                id="warning-message"
                rows={4}
                placeholder="Entrez votre message d'avertissement ici..."
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSendWarning}
              disabled={isSubmitting || !warningMessage.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-1" />
                  Envoyer l'avertissement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de supprimer définitivement ce contenu. Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 p-4 bg-red-50 border border-red-100 rounded-md">
            {selectedGroup?.type === "post" && selectedGroup?.postData ? (
              <>
                <h4 className="font-medium text-gray-800 mb-2">
                  Post de {selectedGroup.auteurNom}
                </h4>
                <p className="text-sm font-medium text-gray-700">{selectedGroup.postData.titre}</p>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {stripHtml(selectedGroup.postData.contenu)}
                </p>
              </>
            ) : selectedGroup?.type === "commentaire" && selectedGroup?.commentaireData ? (
              <>
                <h4 className="font-medium text-gray-800 mb-2">
                  Commentaire de {selectedGroup.auteurNom}
                </h4>
                <p className="text-sm font-medium text-gray-700">Sur: {selectedGroup.commentaireData.postTitre}</p>
                <p className="text-sm text-gray-600 line-clamp-3">{selectedGroup.commentaireData.contenu}</p>
              </>
            ) : (
              <p className="text-gray-600">Contenu non disponible</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              className="border-gray-200"
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteContent}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Confirmer la suppression
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant de tableau des signalements groupés
function SignalementsGroupTable({ 
  groups, 
  isLoading, 
  onView, 
  onDelete, 
  onWarn 
}: { 
  groups: SignalementGroup[];
  isLoading: boolean;
  onView: (group: SignalementGroup) => void;
  onDelete: (group: SignalementGroup) => void;
  onWarn: (group: SignalementGroup) => void;
}) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-[250px] bg-gray-200 animate-pulse"></div>
                <div className="h-4 w-[200px] bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-blue-50 p-3 rounded-full mb-4">
          <Flag className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun signalement à traiter</h3>
        <p className="text-gray-500 max-w-md">
          Il n'y a actuellement aucun signalement correspondant à vos critères de recherche.
        </p>
      </div>
    );
  }

  // Fonction pour extraire du texte de HTML
  const stripHtml = (html: string) => {
    if (typeof window !== "undefined") {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || "";
    }
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contenu</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signalements</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernier signalement</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {groups.map((group) => (
            <tr key={group.contentId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={group.type === "post" ? "outline" : "secondary"} className={
                  group.type === "post" 
                    ? "border-orange-200 text-orange-700 bg-orange-50" 
                    : "border-purple-200 text-purple-700 bg-purple-50"
                }>
                  {group.type === "post" ? "Post" : "Commentaire"}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  {group.type === "post" && group.postData ? (
                    <>
                      <p className="font-medium text-gray-800 line-clamp-1">{group.postData.titre}</p>
                      <p className="text-gray-600 text-sm line-clamp-1">
                        {stripHtml(group.postData.contenu)}
                      </p>
                    </>
                  ) : group.type === "commentaire" && group.commentaireData ? (
                    <>
                      <p className="font-medium text-gray-800 line-clamp-1">
                        Re: {group.commentaireData.postTitre}
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-1">{group.commentaireData.contenu}</p>
                    </>
                  ) : (
                    <p className="text-gray-600 line-clamp-1">Contenu non disponible</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <User className="h-4 w-4 text-gray-400" />
                  </Avatar>
                  <span className="text-sm text-gray-700">{group.auteurNom}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className="bg-blue-100 text-blue-800">
                  {group.count} {group.count > 1 ? "signalements" : "signalement"}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {group.signalements[0]?.date ? 
                  formatDistanceToNow(new Date(group.signalements[0].date), { addSuffix: true, locale: fr }) : 
                  "Date inconnue"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-800 h-8 w-8 p-0"
                    onClick={() => onView(group)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-600 hover:text-orange-800 h-8 w-8 p-0"
                    onClick={() => onWarn(group)}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                    onClick={() => onDelete(group)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}