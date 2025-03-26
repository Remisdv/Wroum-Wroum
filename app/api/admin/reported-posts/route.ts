import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const reportedPosts = await prisma.post.findMany({
      where: {
        signalements: {
          not: [],
        },
      },
      include: { user: true },
    });

    return NextResponse.json(reportedPosts);
  } catch (error) {
    console.error("Erreur lors de la récupération des posts signalés :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}