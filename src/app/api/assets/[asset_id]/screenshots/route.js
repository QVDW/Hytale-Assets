import { NextResponse } from "next/server";
import prisma from "../../../../../../libs/database";
import jwt from "jsonwebtoken";

// Helper function to verify user authentication
async function getCurrentUser(request) {
    try {
        const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return null;
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }

        // Check if token is for user account
        let isUserToken = false;

        if (decoded.type === "user") {
            isUserToken = true;
        } else if (!decoded.type) {
            const userAccountCheck = await prisma.userAccount.findUnique({
                where: { user_id: decoded.userId },
                select: { user_id: true }
            });
            isUserToken = !!userAccountCheck;
        }

        if (!isUserToken) {
            return null;
        }

        // Get user account
        const userAccount = await prisma.userAccount.findUnique({
            where: { user_id: decoded.userId },
            select: {
                user_id: true,
                username: true,
                user_role: true,
                status: true
            }
        });

        if (!userAccount || userAccount.status === "banned") {
            return null;
        }

        return userAccount;
    } catch (error) {
        console.error("Error getting current user (screenshots):", error);
        return null;
    }
}

export async function GET(request, { params }) {
    try {
        const { asset_id } = await params;

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        const metadataEntries = await prisma.assetMetadata.findMany({
            where: {
                asset_id: asset_id,
                key: "screenshot"
            },
            orderBy: {
                metadata_id: "asc"
            }
        });

        const screenshots = metadataEntries.map((entry) => entry.value);

        return NextResponse.json({
            screenshots
        });
    } catch (error) {
        console.error("Error fetching screenshots:", error);
        return NextResponse.json(
            { error: "Failed to fetch screenshots" },
            { status: 500 }
        );
    }
}

export async function POST(request, { params }) {
    try {
        const { asset_id } = await params;

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Check authentication
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Fetch asset to check ownership
        const asset = await prisma.asset.findUnique({
            where: {
                asset_id: asset_id
            },
            select: {
                uploader_id: true
            }
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Check if user is owner or admin
        const isOwner = asset.uploader_id === user.user_id;
        const isAdmin = user.user_role === "admin";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized - only asset owner or admin can add screenshots" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { image_url } = body;

        if (!image_url || typeof image_url !== "string") {
            return NextResponse.json(
                { error: "image_url is required" },
                { status: 400 }
            );
        }

        // Basic validation: allow relative paths or HTTP(S) URLs
        if (
            !image_url.startsWith("/") &&
            !image_url.startsWith("http://") &&
            !image_url.startsWith("https://")
        ) {
            return NextResponse.json(
                { error: "Invalid image_url format" },
                { status: 400 }
            );
        }

        // Store screenshot reference in AssetMetadata
        await prisma.assetMetadata.create({
            data: {
                asset_id: asset_id,
                key: "screenshot",
                value: image_url
            }
        });

        // Return updated list
        const metadataEntries = await prisma.assetMetadata.findMany({
            where: {
                asset_id: asset_id,
                key: "screenshot"
            },
            orderBy: {
                metadata_id: "asc"
            }
        });

        const screenshots = metadataEntries.map((entry) => entry.value);

        return NextResponse.json({
            success: true,
            screenshots
        });
    } catch (error) {
        console.error("Error adding screenshot:", error);
        return NextResponse.json(
            { error: "Failed to add screenshot" },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const { asset_id } = await params;

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Check authentication
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Fetch asset to check ownership
        const asset = await prisma.asset.findUnique({
            where: {
                asset_id: asset_id
            },
            select: {
                uploader_id: true
            }
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Check if user is owner or admin
        const isOwner = asset.uploader_id === user.user_id;
        const isAdmin = user.user_role === "admin";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized - only asset owner or admin can reorder screenshots" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { screenshots } = body;

        if (!Array.isArray(screenshots)) {
            return NextResponse.json(
                { error: "screenshots must be an array" },
                { status: 400 }
            );
        }

        for (const url of screenshots) {
            if (typeof url !== "string" || !url.trim()) {
                return NextResponse.json(
                    { error: "All screenshot URLs must be non-empty strings" },
                    { status: 400 }
                );
            }
            if (
                !url.startsWith("/") &&
                !url.startsWith("http://") &&
                !url.startsWith("https://")
            ) {
                return NextResponse.json(
                    { error: `Invalid image_url format: ${url}` },
                    { status: 400 }
                );
            }
        }

        // Replace existing screenshot metadata with the new ordered list
        await prisma.assetMetadata.deleteMany({
            where: {
                asset_id: asset_id,
                key: "screenshot"
            }
        });

        if (screenshots.length > 0) {
            await prisma.assetMetadata.createMany({
                data: screenshots.map((url) => ({
                    asset_id: asset_id,
                    key: "screenshot",
                    value: url
                }))
            });
        }

        return NextResponse.json({
            success: true,
            screenshots
        });
    } catch (error) {
        console.error("Error updating screenshots:", error);
        return NextResponse.json(
            { error: "Failed to update screenshots" },
            { status: 500 }
        );
    }
}



