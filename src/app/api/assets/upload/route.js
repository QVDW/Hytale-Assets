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

// Validate GitHub release URL
function isValidGitHubReleaseUrl(url) {
    try {
        const urlObj = new URL(url);
        // Check if it's a GitHub URL
        if (urlObj.hostname !== 'github.com' && !urlObj.hostname.endsWith('.github.com')) {
            return false;
        }
        // Check if it's a release URL (contains /releases/)
        return urlObj.pathname.includes('/releases/');
    } catch {
        return false;
    }
}

export async function POST(request) {
    try {
        // Check authentication
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        
        // Extract form fields
        const title = formData.get("title");
        const description = formData.get("description");
        const category_id = formData.get("category_id");
        const version = formData.get("version") || "1.0.0";
        const compatibility = formData.get("compatibility") || null;
        const tags = formData.get("tags") ? formData.get("tags").split(',').map(t => t.trim()).filter(t => t) : [];
        const isPromotedRaw = formData.get("isPromoted");
        const isPromoted = isPromotedRaw === "true" || isPromotedRaw === "1" || isPromotedRaw === "on";
        const githubUrl = formData.get("github_url"); // For plugins
        const mainFile = formData.get("file"); // For non-plugin assets
        const previewFile = formData.get("preview");

        // Validation
        if (!title || !description || !category_id) {
            return NextResponse.json(
                { error: "Title, description, and category are required" },
                { status: 400 }
            );
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { category_id }
        });

        if (!category) {
            return NextResponse.json(
                { error: "Invalid category" },
                { status: 400 }
            );
        }

        // Check if category is "Plugins" (or has plugins in name)
        const isPlugin = category.name.toLowerCase().includes('plugin');
        let file_url = "";

        if (isPlugin) {
            // For plugins, require GitHub URL
            if (!githubUrl || !isValidGitHubReleaseUrl(githubUrl)) {
                return NextResponse.json(
                    { error: "Valid GitHub release URL is required for plugins" },
                    { status: 400 }
                );
            }
            file_url = githubUrl;
        } else {
            // For non-plugins, require file upload
            if (!mainFile || mainFile.size === 0) {
                return NextResponse.json(
                    { error: "File upload is required for this category" },
                    { status: 400 }
                );
            }
            
            // Save main file
            try {
                const buffer = Buffer.from(await mainFile.arrayBuffer());
                const originalName = mainFile.name || "file";
                const ext = path.extname(originalName);
                const baseName = path.basename(originalName, ext);
                const fileName = `${Date.now()}-${baseName}${ext}`;
                
                const uploadDir = path.join(process.cwd(), "public", "uploads", "assets");
                await fs.mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, fileName);
                await fs.writeFile(filePath, buffer);
                file_url = `/uploads/assets/${fileName}`;
            } catch (fileError) {
                console.error("Error saving file:", fileError);
                return NextResponse.json(
                    { error: `Failed to save file: ${fileError.message}` },
                    { status: 500 }
                );
            }
        }

        // Handle preview image
        let preview_url = null;
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
                // Don't fail the upload if preview fails, just log it
                console.warn("Preview image upload failed, continuing without preview");
            }
        }

        // Create asset in database
        const asset = await prisma.asset.create({
            data: {
                uploader_id: user.user_id,
                category_id: category_id,
                title: title,
                description: description,
                file_url: file_url,
                preview_url: preview_url,
                version: version,
                tags: tags,
                status: "approved", // As per plan, initial status is approved
                compatibility: compatibility,
                download_count: 0,
                isPromoted: isPromoted
            }
        });

        // Create initial asset version
        await prisma.assetVersion.create({
            data: {
                asset_id: asset.asset_id,
                version_number: version,
                file_url: file_url,
                changelog: "Initial release"
            }
        });

        return NextResponse.json({
            message: "Asset uploaded successfully",
            asset: {
                asset_id: asset.asset_id,
                title: asset.title,
                category_id: asset.category_id
            }
        });

    } catch (error) {
        console.error("Error in POST /api/assets/upload:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload asset" },
            { status: 500 }
        );
    }
}

