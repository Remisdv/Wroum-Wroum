import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { postId, contenu, userId } = await req.json();

        if (!postId || !contenu || !userId) {
            if (!postId) {
                return NextResponse.json({ error: "postId est requis" }, { status: 400 });
            }
            if (!contenu) {
                return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
            }
            if (!userId) {
                return NextResponse.json({ error: "userId est requis" }, { status: 400 });
            }
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        
        if (!existingUser) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        const newPost = await prisma.Commentaire.create({
            data: {
                contenu,
                date: new Date(),
                postId,
                userId,
            },
        });

        return NextResponse.json({ message: "Commentaire créé avec succès", commentaire: newPost }, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de la création du commentaire :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}