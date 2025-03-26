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

    //  Récupérer les deux utilisateurs
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId } }),
      prisma.user.findUnique({ where: { id: followingId } }),
    ]);

    if (!follower || !following) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const abonnements = Array.isArray(follower.abonnements) ? follower.abonnements : [];
    const abonnes = Array.isArray(following.abonnés) ? following.abonnés : [];

    const estDejaAbonne = abonnements.some((a: any) => a.userId === followingId);

    if (estDejaAbonne) {
      // Désabonnement
      const newAbonnements = abonnements.filter((a: any) => a.userId !== followingId);
      const newAbonnes = abonnes.filter((a: any) => a.userId !== followerId);

      await prisma.user.update({
        where: { id: followerId },
        data: { abonnements: newAbonnements },
      });

      await prisma.user.update({
        where: { id: followingId },
        data: { abonnés: newAbonnes },
      });

      return NextResponse.json({ message: "Désabonnement réussi" }, { status: 200 });
    } else {
      // Abonnement
      const date = new Date();
      const newAbonnement = { userId: followingId, date };
      const newAbonne = { userId: followerId, date };

      await prisma.user.update({
        where: { id: followerId },
        data: { abonnements: [...abonnements, newAbonnement] },
      });

      await prisma.user.update({
        where: { id: followingId },
        data: { abonnés: [...abonnes, newAbonne] },
      });

      return NextResponse.json({ message: "Abonnement créé avec succès" }, { status: 201 });
    }

  } catch (error) {
    console.error("Erreur lors de la gestion de l'abonnement :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
