import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Récupérer tous les signalements
    const signalements = await prisma.signalement.findMany({
      orderBy: { date: 'desc' },
      include: {
        post: true
      }
    });

    // Formater les données pour le frontend
    const formattedSignalements = await Promise.all(signalements.map(async (signalement) => {
      let auteurId = "";
      let auteurNom = "Utilisateur inconnu";
      let type: "post" | "commentaire" = signalement.type === "commentaire" ? "commentaire" : "post";
      
      try {
        // Pour les posts
        if (signalement.postId && type === "post") {
          const post = await prisma.post.findUnique({
            where: { id: signalement.postId },
            include: { user: true }
          });
          
          if (post) {
            auteurId = post.userId;
            const user = await prisma.user.findUnique({
              where: { id: auteurId }
            });
            
            if (user) {
              auteurNom = user.nom;
            }
          }
        } 
        // Pour les commentaires
        else if (signalement.postId && type === "commentaire") {
          const post = await prisma.post.findUnique({
            where: { id: signalement.postId }
          });
          
          if (post && post.commentaires) {
            // Trouver le bon commentaire dans le JSON des commentaires
            // Ceci suppose que vous stockez un userId ou auteurId dans chaque commentaire
            const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];
            // Cette logique dépend de la structure exacte de votre JSON de commentaires
            // Vous devrez peut-être l'adapter
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des infos de l'auteur:", error);
      }

      return {
        id: signalement.id,
        type,
        date: signalement.date.toISOString(),
        titre: signalement.titre || "",
        contenu: signalement.contenu || "",
        userId: signalement.userId,
        postId: signalement.postId,
        commentId: type === "commentaire" ? signalement.postId : undefined, // Ajustez selon votre modèle
        auteurId,
        auteurNom,
        motif: signalement.type,
        status: signalement.status || "en_attente"
      };
    }));

    return NextResponse.json(formattedSignalements);
  } catch (error) {
    console.error("Erreur lors de la récupération des signalements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des signalements" },
      { status: 500 }
    );
  }
}