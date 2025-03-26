import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, newPseudo, newBio, newPhoto } = body;

    // Vérification des paramètres
    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    // Mise à jour des informations de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nom: newPseudo || undefined,
        bio: newBio || undefined,
        photoProfil: newPhoto || undefined,
      },
    });

    return NextResponse.json({
      message: "Profil mis à jour avec succès",
      user: {
        id: updatedUser.id,
        nom: updatedUser.nom,
        bio: updatedUser.bio,
        photoProfil: updatedUser.photoProfil,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}