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
        console.error("Error getting current user:", error);
        return null;
    }
}

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
}

// Validate section content based on type
function validateSectionContent(type, content) {
    if (!content || content.trim().length === 0) {
        return { valid: false, error: "Content cannot be empty" };
    }

    switch (type) {
        case "image":
            // Accept both absolute URLs and relative paths
            if (content.startsWith("/") || content.startsWith("http://") || content.startsWith("https://")) {
                return { valid: true };
            }
            // Try to validate as URL
            try {
                new URL(content);
                return { valid: true };
            } catch {
                return { valid: false, error: "Invalid image URL" };
            }
        case "youtube":
            if (!isValidYouTubeUrl(content)) {
                return { valid: false, error: "Invalid YouTube URL" };
            }
            return { valid: true };
        case "text":
            if (content.length > 10000) {
                return { valid: false, error: "Text content too long (max 10000 characters)" };
            }
            return { valid: true };
        default:
            return { valid: false, error: "Invalid section type" };
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

        // Fetch overview sections
        const sections = await prisma.assetOverviewSection.findMany({
            where: {
                asset_id: asset_id
            },
            orderBy: {
                order: "asc"
            }
        });

        return NextResponse.json({
            sections: sections
        });

    } catch (error) {
        console.error("Error fetching overview sections:", error);
        return NextResponse.json(
            { error: "Failed to fetch overview sections" },
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
                { error: "Unauthorized - only asset owner or admin can edit overview sections" },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { sections } = body;

        if (!Array.isArray(sections)) {
            return NextResponse.json(
                { error: "Sections must be an array" },
                { status: 400 }
            );
        }

        // Validate all sections
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            
            if (!section.section_type || !["image", "youtube", "text"].includes(section.section_type)) {
                return NextResponse.json(
                    { error: `Invalid section type at index ${i}` },
                    { status: 400 }
                );
            }

            const validation = validateSectionContent(section.section_type, section.content);
            if (!validation.valid) {
                return NextResponse.json(
                    { error: `Validation error at index ${i}: ${validation.error}` },
                    { status: 400 }
                );
            }
        }

        // Delete existing sections
        await prisma.assetOverviewSection.deleteMany({
            where: {
                asset_id: asset_id
            }
        });

        // Create new sections
        const createdSections = await prisma.assetOverviewSection.createMany({
            data: sections.map((section, index) => ({
                asset_id: asset_id,
                section_type: section.section_type,
                content: section.content,
                order: section.order !== undefined ? section.order : index
            }))
        });

        // Fetch updated sections
        const updatedSections = await prisma.assetOverviewSection.findMany({
            where: {
                asset_id: asset_id
            },
            orderBy: {
                order: "asc"
            }
        });

        return NextResponse.json({
            success: true,
            sections: updatedSections
        });

    } catch (error) {
        console.error("Error updating overview sections:", error);
        return NextResponse.json(
            { error: "Failed to update overview sections" },
            { status: 500 }
        );
    }
}

