import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
          console.log("userId est requis");
            return NextResponse.json({ error: "userId est requis" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
          console.log("Utilisateur non trouvé");
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        console.log("user", user);

        const abonnements = Array.isArray(user.abonnements) ? user.abonnements : [];

        console.log("abonnements", abonnements);

        if (abonnements.length === 0) {

            const page = parseInt(searchParams.get('page') || '1', 10);
            const pageSize = 6;

            const posts = await prisma.post.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { user: true },
              });
          
              const accueilPosts = posts.map(post => ({
                id: post.id,
                auteur: post.user.nom,
                titre: post.titre,
                contenu: post.contenu.substring(0, 100),
                date: post.date,
                nbLikes: Array.isArray(post.likes) ? post.likes.length : 0,
                nbCommentaires: Array.isArray(post.commentaires) ? post.commentaires.length : 0,
              }));
          
              return NextResponse.json(accueilPosts);
        } else {

          const page = parseInt(searchParams.get('page') || '1', 10);
          const pageSize = 6;
          const abonnementsIds = abonnements.map((abonnement: any) => abonnement.userId);

          const abonnementsPosts = await prisma.post.findMany({
              where: { userId: { in: abonnementsIds } },
              include: { user: true },
              orderBy: { date: "desc" },
          });

          const autresPosts = await prisma.post.findMany({
              where: { userId: { notIn: abonnementsIds } },
              skip: (page - 1) * pageSize,
              take: pageSize,
              include: { user: true },
              orderBy: { date: "desc" },
          });

          // Combiner les posts des abonnements et les autres posts
          const sortedPosts = [...abonnementsPosts, ...autresPosts];

          const accueilPosts = sortedPosts.map(post => ({
              id: post.id,
              auteur: post.user.nom,
              titre: post.titre,
              contenu: post.contenu.substring(0, 100),
              date: post.date,
              nbLikes: Array.isArray(post.likes) ? post.likes.length : 0,
              nbCommentaires: Array.isArray(post.commentaires) ? post.commentaires.length : 0,
          }));
          
          return NextResponse.json(accueilPosts);
          
        }
    }
    
    catch (error) {
        console.error("Erreur lors de la récupération des posts :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}