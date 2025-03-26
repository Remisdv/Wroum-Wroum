import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { postId, commentaireId, titre, contenu, userId } = await req.json();

        if (!postId || commentaireId === undefined || !titre || !contenu || !userId) {
            return NextResponse.json({ error: "postId, commentaireId, titre, contenu et userId sont requis" }, { status: 400 });
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

        // Vérifier si les commentaires existent et sont un tableau
        const commentaires: { commentaireId: number; signalements?: any[] }[] = Array.isArray(post.commentaires)
            ? post.commentaires.filter((comment: any): comment is { commentaireId: number; signalements?: any[] } =>
                typeof comment === "object" &&
                comment !== null &&
                typeof comment.commentaireId === "number"
              )
            : [];

        // Trouver le commentaire par commentaireId
        const commentaire = commentaires.find(comment => comment?.commentaireId === commentaireId);

        if (!commentaire) {
            return NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 });
        }

        // Créer un nouveau signalement
        const nouveauSignalement = await prisma.signalement.create({
            data: {
                type: "commentaire", // Assurez-vous que le type est "commentaire"
                postId,
                userId,
                titre,
                contenu,
                date: new Date(),
            },
        });

        // Mettre à jour le commentaire avec le nouveau signalement
        commentaire.signalements = [...(commentaire.signalements || []), nouveauSignalement];

        // Mettre à jour le post avec les commentaires modifiés
        await prisma.post.update({
            where: { id: postId },
            data: { commentaires },
        });

        return NextResponse.json({ message: "Signalement ajouté avec succès", signalement: nouveauSignalement }, { status: 201 });

    } catch (error) {
        console.error("Erreur lors de l'ajout du signalement :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}