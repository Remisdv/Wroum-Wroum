import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: "La requête de recherche est requise" }, { status: 400 });
    }

    if (query.startsWith('@')) {
      // Recherche d'utilisateurs
      const username = query.slice(1);
      const users = await prisma.user.findMany({
        where: {
          nom: {
            contains: username,
            mode: 'insensitive',
          },
        },
      });

      return NextResponse.json(users);
    } else {
      // Recherche de posts par titre
      const posts = await prisma.post.findMany({
        where: {
          titre: {
            contains: query,
            mode: 'insensitive',
          },
        },
        include: { user: true },
      });

      return NextResponse.json(posts);
    }

  } catch (error) {
    console.error("Erreur lors de la recherche :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}