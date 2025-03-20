import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { titre, contenu, userId } = await req.json();

    if (!titre || !contenu || !userId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Création du post
    const newPost = await prisma.Post.create({
      data: {
        titre,
        contenu,
        date: new Date(),
        userId,
      },
    });

    return NextResponse.json({ message: "Post créé avec succès", post: newPost }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du post :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
