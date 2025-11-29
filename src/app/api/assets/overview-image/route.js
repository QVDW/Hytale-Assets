import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import jwt from "jsonwebtoken";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const MAX_DIMENSION = 1000; // Maximum width or height in pixels

// Helper function to get current user from token
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
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
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
        
        const userAccount = await prisma.userAccount.findUnique({
            where: { user_id: decoded.userId },
            select: { user_id: true, user_role: true }
        });
        
        return userAccount;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

export async function POST(request) {
    try {
        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const asset_id = formData.get("asset_id");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Verify asset exists and user has permission
        const asset = await prisma.asset.findUnique({
            where: { asset_id: asset_id },
            select: { uploader_id: true }
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Check if user is owner or admin
        const isOwner = asset.uploader_id === currentUser.user_id;
        const isAdmin = currentUser.user_role === "admin";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized - only asset owner or admin can upload images" },
                { status: 403 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit." },
                { status: 400 }
            );
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get image metadata to determine dimensions
        const metadata = await sharp(buffer).metadata();
        const { width, height } = metadata;

        // Calculate new dimensions (maintain aspect ratio, max dimension = 1000px)
        let newWidth = width;
        let newHeight = height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
                newWidth = MAX_DIMENSION;
                newHeight = Math.round((height / width) * MAX_DIMENSION);
            } else {
                newHeight = MAX_DIMENSION;
                newWidth = Math.round((width / height) * MAX_DIMENSION);
            }
        }

        // Resize and convert to JPEG (for consistency)
        const resizedBuffer = await sharp(buffer)
            .resize(newWidth, newHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .toBuffer();

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `overview-${asset_id}-${timestamp}.jpg`;
        
        // Create uploads/overview-images directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "overview-images");
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Save file
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, resizedBuffer);
        
        // Generate public URL
        const publicUrl = `/uploads/overview-images/${fileName}`;

        return NextResponse.json({
            message: "Image uploaded successfully",
            image_url: publicUrl
        });

    } catch (error) {
        console.error("Error uploading overview image:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload image" },
            { status: 500 }
        );
    }
}

