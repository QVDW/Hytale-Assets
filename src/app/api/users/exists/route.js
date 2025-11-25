import { NextResponse } from "next/server";
import connectMongoDB from "../../../../../libs/mongodb";
import User from "../../../../../models/user";

export async function GET() {
    try {
        await connectMongoDB();
        const userCount = await User.countDocuments();
        return NextResponse.json({ 
            hasUsers: userCount > 0,
            count: userCount 
        });
    } catch (error) {
        console.error("Error checking users existence:", error);
        return NextResponse.json(
            { error: "Failed to check users" }, 
            { status: 500 }
        );
    }
} 