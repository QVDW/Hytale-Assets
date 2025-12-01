import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import { promises as fs } from "fs";
import path from "path";
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
                status: true,
                user_role: true
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

export async function GET(request, { params }) {
    const { asset_id } = await params;
    try {

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Fetch asset with all related data
        // Try to include overviewSections and metadata (for screenshots), but handle if overviewSections doesn't exist yet
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
                    },
                    metadata: true
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

        // Extract screenshots from metadata (key === "screenshot")
        const screenshots = (asset.metadata || [])
            .filter((m) => m.key === "screenshot")
            .map((m) => m.value);

        return NextResponse.json({
            asset: {
                ...asset,
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
                screenshots
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
                uploader_id: true,
                preview_url: true
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
                { error: "Unauthorized - only asset owner or admin can edit asset details" },
                { status: 403 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const title = formData.get("title");
        const description = formData.get("description");
        const category_id = formData.get("category_id");
        const version = formData.get("version");
        const compatibility = formData.get("compatibility") || null;
        const tags = formData.get("tags") ? formData.get("tags").split(',').map(t => t.trim()).filter(t => t) : [];
        const previewFile = formData.get("preview");
        const logoFile = formData.get("logo");
        const isPromotedRaw = formData.get("isPromoted");
        const hasIsPromotedField = formData.has("isPromoted");

        // Validation
        if (!title || !description) {
            return NextResponse.json(
                { error: "Title and description are required" },
                { status: 400 }
            );
        }

        // Verify category exists if provided
        if (category_id) {
            const category = await prisma.category.findUnique({
                where: { category_id }
            });

            if (!category) {
                return NextResponse.json(
                    { error: "Invalid category" },
                    { status: 400 }
                );
            }
        }

        // Handle preview image upload
        let preview_url = asset.preview_url; // Keep existing if no new file
        if (previewFile && previewFile.size > 0) {
            try {
                const buffer = Buffer.from(await previewFile.arrayBuffer());
                const originalName = previewFile.name || "preview.jpg";
                const ext = path.extname(originalName).toLowerCase();
                
                // Validate image type
                const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
                if (!allowedExtensions.includes(ext)) {
                    return NextResponse.json(
                        { error: "Preview must be an image (jpg, png, or webp)" },
                        { status: 400 }
                    );
                }
                
                const baseName = path.basename(originalName, ext);
                const fileName = `${Date.now()}-${baseName}${ext}`;
                
                const uploadDir = path.join(process.cwd(), "public", "uploads", "previews");
                await fs.mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, fileName);
                await fs.writeFile(filePath, buffer);
                preview_url = `/uploads/previews/${fileName}`;
            } catch (previewError) {
                console.error("Error saving preview:", previewError);
                return NextResponse.json(
                    { error: `Failed to save preview: ${previewError.message}` },
                    { status: 500 }
                );
            }
        }

        // Handle optional logo upload (PNG only)
        let logo_url = asset.logo_url; // Keep existing logo if no new file
        if (logoFile && logoFile.size > 0) {
            try {
                const buffer = Buffer.from(await logoFile.arrayBuffer());
                const originalName = logoFile.name || "logo.png";
                const ext = path.extname(originalName).toLowerCase();

                // Only allow PNG logos
                if (ext !== ".png") {
                    return NextResponse.json(
                        { error: "Logo must be a PNG image" },
                        { status: 400 }
                    );
                }

                const baseName = path.basename(originalName, ext);
                const fileName = `${Date.now()}-${baseName}${ext}`;

                const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
                await fs.mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, fileName);
                await fs.writeFile(filePath, buffer);
                const newLogoUrl = `/uploads/logos/${fileName}`;

                // If the old logo lived under /uploads/logos, try to delete it (best-effort)
                if (logo_url && logo_url.startsWith("/uploads/logos/")) {
                    const oldLogoPath = path.join(process.cwd(), "public", logo_url);
                    try {
                        await fs.unlink(oldLogoPath);
                    } catch (deleteError) {
                        console.warn("Could not delete old logo file:", deleteError);
                    }
                }

                logo_url = newLogoUrl;
            } catch (logoError) {
                console.error("Error saving logo:", logoError);
                return NextResponse.json(
                    { error: `Failed to save logo: ${logoError.message}` },
                    { status: 500 }
                );
            }
        }

        // Build update data
        const updateData = {
            title,
            description,
            preview_url,
            logo_url,
            tags,
            compatibility
        };

        // Only update isPromoted if field was present in the form data
        if (hasIsPromotedField) {
            updateData.isPromoted = isPromotedRaw === "true" || isPromotedRaw === "1" || isPromotedRaw === "on";
        }

        if (category_id) {
            updateData.category_id = category_id;
        }

        if (version) {
            updateData.version = version;
        }

        // Update asset
        const updatedAsset = await prisma.asset.update({
            where: {
                asset_id: asset_id
            },
            data: updateData,
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
                }
            }
        });

        return NextResponse.json({
            success: true,
            asset: updatedAsset
        });

    } catch (error) {
        console.error("Error updating asset:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update asset" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
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
                uploader_id: true,
                file_url: true,
                preview_url: true
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
                { error: "Unauthorized - only asset owner or admin can delete assets" },
                { status: 403 }
            );
        }

        // Delete associated files if they exist
        try {
            // Delete preview file if it exists and is a local file
            if (asset.preview_url && asset.preview_url.startsWith("/uploads/")) {
                const previewPath = path.join(process.cwd(), "public", asset.preview_url);
                try {
                    await fs.unlink(previewPath);
                } catch (fileError) {
                    console.warn("Could not delete preview file:", fileError);
                }
            }

            // Delete main file if it's a local file
            if (asset.file_url && asset.file_url.startsWith("/uploads/")) {
                const filePath = path.join(process.cwd(), "public", asset.file_url);
                try {
                    await fs.unlink(filePath);
                } catch (fileError) {
                    console.warn("Could not delete asset file:", fileError);
                }
            }
        } catch (fileError) {
            console.warn("Error deleting files:", fileError);
            // Continue with database deletion even if file deletion fails
        }

        // Delete asset (cascade will handle related records)
        await prisma.asset.delete({
            where: {
                asset_id: asset_id
            }
        });

        return NextResponse.json({
            success: true,
            message: "Asset deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting asset:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete asset" },
            { status: 500 }
        );
    }
}

