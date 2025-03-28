import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types pour éviter les erreurs TypeScript
interface PrismaSignalement {
  id: string;
  type: string;
  postId: string | null;
  userId: string;
  titre: string;
  contenu: string;
  date: Date;
  status: string;
  // Ajout du champ commentId manquant dans le modèle
  commentId?: number;
  motif?: string;
}

interface Commentaire {
  commentaireId: number;
  userId: string;
  contenu: string;
  date: string;
}

export async function GET(req: Request) {
  try {
    // Récupérer tous les signalements
    const signalements = await prisma.signalement.findMany({
      orderBy: { date: 'desc' }
    }) as PrismaSignalement[];

    // Formater les données pour le frontend
    const enrichedSignalements = await Promise.all(
      signalements.map(async (signalement) => {
        let auteurId = "";
        let auteurNom = "Utilisateur inconnu";
        let postDetails = null;
        let commentDetails = null;

        try {
          // Pour les posts signalés
          if (signalement.postId && signalement.type === "post") {
            const post = await prisma.post.findUnique({
              where: { id: signalement.postId },
              include: { user: true }
            });
            
            if (post) {
              auteurId = post.userId;
              auteurNom = post.user?.nom || "Utilisateur inconnu";
              postDetails = {
                id: post.id,
                titre: post.titre,
                contenu: post.contenu,
                date: post.date
              };
            }
          } 
          // Pour les commentaires signalés
          else if (signalement.postId && signalement.type === "commentaire" && signalement.commentId) {
            const post = await prisma.post.findUnique({
              where: { id: signalement.postId }
            });
            
            if (post && post.commentaires) {
              // Vérifier si commentaires est un tableau
              const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];
              
              // Parcourir les commentaires pour trouver celui qui correspond
              const commentaire = commentaires.find(
                (c: any) => c.commentaireId === signalement.commentId
              );
              
              if (commentaire) {
                // Accéder de manière sécurisée aux propriétés du commentaire
                const commentaireObj = commentaire as any;
                auteurId = commentaireObj.userId || "";
                
                // Récupérer l'utilisateur du commentaire
                if (commentaireObj.userId) {
                  const user = await prisma.user.findUnique({
                    where: { id: commentaireObj.userId }
                  });
                  auteurNom = user?.nom || "Utilisateur inconnu";
                }
                
                commentDetails = {
                  id: commentaireObj.commentaireId,
                  contenu: commentaireObj.contenu,
                  date: commentaireObj.date,
                  postTitre: post.titre,
                  postId: post.id
                };
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des détails:", error);
        }

        return {
          id: signalement.id,
          type: signalement.type as "post" | "commentaire",
          date: signalement.date.toISOString(),
          titre: signalement.titre || "",
          contenu: signalement.contenu || "",
          motif: signalement.titre || "Signalement", // Utiliser le titre comme motif s'il n'y a pas de champ motif
          userId: signalement.userId,
          postId: signalement.postId,
          commentId: signalement.commentId,
          auteurId,
          auteurNom,
          status: signalement.status || "en_attente",
          postDetails,
          commentDetails
        };
      })
    );

    // Créer des groupes de signalements par contenu
    const groupedSignalements: Record<string, any> = {};
    
    enrichedSignalements.forEach(signalement => {
      // Créer une clé unique basée sur le type et l'ID du contenu
      const key = `${signalement.type}_${signalement.type === "post" 
        ? signalement.postId 
        : `${signalement.postId}_${signalement.commentId}`}`;
      
      if (!groupedSignalements[key]) {
        groupedSignalements[key] = {
          contentId: key,
          type: signalement.type,
          postId: signalement.postId,
          commentId: signalement.commentId,
          postData: signalement.postDetails,
          commentaireData: signalement.commentDetails,
          auteurId: signalement.auteurId,
          auteurNom: signalement.auteurNom,
          signalements: [],
          count: 0
        };
      }
      
      // Ajouter le signalement au groupe
      groupedSignalements[key].signalements.push({
        id: signalement.id,
        date: signalement.date,
        motif: signalement.motif,
        contenu: signalement.contenu,
        userId: signalement.userId,
        status: signalement.status
      });
      
      // Incrémenter le compteur
      groupedSignalements[key].count += 1;
    });
    
    // Convertir l'objet en tableau pour le résultat final
    const result = Object.values(groupedSignalements);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Erreur lors de la récupération des signalements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des signalements" },
      { status: 500 }
    );
  }
}