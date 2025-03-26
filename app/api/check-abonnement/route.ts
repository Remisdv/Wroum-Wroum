import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const followerId = searchParams.get("followerId");
    const followingId = searchParams.get("followingId");

    if (!followerId || !followingId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const follower = await prisma.user.findUnique({
      where: { id: followerId }
    });

    if (!follower) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Obtenir les abonnements
    let abonnements = [];
    
    try {
      if (typeof follower.abonnements === "string" && follower.abonnements.trim() !== "") {
        abonnements = JSON.parse(follower.abonnements);
      } else if (Array.isArray(follower.abonnements)) {
        abonnements = follower.abonnements;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des abonnements:", e);
    }

    // Vérifier si l'utilisateur actuel est déjà abonné au profil
    const isFollowing = Array.isArray(abonnements) && abonnements.some((a: any) => a.userId === followingId);

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'abonnement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}