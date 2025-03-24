import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface LikeRequestBody {
  postId: string;
  userId: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { postId, userId }: LikeRequestBody = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: "postId et userId sont requis" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
    }

    const likes = Array.isArray(post.likes) ? post.likes : [];

    const hasLiked = likes.find((like: any) => like.userId === userId);

    const updatedLikes = hasLiked
      ? likes.filter((like: any) => like.userId !== userId)
      : [...likes, { userId, date: new Date() }];

    await prisma.post.update({
      where: { id: postId },
      data: { likes: updatedLikes },
    });

    return NextResponse.json({
      message: hasLiked ? "Like retiré" : "Like ajouté"
    });

  } catch (error) {
    console.error("Erreur lors de la gestion du like :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const postId = searchParams.get("postId");
  
      if (!postId) {
        return NextResponse.json({ error: "postId est requis" }, { status: 400 });
      }
  
      const post = await prisma.post.findUnique({ where: { id: postId } });
  
      if (!post) {
        return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
      }
  
      const likes = Array.isArray(post.likes) ? post.likes : [];
  
      return NextResponse.json(likes);
    } catch (error) {
      console.error("Erreur lors de la récupération des likes :", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }
  