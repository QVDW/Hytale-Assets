import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import { promises as fs } from "fs";
import path from "path";

export async function PUT(request, context) {
    const { params } = context;
    const { id } = await params;

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

    const currentItem = await prisma.item.findUnique({
        where: { id }
    });
    
    if (!currentItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    let imagePath = currentItem.image;
    
    if (image && image.size > 0) {
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
    }

    const updatedItem = await prisma.item.update({
        where: { id },
        data: { 
            name, 
            category, 
            tags, 
            image: imagePath, 
            link,
            releaseDate,
            isFeatured, 
            isActive 
        }
    });
    
    console.log("Updated item with releaseDate:", updatedItem.releaseDate);
    console.log("Updated item with link:", updatedItem.link);
    
    return NextResponse.json({ message: "Item updated", item: updatedItem });
}

export async function GET(request, context) {
    const { params } = context;
    const { id } = await params;

    const item = await prisma.item.findUnique({
        where: { id }
    });
    
    if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    return NextResponse.json({ item });
}

export async function DELETE(request, context) {
    try {
        const { params } = context;
        const { id } = await params;
        
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
        
        return NextResponse.json({message: "Item deleted"});
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }
        console.error("Error deleting item:", error);
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}