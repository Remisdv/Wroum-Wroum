import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
 
const prisma = new PrismaClient();
 
interface LikeRequestBody {
    postId: string;
    userId: string;
}
 
export async function POST(req: Request): Promise<Response> {
    try {
        // Vérifie si le content-type est bien JSON
        const contentType = req.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json({ error: 'Format non valide, JSON requis' }, { status: 400 });
        }
 
        // Essaye de parser le JSON
        let data: LikeRequestBody;
        try {
            data = await req.json() as LikeRequestBody;
        } catch (jsonError) {
            return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
        }
 
        const { postId, userId } = data;
 
        if (!postId || !userId) {
            return NextResponse.json({ error: 'postId et userId sont requis' }, { status: 400 });
        }
 
        // Vérifie si le like existe déjà
        const existingLike = await prisma.like.findFirst({
            where: { postId, userId },
        });
 
        if (existingLike) {
            // Si le like existe, on le retire
            await prisma.like.delete({
                where: { id: existingLike.id },
            });
            return NextResponse.json({ message: 'Like retiré' });
        } else {
            // Sinon, on ajoute un nouveau like
            const newLike = await prisma.like.create({
                data: { postId, userId, date: new Date() },
            });
            return NextResponse.json({ message: 'Like ajouté', like: newLike });
        }
    } catch (error) {
        console.error('Erreur lors de la gestion du like :', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}