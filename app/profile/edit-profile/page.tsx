"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  ChevronLeft,
  User,
  Pencil,
  Camera,
  UploadCloud,
  Check,
  X,
  AlertCircle,
  Save,
  Trash2,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(""); 
  const [originalBio, setOriginalBio] = useState("");
  const [pseudo, setPseudo] = useState(""); 
  const [originalPseudo, setOriginalPseudo] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Vérifier les changements en attente
  useEffect(() => {
    const hasChanges = 
      (bio !== originalBio && originalBio !== "") || 
      (pseudo !== originalPseudo && originalPseudo !== "") ||
      selectedFile !== null;
    
    setHasPendingChanges(hasChanges);
  }, [bio, originalBio, pseudo, originalPseudo, selectedFile]);

  // Récupérer les informations existantes
  const fetchProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/profile?userId=${session.user.id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des informations du profil");
      }
      const data = await response.json();

      // Mettre à jour la bio et le pseudo avec les données récupérées
      setBio(data.bio || "");
      setOriginalBio(data.bio || "");
      setPseudo(data.nom || "");
      setOriginalPseudo(data.nom || "");
      
      // Récupérer l'URL de l'image de profil si disponible
      if (data.profileImage) {
        setProfileImage(data.profileImage);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations du profil :", error);
      showToast("error", "Impossible de récupérer vos informations de profil");
    }
  };

  // Charger les informations au montage du composant
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  // Créer une URL de prévisualisation pour l'image sélectionnée
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Nettoyer l'URL lors du démontage
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  // Afficher une notification toast
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    // Icône en fonction du type
    let icon = '✓';
    let bgColor = 'bg-green-50 border-green-200 text-green-700';
    
    if (type === 'error') {
      icon = '✗';
      bgColor = 'bg-red-50 border-red-200 text-red-700';
    } else if (type === 'info') {
      icon = 'ℹ';
      bgColor = 'bg-blue-50 border-blue-200 text-blue-700';
    }
    
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${bgColor} px-4 py-3 rounded-lg shadow-lg flex items-center z-50 border`;
    toast.innerHTML = `
      <div class="mr-2">${icon}</div>
      <div>${message}</div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleSaveBio = async () => {
    if (!session?.user?.id) {
      showToast("error", "Vous devez être connecté pour modifier votre bio");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          newBio: bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("error", data.error || "Une erreur est survenue");
      } else {
        showToast("success", "Bio mise à jour avec succès");
        setIsEditingBio(false);
        setOriginalBio(bio);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la bio :", error);
      showToast("error", "Une erreur s'est produite");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePseudo = async () => {
    if (!session?.user?.id) {
      showToast("error", "Vous devez être connecté pour modifier votre pseudo");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/pseudo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          newPseudo: pseudo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("error", data.error || "Une erreur est survenue");
      } else {
        showToast("success", "Pseudo mis à jour avec succès");
        setIsEditingPseudo(false);
        setOriginalPseudo(pseudo);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du pseudo :", error);
      showToast("error", "Une erreur s'est produite");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Vérifier le type et la taille du fichier
      if (!file.type.startsWith('image/')) {
        showToast("error", "Veuillez sélectionner un fichier image valide");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showToast("error", "L'image est trop volumineuse (maximum 5MB)");
        return;
      }
      
      setSelectedFile(file);
      setUploadMessage({ type: 'info', message: 'Image prête à être téléchargée' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user?.id) {
      showToast("error", "Veuillez sélectionner une image");
      return;
    }

    setIsUploading(true);
    setUploadMessage({ type: 'info', message: 'Téléchargement en cours...' });

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userId", session.user.id);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Photo de profil mise à jour avec succès");
        setUploadMessage({ type: 'success', message: 'Photo de profil mise à jour !' });
        setProfileImage(data.imageUrl || null);
        setSelectedFile(null);
      } else {
        setUploadMessage({ type: 'error', message: data.error || "Une erreur est survenue" });
        showToast("error", data.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de l'upload :", error);
      setUploadMessage({ type: 'error', message: "Une erreur est survenue lors de l'upload" });
      showToast("error", "Une erreur s'est produite lors de l'envoi du fichier");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (!file.type.startsWith('image/')) {
        showToast("error", "Veuillez déposer un fichier image valide");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showToast("error", "L'image est trop volumineuse (maximum 5MB)");
        return;
      }
      
      setSelectedFile(file);
      setUploadMessage({ type: 'info', message: 'Image prête à être téléchargée' });
    }
  };

  const handleCancelChanges = () => {
    // Réinitialiser les champs modifiés
    setBio(originalBio);
    setPseudo(originalPseudo);
    setIsEditingBio(false);
    setIsEditingPseudo(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadMessage(null);
    
    showToast("info", "Modifications annulées");
  };

  if (!session?.user) {
    router.push("/auth");
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />

      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-blue-600 group"
              onClick={() => {
                if (hasPendingChanges) {
                  if (confirm("Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter cette page ?")) {
                    router.push("/profile");
                  }
                } else {
                  router.push("/profile");
                }
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
              Retour au profil
            </Button>
          </div>
          
          {hasPendingChanges && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-gray-600"
                onClick={handleCancelChanges}
              >
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            </div>
          )}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Modifier votre profil</h1>
          <p className="text-gray-500 mb-6">Personnalisez vos informations publiques</p>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Colonne gauche - Photo de profil */}
            <div className="md:col-span-1">
              <Card className="p-6 shadow-md">
                <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-blue-500" />
                  Photo de profil
                </h2>
                
                <div className="flex flex-col items-center">
                  {/* Avatar actuel ou prévisualisation */}
                  <div className="relative mb-4 group">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-md">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Prévisualisation" 
                          className="w-full h-full object-cover"
                        />
                      ) : profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Photo de profil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-gray-400" />
                      )}
                    </Avatar>
                    
                    <button 
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Pencil className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  
                  {/* Zone de drop pour l'image */}
                  <div 
                    className={`w-full p-4 border-2 border-dashed rounded-lg mb-4 transition-colors ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center cursor-pointer">
                      <UploadCloud className={`h-8 w-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                      <p className="text-sm text-center text-gray-500">
                        Glissez une image ou <span className="text-blue-500">parcourez</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG (max. 5MB)</p>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden"
                    />
                  </div>
                  
                  {/* Message d'upload */}
                  {uploadMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm p-2 rounded-md mb-4 w-full text-center
                        ${uploadMessage.type === 'success' ? 'bg-green-50 text-green-700' : 
                         uploadMessage.type === 'error' ? 'bg-red-50 text-red-700' :
                         'bg-blue-50 text-blue-700'}`}
                    >
                      {uploadMessage.message}
                    </motion.div>
                  )}
                  
                  {/* Boutons d'action */}
                  {selectedFile && (
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setUploadMessage(null);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Annuler
                      </Button>
                      
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Envoi...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4 mr-1" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Colonne droite - Informations de profil */}
            <div className="md:col-span-2">
              <Card className="p-6 shadow-md mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-500" />
                  Informations personnelles
                </h2>
                
                {/* Pseudo */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Pseudo</label>
                    {!isEditingPseudo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => setIsEditingPseudo(true)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Modifier
                      </Button>
                    )}
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {isEditingPseudo ? (
                      <motion.div
                        key="edit-pseudo"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="space-y-3">
                          <Input
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            placeholder="Entrez votre nouveau pseudo"
                            className="w-full border-blue-200 focus:border-blue-400"
                          />
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPseudo(originalPseudo);
                                setIsEditingPseudo(false);
                              }}
                              className="text-gray-600"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={handleSavePseudo}
                              disabled={isSaving || !pseudo.trim() || pseudo === originalPseudo}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {isSaving ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                  Enregistrement...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3.5 w-3.5 mr-1" />
                                  Enregistrer
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view-pseudo"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-gray-50 p-3 rounded-md"
                      >
                        <p className="text-gray-800 font-medium">{pseudo || "Aucun pseudo défini"}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Biographie</label>
                    {!isEditingBio && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => setIsEditingBio(true)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Modifier
                      </Button>
                    )}
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {isEditingBio ? (
                      <motion.div
                        key="edit-bio"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="space-y-3">
                          <Textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Parlez un peu de vous..."
                            className="w-full border-blue-200 focus:border-blue-400"
                            rows={4}
                          />
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div>
                              <span>{bio.length}</span> caractères
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBio(originalBio);
                                  setIsEditingBio(false);
                                }}
                                className="text-gray-600"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Annuler
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={handleSaveBio}
                                disabled={isSaving || bio === originalBio}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isSaving ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                    Enregistrement...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-3.5 w-3.5 mr-1" />
                                    Enregistrer
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view-bio"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-gray-50 p-3 rounded-md min-h-[100px]"
                      >
                        <p className="text-gray-700 whitespace-pre-line">
                          {bio || "Aucune bio définie"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
              
              {/* Contrôles de confidentialité */}
              <Card className="p-6 shadow-md">
                <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-500" />
                  Paramètres de confidentialité
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="profile-public"
                        type="checkbox"
                        className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="profile-public" className="font-medium text-gray-700">Profil public</label>
                      <p className="text-gray-500">Votre profil est visible par tous les utilisateurs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="show-email"
                        type="checkbox"
                        className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="show-email" className="font-medium text-gray-700">Afficher mon email</label>
                      <p className="text-gray-500">Votre email est visible sur votre profil</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="notification-comments"
                        type="checkbox"
                        className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="notification-comments" className="font-medium text-gray-700">Notifications de commentaires</label>
                      <p className="text-gray-500">Recevoir des notifications pour les commentaires sur vos publications</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}