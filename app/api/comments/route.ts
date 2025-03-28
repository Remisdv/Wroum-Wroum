// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export async function POST(req: Request) {
//     try {
//         const { postId, contenu, userId } = await req.json();

//         if (!postId || !contenu || !userId) {
//             return NextResponse.json({ error: "postId, contenu et userId sont requis" }, { status: 400 });
//         }

//         // Vérifier si l'utilisateur existe
//         const existingUser = await prisma.user.findUnique({ where: { id: userId } });

//         if (!existingUser) {
//             return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
//         }

//         const post = await prisma.post.findUnique({ where: { id: postId } });

//         if (!post) {
//             return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
//         }

//         const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];

//         const nouveauCommentaire = {
//             commentaireId: commentaires.length + 1,
//             userId,
//             contenu,
//             date: new Date(),
//             signalements: [],
//         };

//         const updatedCommentaires = [...commentaires, nouveauCommentaire];

//         await prisma.post.update({
//             where: { id: postId },
//             data: { commentaires: updatedCommentaires },
//         });

//         return NextResponse.json({ message: "Commentaire ajouté avec succès", commentaire: nouveauCommentaire }, { status: 201 });

//     } catch (error) {
//         console.error("Erreur lors de l'ajout du commentaire :", error);
//         return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
//     }
// }
// export async function GET(req: Request) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const postId = searchParams.get("postId");

//         if (!postId) {
//             return NextResponse.json({ error: "postId est requis" }, { status: 400 });
//         }

//         const post = await prisma.post.findUnique({ where: { id: postId } });

//         if (!post) {
//             return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
//         }

//         const commentaires = Array.isArray(post.commentaires) ? post.commentaires : [];

//         // On enrichit chaque commentaire avec le nom de l’auteur
//         const commentairesAvecNoms = await Promise.all(
//             commentaires.map(async (comment: any) => {
//               const user = await prisma.user.findUnique({ where: { id: comment.userId } });
//               return {
//                 ...comment,
//                 user: {
//                   name: user?.nom || "Utilisateur inconnu"
//                 }
//               };
//             })
//           );


//         return NextResponse.json(commentairesAvecNoms);
//     } catch (error) {
//         console.error("Erreur lors de la récupération des commentaires :", error);
//         return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
//     }
// }
