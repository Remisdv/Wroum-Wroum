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

      // Ajouter un type aux résultats des utilisateurs
      const formattedUsers = users.map(user => ({
        ...user,
        type: "user"
      }));

      return NextResponse.json(formattedUsers);
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

      // Ajouter un type aux résultats des posts
      const formattedPosts = posts.map(post => ({
        ...post,
        type: "post"
      }));

      return NextResponse.json(formattedPosts);
    }

  } catch (error) {
    console.error("Erreur lors de la recherche :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}