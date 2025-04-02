import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");
  
      if (!userId) {
        return NextResponse.json({ error: "userId est requis" }, { status: 400 });
      }
  
      // Récupérer les abonnements de l'utilisateur connecté
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { abonnements: true },
      });
  
      if (!user || !Array.isArray(user.abonnements)) {
        return NextResponse.json([]);
      }
  
      // Extraire uniquement les IDs des utilisateurs suivis
      const followingIds = user.abonnements.map((abonnement: any) => abonnement.userId);
  
      if (!Array.isArray(followingIds) || followingIds.length === 0) {
        return NextResponse.json([]);
      }
  
      // Récupérer les posts des utilisateurs suivis
      const posts = await prisma.post.findMany({
        where: { userId: { in: followingIds } },
        include: {
          user: {
            select: {
              nom: true,
              id: true,
              photoProfil: true,
            },
          },
        },
      });
  
      console.log("🔍 Données brutes récupérées dans GET_FOLLOWED :", posts);
  
      // Mapper les données pour uniformiser le format
      const postsWithCounts = posts.map(post => ({
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
  
      console.log("✅ Données formatées dans GET_FOLLOWED :", postsWithCounts);
  
      return NextResponse.json(postsWithCounts);
    } catch (error) {
      console.error("Erreur lors de la récupération des posts des abonnements :", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }