import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get("postId");

        if (!postId) {
            return NextResponse.json({ error: "postId sont requis" }, { status: 400 });
        }

        // Récupérer le post
        const post = await prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
        }

        await prisma.post.delete({
            where: { id: postId },
        });

        return NextResponse.json({ message: "Post supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression du commentaire :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}