import { useState } from "react";

export default function UploadPhotoProfile() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>(""); // ID de l'utilisateur, à ajuster selon votre système d'authentification
  const [isUploading, setIsUploading] = useState<boolean>(false); // Indique si l'upload est en cours
  const [error, setError] = useState<string | null>(null); // Gestion des erreurs

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!image || !userId) {
      setError("Veuillez sélectionner une image et fournir un ID utilisateur.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", image);
    formData.append("userId", userId);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        setPreview(data.url); // Affiche l'URL de la photo mise à jour
        alert("Photo de profil mise à jour !");
        setImage(null); // Réinitialise l'image après l'upload
      } else {
        setError("Erreur lors de l'upload.");
      }
    } catch (err) {
      console.error("Erreur lors de l'upload :", err);
      setError("Une erreur est survenue lors de l'upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h1>Uploader une photo de profil</h1>
      <input
        type="text"
        placeholder="Entrez votre ID utilisateur"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />
      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? "Upload en cours..." : "Uploader la photo"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {preview && (
        <div>
          <h3>Aperçu :</h3>
          <img src={preview} alt="Aperçu" style={{ width: 150 }} />
        </div>
      )}
    </div>
  );
}