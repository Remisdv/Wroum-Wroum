import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { postId, titre, contenu, userId } = await req.json();

        if (!postId || !titre || !contenu || !userId) {
            return NextResponse.json({ error: "postId, titre, contenu et userId sont requis" }, { status: 400 });
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

        // Créer un nouveau signalement
        const nouveauSignalement = await prisma.Signalement.create({
            data: {
                type: "post",
                postId,
                userId,
                raison: contenu,
                date: new Date(),
            },
        });

        // Mettre à jour le post avec le nouveau signalement
        const signalements = Array.isArray(post.signalements) ? post.signalements : [];
        signalements.push({
            ...nouveauSignalement,
            date: nouveauSignalement.date.toISOString(),
        });

        await prisma.post.update({
            where: { id: postId },
            data: { signalements },
        });

        return NextResponse.json({ message: "Signalement ajouté avec succès", signalement: nouveauSignalement }, { status: 201 });

    } catch (error) {
        console.error("Erreur lors de l'ajout du signalement :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
