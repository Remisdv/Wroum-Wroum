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

    // Récupérer les deux utilisateurs
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId } }),
      prisma.user.findUnique({ where: { id: followingId } }),
    ]);

    if (!follower || !following) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Convertir les champs Json en tableaux si nécessaire
    let followerAbonnements = [];
    let followingAbonnes = [];
    
    try {
      if (typeof follower.abonnements === 'string') {
        followerAbonnements = JSON.parse(follower.abonnements as string);
      } else if (Array.isArray(follower.abonnements)) {
        followerAbonnements = follower.abonnements;
      } else if (follower.abonnements === null) {
        followerAbonnements = [];
      }
      
      if (typeof following.abonnés === 'string') {
        followingAbonnes = JSON.parse(following.abonnés as string);
      } else if (Array.isArray(following.abonnés)) {
        followingAbonnes = following.abonnés;
      } else if (following.abonnés === null) {
        followingAbonnes = [];
      }
    } catch (e) {
      console.error("Erreur lors du parsing JSON:", e);
      followerAbonnements = [];
      followingAbonnes = [];
    }

    // Vérifier si déjà abonné
    const estDejaAbonne = followerAbonnements.some((a: any) => a.userId === followingId);

    if (estDejaAbonne) {
      // Désabonnement
      const newAbonnements = followerAbonnements.filter((a: any) => a.userId !== followingId);
      const newAbonnes = followingAbonnes.filter((a: any) => a.userId !== followerId);

      await prisma.user.update({
        where: { id: followerId },
        data: { abonnements: newAbonnements },
      });

      await prisma.user.update({
        where: { id: followingId },
        data: { abonnés: newAbonnes },
      });

      return NextResponse.json({ message: "Désabonnement réussi", status: "unfollow" }, { status: 200 });
    } else {
      // Abonnement
      const date = new Date().toISOString(); // Utiliser une chaîne pour éviter les problèmes de sérialisation
      const newAbonnement = { userId: followingId, date };
      const newAbonne = { userId: followerId, date };

      await prisma.user.update({
        where: { id: followerId },
        data: { abonnements: [...followerAbonnements, newAbonnement] },
      });

      await prisma.user.update({
        where: { id: followingId },
        data: { abonnés: [...followingAbonnes, newAbonne] },
      });

      return NextResponse.json({ message: "Abonnement créé avec succès", status: "follow" }, { status: 201 });
    }

  } catch (error) {
    console.error("Erreur lors de la gestion de l'abonnement :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}