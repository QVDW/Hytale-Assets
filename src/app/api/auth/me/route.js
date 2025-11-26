import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../utils/authMiddleware";

export async function GET(request) {
    try {
        // Use auth middleware to validate both JWT and active session
        const user = await getCurrentUser(request);
        
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if developer is using simulated rank
        const simulatedRank = request.headers.get("x-simulated-rank");
        
        const response = {
            ...user,
            // Add simulated rank info for developers
            simulatedRank: (user.rank === "Developer" && simulatedRank) ? simulatedRank : null,
            isSimulating: user.rank === "Developer" && !!simulatedRank,
            canUseViewAs: user.rank === "Developer"
        };
        
        return NextResponse.json(response);
    } catch (error) {
        console.error("Error getting current user:", error);
        
        if (error.name === "JsonWebTokenError") {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
        
        if (error.name === "TokenExpiredError") {
            return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }
        
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 