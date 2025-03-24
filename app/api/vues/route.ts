import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface VueRequestBody {
  postId: string;
  userId: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { postId, userId }: VueRequestBody = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: "postId et userId sont requis" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
    }

    const vues = Array.isArray(post.vues) ? post.vues : [];

    const updatedVues = [...vues, { userId, date: new Date() }];

    await prisma.post.update({
      where: { id: postId },
      data: { vues: updatedVues },
    });

    return NextResponse.json({
      message: "Vue ajoutée"
    });

  } catch (error) {
    console.error("Erreur lors de la gestion de la vue :", error);
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

    const vues = Array.isArray(post.vues) ? post.vues : [];

    return NextResponse.json(vues);
  } catch (error) {
    console.error("Erreur lors de la récupération des vues :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
