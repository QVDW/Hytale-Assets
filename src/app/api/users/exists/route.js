import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";

export async function GET() {
    try {
        const userCount = await prisma.user.count();
        return NextResponse.json({ 
            hasUsers: userCount > 0,
            count: userCount 
        });
    } catch (error) {
        console.error("Error checking users existence:", error);
        return NextResponse.json(
            { error: "Failed to check users" }, 
            { status: 500 }
        );
    }
} 