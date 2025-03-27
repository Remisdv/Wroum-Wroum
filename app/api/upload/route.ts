import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { writeFile } from "fs/promises";
import { getServerSession } from "next-auth";

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

        

        // Enregistrer l'image dans le dossier "public/uploads"
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Générer un nom de fichier unique (pour les conflits)
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(process.cwd(), "public/uploads", uniqueFileName);
        await writeFile(filePath, new Uint8Array(buffer));

        const imageUrl = `/uploads/${uniqueFileName}`;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { photoProfil: imageUrl },
        });

        return NextResponse.json({ message: "Photo de profil mise à jour", url: imageUrl });
    } catch (error) {
        console.error("Erreur lors de l'upload de l'image :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}