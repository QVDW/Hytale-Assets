import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";

export async function GET(request, { params }) {
    try {
        const { asset_id } = await params;

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Fetch asset with all related data
        // Try to include overviewSections, but handle if it doesn't exist yet
        let asset;
        try {
            asset = await prisma.asset.findUnique({
                where: {
                    asset_id: asset_id
                },
                include: {
                    uploader: {
                        select: {
                            user_id: true,
                            username: true,
                            profile_picture: true
                        }
                    },
                    category: {
                        select: {
                            category_id: true,
                            name: true
                        }
                    },
                    versions: {
                        orderBy: {
                            upload_date: "desc"
                        }
                    },
                    reviews: {
                        where: {
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
                    },
                    overviewSections: {
                        orderBy: {
                            order: "asc"
                        }
                    }
                }
            });
        } catch (includeError) {
            // If overviewSections relation doesn't exist, fetch without it
            console.warn("Error including overviewSections, fetching without it:", includeError);
            asset = await prisma.asset.findUnique({
                where: {
                    asset_id: asset_id
                },
                include: {
                    uploader: {
                        select: {
                            user_id: true,
                            username: true,
                            profile_picture: true
                        }
                    },
                    category: {
                        select: {
                            category_id: true,
                            name: true
                        }
                    },
                    versions: {
                        orderBy: {
                            upload_date: "desc"
                        }
                    },
                    reviews: {
                        where: {
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
                    }
                }
            });
            // Add empty overviewSections array if it doesn't exist
            if (asset) {
                asset.overviewSections = [];
            }
        }

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Calculate average rating
        const activeReviews = asset.reviews.filter(r => r.status === "active");
        const averageRating = activeReviews.length > 0
            ? activeReviews.reduce((sum, review) => sum + review.rating, 0) / activeReviews.length
            : 0;

        return NextResponse.json({
            asset: {
                ...asset,
                averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
            }
        });

    } catch (error) {
        console.error("Error fetching asset:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            asset_id: asset_id
        });
        return NextResponse.json(
            { error: error.message || "Failed to fetch asset", details: error.stack },
            { status: 500 }
        );
    }
}

