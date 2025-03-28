import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const range = searchParams.get("range") || "day";
    const selectedDate = searchParams.get("date");

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    // Définir la plage de dates
    let startDate: Date | undefined;
    let endDate: Date = new Date();

    if (range === "week") {
      startDate = subDays(endDate, 7);
    } else if (range === "day") {
      startDate = startOfDay(new Date(selectedDate || endDate));
      endDate = endOfDay(new Date(selectedDate || endDate));
    } else if (range === "all") {
      startDate = undefined; // Pas de limite inférieure
    }

    // Récupérer les posts de l'utilisateur
    const posts = await prisma.post.findMany({
      where: {
        userId,
        ...(startDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
    });

    // Calculer les statistiques
    let totalLikes = 0;
    let totalVues = 0;

    posts.forEach((post) => {
      const likes = Array.isArray(post.likes) ? post.likes : [];
      const vues = Array.isArray(post.vues) ? post.vues : [];
      
      // Correction des problèmes de typage
      const filteredLikes = startDate
        ? (likes as any[]).filter((like) => {
            if (like && typeof like.date === 'string') {
              const likeDate = new Date(like.date);
              return likeDate >= startDate && likeDate <= endDate;
            }
            return false;
          })
        : likes;

      const filteredVues = startDate
        ? (vues as any[]).filter((vue) => {
            if (vue && typeof vue.date === 'string') {
              const vueDate = new Date(vue.date);
              return vueDate >= startDate && vueDate <= endDate;
            }
            return false;
          })
        : vues;

      totalLikes += filteredLikes.length;
      totalVues += filteredVues.length;
    });

    return NextResponse.json({
      totalLikes,
      totalVues,
      range,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}