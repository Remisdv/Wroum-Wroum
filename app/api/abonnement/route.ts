import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { followerId, followingId } = await req.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous abonner à vous-même" }, { status: 400 });
    }

    // Vérifier si les deux utilisateurs existent
    const users = await prisma.user.findMany({
      where: { id: { in: [followerId, followingId] } },
      select: { id: true },
    });

    if (users.length !== 2) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const abonnement = await prisma.abonnements.findFirst({
      where: {
        followerId: followerId,
        followingId: followingId,
      },
    });

    if (abonnement) {
      await prisma.user.update({
        where: { id: followerId },
        data: {
          abonnements: {
            set: abonnement.abonnements.filter((abonnement: any) => abonnement.userId !== followingId),
          },
        },
      });

      await prisma.user.update({
        where: { id: followingId },
        data: {
          abonnés: {
            set: abonnement.abonnés.filter((abonné: any) => abonné.userId !== followerId),
          },
        },
      });

      return NextResponse.json({ message: "Désabonnement réussi" }, { status: 200 });
    } else {
      // Ajouter l'abonnement
      await prisma.user.update({
        where: { id: followerId },
        data: {
          abonnements: {
            push: { userId: followingId, date: new Date() },
          },
        },
      });

      await prisma.user.update({
        where: { id: followingId },
        data: {
          abonnés: {
            push: { userId: followerId, date: new Date() },
          },
        },
      });

      return NextResponse.json({ message: "Abonnement créé avec succès" }, { status: 201 });
    }

  } catch (error) {
    console.error("Erreur lors de la gestion de l'abonnement :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}