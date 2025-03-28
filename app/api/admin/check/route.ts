import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json({ error: "userId est requis" }, { status: 400 }); 
        }

        const user = await prisma.user.findUnique({ where: { id: userId }});
        
        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        // Utilisez "admin" ou "ADMIN" selon ce qui est dans votre base de données
        if (user.role !== "admin") {
            return NextResponse.json({ error: "Vous n'êtes pas autorisé à accéder à cette ressource" }, { status: 403 });
        }

        // Ajoutez isAdmin pour plus de clarté dans la réponse
        return NextResponse.json({ message: "Accès autorisé", isAdmin: true });
    }
    catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}