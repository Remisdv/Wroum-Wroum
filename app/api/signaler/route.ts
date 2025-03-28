import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { type, postId, commentId, userId, motif, contenu } = await req.json();

        if (!type || !userId || !motif || !postId) {
            return NextResponse.json({ 
                error: "Paramètres manquants pour le signalement" 
            }, { status: 400 });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        // Vérifier si le post existe
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
        }

        // Création du signalement
        const nouveauSignalement = await prisma.signalement.create({
            data: {
                // Stocke si c'est un post ou un commentaire qui est signalé
                type, 
                postId,
                userId,
                // Stocke la catégorie du signalement (contenu_inapproprie, spam, autre...)
                titre: motif,
                // Stocke l'explication détaillée fournie par l'utilisateur
                contenu: contenu || "Aucun détail fourni",
                date: new Date(),
                status: "en_attente"
            },
        });

        return NextResponse.json({ 
            message: `${type === "post" ? "Post" : "Commentaire"} signalé avec succès`, 
            signalement: nouveauSignalement 
        }, { status: 201 });

    } catch (error) {
        console.error("Erreur lors du signalement:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}