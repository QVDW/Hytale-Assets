import { NextResponse } from "next/server";
import prisma from "../../../../libs/database";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category_id = searchParams.get("category_id");
        const sort = searchParams.get("sort") || "downloads"; // downloads, date, rating
        const order = searchParams.get("order") || "desc"; // asc, desc
        const isPromotedParam = searchParams.get("isPromoted");
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : undefined;

        // Build where clause
        const where = {
            status: "approved" // Only show approved assets
        };

        // Add category filter if provided
        if (category_id) {
            where.category_id = category_id;
        }

        // Add promoted filter if provided
        if (isPromotedParam === "true") {
            where.isPromoted = true;
        } else if (isPromotedParam === "false") {
            where.isPromoted = false;
        }

        // Build orderBy clause based on sort parameter
        let orderBy = {};
        if (sort === "downloads") {
            orderBy = { download_count: order };
        } else if (sort === "date") {
            orderBy = { upload_date: order };
        } else if (sort === "rating") {
            // For rating, we'll need to calculate it and sort in memory
            // For now, we'll fetch all and sort by rating after calculating
            orderBy = { upload_date: "desc" }; // Temporary, will sort after
        } else {
            // Default to downloads desc
            orderBy = { download_count: "desc" };
        }

        // Fetch assets
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
                },
                reviews: {
                    where: {
                        status: "active"
                    },
                    select: {
                        rating: true
                    }
                }
            },
            orderBy: sort === "rating" ? { upload_date: "desc" } : orderBy,
            take: limit
        });

        // Calculate average rating for each asset
        const assetsWithRating = assets.map(asset => {
            const activeReviews = asset.reviews || [];
            const averageRating = activeReviews.length > 0
                ? activeReviews.reduce((sum, review) => sum + review.rating, 0) / activeReviews.length
                : 0;

            // Remove reviews from response, we only needed them for calculation
            const { reviews, ...assetWithoutReviews } = asset;

            return {
                ...assetWithoutReviews,
                averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
            };
        });

        // Sort by rating if needed (since Prisma can't easily sort by aggregated values)
        if (sort === "rating") {
            assetsWithRating.sort((a, b) => {
                if (order === "asc") {
                    return a.averageRating - b.averageRating;
                } else {
                    return b.averageRating - a.averageRating;
                }
            });
        }

        return NextResponse.json({
            assets: assetsWithRating
        });

    } catch (error) {
        console.error("Error fetching assets:", error);
        return NextResponse.json(
            { error: "Failed to fetch assets" },
            { status: 500 }
        );
    }
}

