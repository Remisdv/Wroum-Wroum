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

        // Traiter les abonnements selon leur type (chaîne ou tableau)
        let abonnements = [];
        if (Array.isArray(user.abonnements)) {
            abonnements = user.abonnements;
        } else if (typeof user.abonnements === "string" && user.abonnements.trim() !== "") {
            try {
                abonnements = JSON.parse(user.abonnements);
            } catch (e) {
                console.error("Erreur lors du parsing des abonnements:", e);
            }
        }

        // Traiter les abonnés selon leur type (chaîne ou tableau)
        let abonnes = [];
        if (Array.isArray(user.abonnés)) {
            abonnes = user.abonnés;
        } else if (typeof user.abonnés === "string" && user.abonnés.trim() !== "") {
            try {
                abonnes = JSON.parse(user.abonnés);
            } catch (e) {
                console.error("Erreur lors du parsing des abonnés:", e);
            }
        }

        const affichageprofil = {
            id: user.id,
            nom: user.nom,
            email: user.email,
            bio: user.bio || null, // Ajout de la bio
            posts: user.posts.length,
            abonnements: abonnements.length,
            abonnes: abonnes.length,
            photoProfile: user.photoProfil || null,
            banniere: user.banniere || null,
        };

        return NextResponse.json(affichageprofil);

    } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}