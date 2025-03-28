import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { signalementId, contentType, contentId, userId } = body;

    if (!signalementId || !contentType || !contentId) {
      return NextResponse.json(
        { error: "Informations manquantes pour la suppression" },
        { status: 400 }
      );
    }

    // Vérifier si le signalement existe
    const signalement = await prisma.signalement.findUnique({
      where: { id: signalementId }
    });

    if (!signalement) {
      return NextResponse.json(
        { error: "Signalement non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le contenu selon son type
    if (contentType === "post") {
      // Supprimer le post
      await prisma.post.delete({
        where: { id: contentId }
      });
      
      // Mettre à jour le statut du signalement
      await prisma.signalement.update({
        where: { id: signalementId },
        data: { status: "traité" }
      });
      
      return NextResponse.json({ 
        message: "Post supprimé avec succès",
        signalementId,
        contentId
      });
    } 
    else if (contentType === "commentaire") {
      // Pour les commentaires, on doit trouver le post et supprimer le commentaire du JSON
      const post = await prisma.post.findUnique({
        where: { id: signalement.postId || "" }
      });
      
      if (!post) {
        return NextResponse.json(
          { error: "Post associé au commentaire non trouvé" },
          { status: 404 }
        );
      }
      
      // Filtrer les commentaires pour supprimer celui qui est signalé
      // La logique exacte dépend de la structure de votre JSON de commentaires
      const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];
      const nouveauxCommentaires = commentaires.filter(
        (comment: any) => comment.commentaireId !== parseInt(contentId)
      );
      
      // Mettre à jour le post avec les commentaires filtrés
      await prisma.post.update({
        where: { id: post.id },
        data: { 
          commentaires: nouveauxCommentaires
        }
      });
      
      // Mettre à jour le statut du signalement
      await prisma.signalement.update({
        where: { id: signalementId },
        data: { status: "traité" }
      });
      
      return NextResponse.json({ 
        message: "Commentaire supprimé avec succès",
        signalementId,
        contentId
      });
    }
    
    return NextResponse.json(
      { error: "Type de contenu non pris en charge" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du contenu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du contenu" },
      { status: 500 }
    );
  }
}