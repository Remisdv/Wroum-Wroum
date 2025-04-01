import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get("commentId");
        const postId = searchParams.get("postId");

        if (!commentId || !postId) {
            return NextResponse.json({ error: "commentId et postId sont requis" }, { status: 400 });
        }

        // Récupérer le post contenant les commentaires
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { commentaires: true }, // Récupérer uniquement le champ commentaires
        });

        if (!post) {
            return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
        }

        // Vérifier si le commentaire existe dans le champ JSON
        const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];
        const commentaireIndex = commentaires.findIndex(
            (comment: any) => comment.commentaireId === parseInt(commentId, 10)
        );

        if (commentaireIndex === -1) {
            return NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 });
        }

        // Supprimer le commentaire du tableau
        commentaires.splice(commentaireIndex, 1);

        // Mettre à jour le champ JSON dans la base de données
        await prisma.post.update({
            where: { id: postId },
            data: { commentaires },
        });

        return NextResponse.json({ message: "Commentaire supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression du commentaire :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}