import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const pfpDirectory = path.join(process.cwd(), "public", "pfp");
        
        // Check if directory exists
        if (!fs.existsSync(pfpDirectory)) {
            return NextResponse.json({ pictures: [] });
        }

        // Read directory contents
        const files = fs.readdirSync(pfpDirectory);

        // Filter for image files (png, jpg, jpeg, gif, webp, svg)
        const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        });

        // Sort files naturally (1.png, 2.png, 10.png instead of 1.png, 10.png, 2.png)
        imageFiles.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || "0");
            const numB = parseInt(b.match(/\d+/)?.[0] || "0");
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b);
        });

        // Convert to paths that can be used in the frontend
        const picturePaths = imageFiles.map(file => `/pfp/${file}`);

        return NextResponse.json({ pictures: picturePaths });
    } catch (error) {
        console.error("Error reading profile pictures directory:", error);
        return NextResponse.json(
            { error: "Failed to load profile pictures", pictures: [] },
            { status: 500 }
        );
    }
}

