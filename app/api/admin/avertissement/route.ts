import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, message, signalementId } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: "ID utilisateur et message sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le signalement si signalementId est fourni
    if (signalementId) {
      await prisma.signalement.update({
        where: { id: signalementId },
        data: { status: "traité" }
      });
    }

    // Idéalement, stockez l'avertissement dans une table dédiée
    // Pour l'exemple, on se contente de simuler l'envoi
    
    return NextResponse.json({
      message: "Avertissement envoyé avec succès",
      userId,
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'avertissement:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'avertissement" },
      { status: 500 }
    );
  }
}