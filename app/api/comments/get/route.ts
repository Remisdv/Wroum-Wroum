import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get("postId");

        if (!postId) {
            return NextResponse.json({ error: "postId est requis" }, { status: 400 });
        }

        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
        }

        const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];

        // On enrichit chaque commentaire avec le nom de l’auteur
        const commentairesAvecNoms = await Promise.all(
            commentaires.map(async (comment: any) => {
              const user = await prisma.user.findUnique({ where: { id: comment.userId } });
              return {
                ...comment,
                user: {
                  name: user?.nom || "Utilisateur inconnu",
                  photoProfil: user?.photoProfil || null,
                }
              };
            })
          );


        return NextResponse.json(commentairesAvecNoms);
    } catch (error) {
        console.error("Erreur lors de la récupération des commentaires :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
