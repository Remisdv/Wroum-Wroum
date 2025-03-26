import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { nom, email, password } = await req.json();
    
    // Vérifier que tous les champs sont remplis
    if (!nom || !email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        nom,
        email,
        mdp: hashedPassword,
        abonnements: [], 
        abonnés: [],
        //créer une bio (def par default dans le prisma schema)
        bio: "Bonjour, je suis nouveau sur Wroum-Wroum !",
      },
    });

    // Ne pas retourner le mot de passe hashé
    const { mdp, ...userSafe } = newUser;

    return NextResponse.json({ message: "Inscription réussie", user: userSafe }, { status: 201 });

  } catch (error) {
    console.error("Erreur d'inscription :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
