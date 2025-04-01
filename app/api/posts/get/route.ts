import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');
    const creatorId = searchParams.get('creatorId');
    const period = searchParams.get('period');
    const sort = searchParams.get('sort');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 6;

    if (postId) return await GET_BY_ID(req);
    if (creatorId) return await GET_BY_CREATOR(req, creatorId, userId);

    // Calculer la date de début en fonction de la période
    let startDate: Date | undefined;
    if (period === "today") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // Début de la journée
    } else if (period === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Derniers 7 jours
    } else if (period === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Dernier mois
    }


    const posts = await prisma.post.findMany({
      where: startDate
        ? {
            date: {
              gte: startDate, // Posts à partir de `startDate`
            },
          }
        : undefined,
      include: { 
        user:{
          select: {
            nom: true,
            id: true,
            photoProfil: true,
          }
        },
      },
    });

    const postsWithCounts = posts.map(post => ({
      ...post,
      nbLikes: Array.isArray(post.likes) ? post.likes.length : 0,
      nbCommentaires: Array.isArray(post.commentaires) ? post.commentaires.length : 0,
    }));

    if (sort === "popular") {
      postsWithCounts.sort((a, b) => b.nbLikes - a.nbLikes);
    } else if (sort === "commented") {
      postsWithCounts.sort((a, b) => b.nbCommentaires - a.nbCommentaires);
    } else {
      postsWithCounts.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    
    const paginatedPosts = postsWithCounts.slice((page - 1) * pageSize, page * pageSize);

    const accueilPosts = paginatedPosts.map(post => ({
      id: post.id,
      auteur: post.user.nom,
      titre: post.titre,
      contenu: post.contenu.substring(0, 100),
      date: post.date,
      nbLikes: Array.isArray(post.likes) ? post.likes.length : 0,
      nbCommentaires: Array.isArray(post.commentaires) ? post.commentaires.length : 0,
      user: {
        id: post.user?.id,
        name: post.user?.nom,
        photoProfil: post.user?.photoProfil,
      },
    }));

    return NextResponse.json(accueilPosts);

  } catch (error) {
    console.error("Erreur lors de la recherche des posts :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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
        user: {
          select:{ 
            nom: true,
            id: true,
            photoProfil: true,
           },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
    }

    const postDetails = {
      id: post.id,
      auteur: post.user?.nom,
      titre: post.titre,
      contenu: post.contenu,
      date: post.date,
      nbCommentaires: Array.isArray(post.commentaires) ? post.commentaires.length : 0,
      nbLikes: Array.isArray(post.likes) ? post.likes.length : 0,
      user: {
        id: post.user?.id,
        name: post.user?.nom,
        photoProfil: post.user?.photoProfil,
      },
    };

    return NextResponse.json(postDetails);

  } catch (error) {
    console.error("Erreur lors de la récupération du post :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET_BY_CREATOR(req: Request, creatorId: string, userId: string | null) {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: creatorId },
      include: { 
        user: {
          select:{
            nom: true,
            id: true,
            photoProfil: true,
          }
        },
      },
    });

    const userPosts = posts.map(post => ({
      id: post.id,
      auteur: post.user.nom,
      titre: post.titre,
      contenu: post.contenu.substring(0, 100),
      date: post.date,
      nbLikes: Array.isArray(post.likes) ? post.likes.length : 0,
      isOwner: userId === creatorId,
      user: {
        id: post.user?.id,
        name: post.user?.nom,
        photoProfil: post.user?.photoProfil,
      },
    }));

    return NextResponse.json(userPosts);

  } catch (error) {
    console.error("Erreur lors de la récupération des posts du créateur :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}