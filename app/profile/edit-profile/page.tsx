"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [bio, setBio] = useState(""); // Initialisation de la bio
  const [pseudo, setPseudo] = useState(""); // Initialisation du pseudo
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Fichier sélectionné
  const [uploadMessage, setUploadMessage] = useState<string | null>(null); // Message d'upload
  const [isUploading, setIsUploading] = useState(false); // Indicateur d'upload

  // Fonction pour récupérer les informations existantes
  const fetchProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/profil?userId=${session.user.id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des informations du profil");
      }
      const data = await response.json();

      // Mettre à jour la bio et le pseudo avec les données récupérées
      setBio(data.bio || "");
      setPseudo(data.nom || "");
    } catch (error) {
      console.error("Erreur lors de la récupération des informations du profil :", error);
    }
  };

  // Charger les informations au montage du composant
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const handleSaveBio = async () => {
    if (!session?.user?.id) {
      alert("Vous devez être connecté pour modifier votre bio.");
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
        alert("Erreur : " + data.error);
      } else {
        alert("Bio mise à jour avec succès !");
        setIsEditingBio(false);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la bio :", error);
      alert("Une erreur s'est produite.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePseudo = async () => {
    if (!session?.user?.id) {
      alert("Vous devez être connecté pour modifier votre pseudo.");
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
        alert("Erreur : " + data.error);
      } else {
        alert("Pseudo mis à jour avec succès !");
        setIsEditingPseudo(false);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du pseudo :", error);
      alert("Une erreur s'est produite.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user?.id) {
      setUploadMessage("Veuillez sélectionner une image et vous assurer que vous êtes connecté.");
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

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
        setUploadMessage("Photo de profil mise à jour avec succès !");
      } else {
        setUploadMessage(data.error || "Une erreur est survenue lors de l'upload.");
      }
    } catch (error) {
      console.error("Erreur lors de l'upload :", error);
      setUploadMessage("Une erreur est survenue lors de l'upload.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!session?.user) {
    router.push("/"); // Redirige vers la page d'accueil si l'utilisateur n'est pas connecté
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />

      <div className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Modifier votre profil</h1>

        <div className="space-y-6">
          {/* Pseudo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Pseudo</label>
            <div className="flex items-center gap-4 mt-2">
              {isEditingPseudo ? (
                <Input
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Entrez votre nouveau pseudo"
                  className="flex-1"
                />
              ) : (
                <p className="text-gray-600">{pseudo || "Aucun pseudo défini"}</p>
              )}
              <Button
                variant="outline"
                className="text-blue-700"
                onClick={() => setIsEditingPseudo(!isEditingPseudo)}
              >
                {isEditingPseudo ? "Annuler" : "Modifier"}
              </Button>
            </div>
            {isEditingPseudo && (
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSavePseudo}
                  disabled={isSaving || !pseudo.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? "Enregistrement..." : "Sauvegarder"}
                </Button>
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <div className="flex items-center gap-4 mt-2">
              {isEditingBio ? (
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Entrez votre nouvelle bio"
                  className="flex-1"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600">{bio || "Aucune bio définie"}</p>
              )}
              <Button
                variant="outline"
                className="text-blue-700"
                onClick={() => setIsEditingBio(!isEditingBio)}
              >
                {isEditingBio ? "Annuler" : "Modifier"}
              </Button>
            </div>
            {isEditingBio && (
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSaveBio}
                  disabled={isSaving || !bio.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? "Enregistrement..." : "Sauvegarder"}
                </Button>
              </div>
            )}
          </div>

          {/* Photo de profil */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Photo de profil</label>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className={`bg-blue-600 hover:bg-blue-700 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUploading ? "Upload en cours..." : "Uploader"}
              </Button>
            </div>
            {uploadMessage && <p className="mt-2 text-sm text-gray-600">{uploadMessage}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}