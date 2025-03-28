// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export async function DELETE(req: Request) {
//     try{
//         const { searchParams } = new URL(req.url);
//         const postId = searchParams.get("commentId");

//         if (!commentId) {
//             return NextResponse.json({ error: "commentId est requis" }, { status: 400 });
//         }

//         const post = await prisma.post.findUnique({ where: { id: postId } });
//     }