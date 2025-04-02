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
  motif?: string;
  commentaireId?: number; // Ajouté pour le support du nouveau champ
}

// Interface améliorée pour les commentaires
interface CommentaireType {
  commentaireId: number;
  userId: string;
  contenu: string;
  date: string;
  signalements?: any[];
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
        
        // Utiliser directement le type et commentaireId
        let displayType = signalement.type;
        const commentaireId = signalement.commentaireId ?? null;
        
        try {
          // Pour les posts signalés
          if (signalement.postId && displayType === "post") {
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
          else if (signalement.postId && displayType === "commentaire") {
            const post = await prisma.post.findUnique({
              where: { id: signalement.postId }
            });
            
            if (post && post.commentaires) {
              // S'assurer que commentaires est un tableau
              const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];
              
              // Logs améliorés pour débogage
              console.log("DEBUG - Recherche commentaire:", {
                signalementId: signalement.id,
                commentaireId: signalement.commentaireId,
                typeSignalementCID: typeof signalement.commentaireId
              });

              // Affichez les premiers commentaires pour débogage
              if (commentaires.length > 0) {
                console.log("Commentaires disponibles:", commentaires.slice(0, 3).map((c: any) => ({
                  id: c.commentaireId,
                  type: typeof c.commentaireId
                })));
              } else {
                console.log("Aucun commentaire trouvé dans le post:", post.id);
              }
              
              // Chercher le commentaire avec l'ID extrait
              let commentaire = null;
              
              if (signalement.commentaireId) {
                // Utiliser une comparaison numérique plus robuste
                const foundComment = commentaires.find((c: any) => {
                  const cid1 = Number(c.commentaireId);
                  const cid2 = Number(signalement.commentaireId);
                  const match = !isNaN(cid1) && !isNaN(cid2) && cid1 === cid2;
                  
                  if (match) {
                    console.log("MATCH TROUVÉ:", { commentaireId: cid1, signalementCommentaireId: cid2 });
                  }
                  
                  return match;
                });
                
                // Cast du commentaire trouvé avec le bon type
                if (foundComment && 
                    typeof foundComment === 'object' && 
                    'commentaireId' in foundComment && 
                    'userId' in foundComment && 
                    'contenu' in foundComment && 
                    'date' in foundComment) {
                  commentaire = foundComment as unknown as CommentaireType;
                }
              }
              
              if (commentaire) {
                // Accès sécurisé aux propriétés
                auteurId = commentaire.userId;
                
                // Récupérer l'utilisateur du commentaire
                if (commentaire.userId) {
                  const user = await prisma.user.findUnique({
                    where: { id: commentaire.userId }
                  });
                  auteurNom = user?.nom || "Utilisateur inconnu";
                }
                
                commentDetails = {
                  id: commentaire.commentaireId,
                  contenu: commentaire.contenu,
                  date: commentaire.date,
                  postTitre: post.titre,
                  postId: post.id
                };

                console.log("Détails du commentaire trouvés:", {
                  id: commentaire.commentaireId,
                  contenu: commentaire.contenu.substring(0, 50) + "..."
                });
              } else {
                // Si aucun commentaire trouvé avec l'ID spécifique
                if (commentaireId !== null) {
                  console.log(`Commentaire avec ID ${commentaireId} non trouvé dans le post ${post.id}`);
                } else {
                  console.log(`Ancien format de signalement sans ID de commentaire: ${signalement.id}`);
                }
                
                // Pour les anciens formats de signalement sans ID de commentaire,
                // on affiche au moins les informations du post parent
                commentDetails = {
                  id: 0,
                  contenu: "[Contenu du commentaire non disponible]",
                  date: signalement.date.toISOString(),
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
          type: displayType as "post" | "commentaire",
          date: signalement.date.toISOString(),
          titre: signalement.titre || "",
          contenu: signalement.contenu || "",
          motif: signalement.titre || "Signalement", // Utiliser le titre comme motif s'il n'y a pas de champ motif
          userId: signalement.userId,
          postId: signalement.postId,
          commentId: commentaireId, // Utiliser l'ID extrait du type
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