import { NextResponse } from "next/server";
import prisma from "../../../../../../libs/database";

export async function GET(request, { params }) {
    try {
        const { asset_id } = await params;

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Verify asset exists
        const asset = await prisma.asset.findUnique({
            where: {
                asset_id: asset_id
            },
            select: {
                asset_id: true
            }
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Fetch active reviews for the asset
        const reviews = await prisma.review.findMany({
            where: {
                asset_id: asset_id,
                status: "active"
            },
            include: {
                user: {
                    select: {
                        user_id: true,
                        username: true,
                        profile_picture: true
                    }
                }
            },
            orderBy: {
                review_date: "desc"
            }
        });

        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({
            reviews: reviews,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            totalReviews: reviews.length
        });

    } catch (error) {
        console.error("Error fetching asset reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch asset reviews" },
            { status: 500 }
        );
    }
}

