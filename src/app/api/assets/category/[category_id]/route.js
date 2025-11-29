import { NextResponse } from "next/server";
import prisma from "@/libs/database";

export async function GET(request, { params }) {
    try {
        const { category_id } = await params;
        const { searchParams } = new URL(request.url);
        const exclude_asset_id = searchParams.get("exclude");
        const limit = parseInt(searchParams.get("limit") || "10");

        if (!category_id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Build where clause
        const where = {
            category_id: category_id,
            status: "approved" // Only show approved assets
        };

        // Exclude the current asset if provided
        if (exclude_asset_id) {
            where.asset_id = {
                not: exclude_asset_id
            };
        }

        // Fetch assets for the specified category
        const assets = await prisma.asset.findMany({
            where,
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
            take: limit
        });

        // Shuffle the array to get random assets
        const shuffled = assets.sort(() => Math.random() - 0.5);

        return NextResponse.json({
            assets: shuffled.slice(0, limit)
        });

    } catch (error) {
        console.error("Error fetching category assets:", error);
        return NextResponse.json(
            { error: "Failed to fetch assets" },
            { status: 500 }
        );
    }
}

