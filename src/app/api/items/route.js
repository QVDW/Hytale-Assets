import { NextResponse } from "next/server";
import prisma from "../../../../libs/database";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const name = formData.get("name");
        const category = formData.get("category");
        const tags = formData.get("tags") ? formData.get("tags").split(',') : [];
        const image = formData.get("image");
        const link = formData.get("link") || "";
        
        let releaseDate = formData.get("releaseDate") || null;
        if (releaseDate && releaseDate.trim() !== '') {
            releaseDate = new Date(releaseDate);
        } else {
            releaseDate = null;
        }
        
        const isFeatured = formData.get("isFeatured") === "true";
        const isActive = formData.get("isActive") === "true";

        console.log("Received form data:", {
            name,
            category,
            tags,
            link,
            releaseDate,
            isFeatured,
            isActive,
            hasImage: !!image
        });

        let imagePath = "";
        if (image && image.size > 0) {
            try {
                const buffer = Buffer.from(await image.arrayBuffer());
                
                // Always ensure the filename ends with .jpg regardless of original format
                const originalName = image.name || "image.jpg";
                const baseName = path.basename(originalName, path.extname(originalName));
                const imageName = `${Date.now()}-${baseName}.jpg`;
                
                const uploadDir = path.join(process.cwd(), "public", "uploads");
                await fs.mkdir(uploadDir, { recursive: true });
                imagePath = path.join(uploadDir, imageName);
                await fs.writeFile(imagePath, buffer);
                imagePath = `/uploads/${imageName}`;
                console.log("Image saved successfully:", imagePath);
            } catch (imageError) {
                console.error("Error saving image:", imageError);
                throw new Error(`Failed to save image: ${imageError.message}`);
            }
        }

        const itemData = { 
            name, 
            category, 
            tags, 
            image: imagePath,
            link,
            releaseDate, 
            isFeatured, 
            isActive 
        };
        
        console.log("Attempting to create item with data:", itemData);

        const result = await prisma.item.create({
            data: itemData
        });
        console.log("Item created successfully:", result);
        
        return NextResponse.json({ message: "Item created", item: result });
    } catch (error) {
        console.error("Error in POST /api/items:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json(
            { error: error.message || "Failed to create item" },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sortOrder = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
    
    const items = await prisma.item.findMany({
        orderBy: [
            { releaseDate: sortOrder },
            { updatedAt: sortOrder }
        ]
    });
    
    return NextResponse.json(items);
}

export async function DELETE(request) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
        }
        
        const item = await prisma.item.findUnique({
            where: { id }
        });
        
        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }
        
        // Store image path before deletion
        const imagePath = item.image ? path.join(process.cwd(), "public", item.image) : null;
        
        // Delete database record first to maintain atomicity
        await prisma.item.delete({
            where: { id }
        });
        
        // Delete image file after successful database deletion
        if (imagePath) {
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error("Error deleting image file:", error);
                // Note: Database record is already deleted, so we log but don't fail
            }
        }
        
        return NextResponse.json({ message: "Item deleted" });
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }
        console.error("Error deleting item:", error);
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}
