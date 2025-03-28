import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { writeFile, unlink } from "fs/promises";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        console.log("FormData reçu :", formData);

        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        console.log("Fichier reçu :", file);
        console.log("ID utilisateur :", userId);

        if (!file) {
            return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "userId est requis" }, { status: 400 });
        }

        // Récupérer l'utilisateur pour obtenir l'ancienne photo de profil
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { photoProfil: true }, // Récupérer uniquement la photo de profil
        });

        if (!existingUser) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        const oldPhotoUrl = existingUser.photoProfil;
        console.log("Ancienne photo de profil :", oldPhotoUrl);

        // Enregistrer l'image dans le dossier "public/uploads"
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Générer un nom de fichier unique (pour les conflits)
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(process.cwd(), "public/uploads", uniqueFileName);
        await writeFile(filePath, new Uint8Array(buffer));

        const imageUrl = `/uploads/${uniqueFileName}`;

        // Mettre à jour la photo de profil dans la base de données
        const user = await prisma.user.update({
            where: { id: userId },
            data: { photoProfil: imageUrl },
        });

        console.log("Utilisateur mis à jour :", user);

        // Supprimer l'ancienne photo si elle existe et n'est pas la photo par défaut
        if (oldPhotoUrl && oldPhotoUrl !== "/uploads/default-profile.JPEG") {
            const oldFilePath = path.join(process.cwd(), "public", oldPhotoUrl);
            try {
                await unlink(oldFilePath); // Supprimer le fichier
                console.log("Ancienne photo supprimée :", oldFilePath);
            } catch (error) {
                console.error("Erreur lors de la suppression de l'ancienne photo :", error);
            }
        }

        return NextResponse.json({ message: "Photo de profil mise à jour", url: imageUrl });
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}