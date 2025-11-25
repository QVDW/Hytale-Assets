import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import Item from "../../../../models/item";
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

        await connectMongoDB();
        console.log("MongoDB connected successfully");

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

        const result = await Item.create(itemData);
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
    await connectMongoDB();
    
    const { searchParams } = new URL(request.url);
    const sortOrder = searchParams.get('sort') === 'asc' ? 1 : -1;
    
    const items = await Item.find().sort({ 
        "releaseDate": { $exists: true },
        "releaseDate": sortOrder,
        "updated_at": sortOrder 
    });
    
    return NextResponse.json(items);
}

export async function DELETE(request) {
    const id = request.nextUrl.searchParams.get("id");
    await connectMongoDB();
    const item = await Item.findByIdAndDelete(id);
    if (item && item.image) {
        const imagePath = path.join(process.cwd(), "public", item.image);
        try {
            await fs.unlink(imagePath);
        } catch (error) {
            console.error("Error deleting image file:", error);
        }
    }
    return NextResponse.json({ message: "Item deleted" });
}
