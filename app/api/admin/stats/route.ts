import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const reportedPostCount = await prisma.post.count({
      where: {
        signalements: {
          not: [],
        },
      },
    });

    return NextResponse.json({
      userCount,
      postCount,
      reportedPostCount,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}