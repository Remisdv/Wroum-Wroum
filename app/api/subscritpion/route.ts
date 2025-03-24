import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { followerId, followingId } = await req.json();

        if (!followerId || !followingId) {
            return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
        }

        // Vérifier si l'utilisateur existe
        const follower = await prisma.user.findUnique({
            where: { id: followerId },
        });

        const following = await prisma.user.findUnique({
            where: { id: followingId },
        });

        if (!follower || !following) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        if (followerId === followingId) {
            return NextResponse.json({ error: "Vous ne pouvez pas vous abonner vous-meme" }, { status: 400 });
        }

        // Vérifier si l'abonnement existe déjà
        const existingSubscription = await prisma.subscription.findFirst({
            where: { followerId, followingId },
        });

        //si l'abonnement existe déjà, on le supprime
        if (existingSubscription) {
            await prisma.subscription.delete({
                where: { id: existingSubscription.id },
            });
            return NextResponse.json({ message: "Abonnement supprimé avec succès", subscription: existingSubscription }, { status: 200 });
        }else{
        const newSubscription = await prisma.subscription.create({
            data: {
                followerId,
                followingId,
            },
        });

        return NextResponse.json({ message: "Abonnement créé avec succès", subscription: newSubscription }, { status: 201 });
    }

    } catch (error) {
        console.error("Erreur lors de la création de l'abonnement :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}