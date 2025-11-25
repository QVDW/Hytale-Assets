import { NextResponse } from "next/server";
import connectMongoDB from "../../../../../libs/mongodb";
import Item from "../../../../../models/item";
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

    await connectMongoDB();
    const currentItem = await Item.findById(id);
    
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

    const updatedItem = await Item.findByIdAndUpdate(id, { 
        name, 
        category, 
        tags, 
        image: imagePath, 
        link,
        releaseDate,
        isFeatured, 
        isActive 
    }, { new: true });
    
    console.log("Updated item with releaseDate:", updatedItem.releaseDate);
    console.log("Updated item with link:", updatedItem.link);
    
    return NextResponse.json({ message: "Item updated", item: updatedItem });
}

export async function GET(request, context) {
    const { params } = context;
    const { id } = await params;

    await connectMongoDB();
    const item = await Item.findById(id);
    return NextResponse.json({ item });
}

export async function DELETE(request, context) {
    const { params } = context;
    const { id } = await params;
    
    await connectMongoDB();
    await Item.findByIdAndDelete(id);
    return NextResponse.json({message: "Item deleted"});
}