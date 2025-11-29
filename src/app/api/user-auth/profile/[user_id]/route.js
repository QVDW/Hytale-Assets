import { NextResponse } from "next/server";
import prisma from "../../../../../../libs/database";

export async function GET(request, { params }) {
    try {
        const { user_id } = await params;

        if (!user_id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Get user account (public profile info)
        const userAccount = await prisma.userAccount.findUnique({
            where: { user_id: user_id },
            select: {
                user_id: true,
                username: true,
                profile_picture: true,
                join_date: true,
                status: true
            }
        });

        if (!userAccount) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Don't show banned users
        if (userAccount.status === "banned") {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(userAccount);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch user profile" },
            { status: 500 }
        );
    }
}

