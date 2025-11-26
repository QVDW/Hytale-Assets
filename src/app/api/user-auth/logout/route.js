import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // For now, logout is handled client-side by removing the token
        // This endpoint can be used for future session management
        return NextResponse.json(
            { message: "Logout successful" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

