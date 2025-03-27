import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, newPseudo } = body;

    // Vérification des paramètres
    if (!userId || !newPseudo) {
      return NextResponse.json(
        { error: "userId et newPseudo sont requis" },
        { status: 400 }
      );
    }

    // Mise à jour du pseudo dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nom: newPseudo },
    });

    return NextResponse.json({
      message: "Pseudo mis à jour avec succès",
      user: {
        id: updatedUser.id,
        nom: updatedUser.nom,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du pseudo :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour du pseudo" },
      { status: 500 }
    );
  }
}