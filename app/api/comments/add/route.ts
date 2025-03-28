import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { postId, contenu, userId } = await req.json();

        if (!postId || !contenu || !userId) {
            return NextResponse.json({ error: "postId, contenu et userId sont requis" }, { status: 400 });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
        }

        const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];

        const nouveauCommentaire = {
            commentaireId: commentaires.length + 1,
            userId,
            contenu,
            date: new Date(),
            signalements: [],
        };

        const updatedCommentaires = [...commentaires, nouveauCommentaire];

        await prisma.post.update({
            where: { id: postId },
            data: { commentaires: updatedCommentaires },
        });

        return NextResponse.json({ message: "Commentaire ajouté avec succès", commentaire: nouveauCommentaire }, { status: 201 });

    } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}