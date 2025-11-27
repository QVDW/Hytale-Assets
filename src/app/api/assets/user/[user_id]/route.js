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

        // Fetch assets for the specified user
        const assets = await prisma.asset.findMany({
            where: {
                uploader_id: user_id,
                status: "approved" // Only show approved assets
            },
            include: {
                category: {
                    select: {
                        category_id: true,
                        name: true
                    }
                },
                uploader: {
                    select: {
                        user_id: true,
                        username: true,
                        profile_picture: true
                    }
                }
            },
            orderBy: {
                upload_date: "desc"
            }
        });

        return NextResponse.json({
            assets: assets
        });

    } catch (error) {
        console.error("Error fetching user assets:", error);
        return NextResponse.json(
            { error: "Failed to fetch assets" },
            { status: 500 }
        );
    }
}

