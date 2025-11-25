import jwt from "jsonwebtoken";
import connectMongoDB from "../../libs/mongodb";
import User from "../../models/user";
import UserSession from "../../models/userSession";
import { NextResponse } from "next/server";

export async function getCurrentUser(request) {
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
        
        await connectMongoDB();
        
        // Check if there's an active session for this JWT token
        const activeSession = await UserSession.findOne({
            jwtToken: token,
            isActive: true,
            expiresAt: { $gt: new Date() }
        });
        
        // Session validation passed
        if (!activeSession) {
            // Check if session was terminated (for debugging force logout if needed)
            const inactiveSession = await UserSession.findOne({
                jwtToken: token,
                isActive: false
            });
            if (inactiveSession) {
                // Session was force logged out, return null to trigger logout
                return null;
            }
        }
        
        if (!activeSession) {
            return null;
        }
        
        // Update session activity
        await UserSession.findByIdAndUpdate(activeSession._id, {
            lastActivity: new Date()
        });
        
        const user = await User.findById(decoded.userId).select("-password");
        return user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

export async function requireAuth(request) {
    const user = await getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return user;
}

export async function requirePermission(request, permission) {
    const user = await getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const { hasPermission } = await import("./permissions");
    if (!hasPermission(user.rank, permission)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    
    return user;
}

export async function checkUserManagementPermission(request, targetUserId = null) {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const { canManageUser } = await import("./permissions");
    
    // If we have a target user, check if current user can manage them
    if (targetUserId) {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        if (!canManageUser(currentUser.rank, targetUser.rank)) {
            return NextResponse.json({ error: "Cannot manage user with higher or equal rank" }, { status: 403 });
        }
        
        return { currentUser, targetUser };
    }
    
    return { currentUser };
}

const authMiddleware = {
    getCurrentUser,
    requireAuth,
    requirePermission,
    checkUserManagementPermission
};

export default authMiddleware; 