import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { writeFile } from "fs/promises";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file) {
            return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
        }

        // Vérifie si l'utilisateur est authentifié (avec NextAuth par exemple)
        const session = await getServerSession();
        if (!session || session.user.id !== userId) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        // Enregistrer l'image dans le dossier "public/uploads"
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filePath = path.join(process.cwd(), "public/uploads", file.name);
        await writeFile(filePath, new Uint8Array(buffer));

        // Créer l'URL de l'image téléchargée
        const imageUrl = `/uploads/${file.name}`;

        // Mettre à jour le profil de l'utilisateur avec l'URL de la photo
        const user = await prisma.user.update({
            where: { id: userId },
            data: { photoProfil: imageUrl }
        });

        return NextResponse.json({ message: "Photo de profil mise à jour", url: imageUrl });

    } catch (error) {
        console.error("Erreur lors de l'upload de l'image :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
