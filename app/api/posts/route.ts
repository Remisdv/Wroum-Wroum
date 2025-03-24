import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { titre, contenu, userId } = await req.json();

    if (!titre || !contenu || !userId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Création du post
    const newPost = await prisma.post.create({
      data: {
        titre,
        contenu,
        date: new Date(),
        userId,
      },
    });

    return NextResponse.json({ message: "Post créé avec succès", post: newPost }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du post :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (postId) {
      return await GET_BY_ID(req);
    }
    if (userId) {
      return await GET_BY_USER(req);
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 6;

    const posts = await prisma.post.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: true,
        commentaires: true,
        likes: true,
      },
    });

    const accueilPosts = posts.map(post => ({
      id: post.id,
      auteur: post.user.nom,
      titre: post.titre,
      contenu: post.contenu.substring(0, 100),
      date: post.date,
      nbLikes: post.likes.length,
    }));

    return NextResponse.json(accueilPosts)

  } catch (error) {
    console.error("Erreur lors de la recherche des posts :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// recupérer un post précis
export async function GET_BY_ID(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: "postId est requis" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        commentaires: true,
        likes: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
    }

    const postDetails = {
      id: post.id,
      auteur: post.user.nom,
      titre: post.titre,
      contenu: post.contenu,
      date: post.date,
      nbCommentaires: post.commentaires.length,
      nbLikes: post.likes.length,
    };

    return NextResponse.json(postDetails);

  } catch (error) {
    console.error("Erreur lors de la récupération du post :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET_BY_USER(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      include: {
        user: true,
        commentaires: true,
        likes: true,
      },
    });

    const userPosts = posts.map(post => ({
      id: post.id,
      auteur: post.user.nom,
      titre: post.titre,
      contenu: post.contenu.substring(0, 100),
      date: post.date,
      nbLikes: post.likes.length,
    }));

    return NextResponse.json(userPosts);

  } catch (error) {
    console.error("Erreur lors de la récupération des posts de l'utilisateur :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
