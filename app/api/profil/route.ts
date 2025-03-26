import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId est requis" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { posts: true }
        });

        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        const abonnements = typeof user.abonnements === "string" && user.abonnements.trim() !== ""
            ? JSON.parse(user.abonnements)
            : [];

        const abonnes = typeof user.abonnés === "string" && user.abonnés.trim() !== ""
            ? JSON.parse(user.abonnés)
            : [];

        const affichageprofil = {
            id: user.id,
            nom: user.nom,
            email: user.email,
            posts: user.posts.length,
            abonnements: abonnements.length,
            abonnes: abonnes.length,
            photoProfile: user.photoProfil || null,
            banniere: user.banniere || null,
        };

        return NextResponse.json(affichageprofil);

    } catch (error) {
        console.error("Erreur d'inscription :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}