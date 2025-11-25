import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import User from "../../../../models/user";
import jwt from "jsonwebtoken";
import { getVisibleRanks, getAvailableRanks, canManageUser, hasPermission, PERMISSIONS } from "../../../utils/permissions";
import { getCurrentUser as getAuthenticatedUser } from "../../../utils/authMiddleware";

// Helper function to get current user from token (DEPRECATED - using auth middleware now)
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
        
        await connectMongoDB();
        const user = await User.findById(decoded.userId).select("-password");
        return user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

// Helper function to get effective rank (simulated or actual)
function getEffectiveRank(request, actualUser) {
    const simulatedRank = request.headers.get("x-simulated-rank");
    
    // Only allow developers to use simulated rank
    if (simulatedRank && actualUser && actualUser.rank === "Developer") {
        return simulatedRank;
    }
    
    return actualUser ? actualUser.rank : null;
}

export async function POST(request) {
    try {
        const { name, mail, password, rank: requestedRank = "Werknemer" } = await request.json();
        
        await connectMongoDB();
        
        // Check if this is the first user (no auth required)
        const existingUsers = await User.countDocuments();
        
        let finalRank = requestedRank;
        
        if (existingUsers > 0) {
            // Not the first user, check permissions
            const currentUser = await getCurrentUser(request);
            
            if (!currentUser) {
                return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            }
            
            // Use actual rank for permission checks (not simulated)
            if (!hasPermission(currentUser.rank, PERMISSIONS.ADD_USERS)) {
                return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
            }
            
            // Check if user can assign this rank (use actual rank)
            const availableRanks = getAvailableRanks(currentUser.rank);
            if (!availableRanks.includes(requestedRank)) {
                return NextResponse.json({ error: "Cannot assign this rank" }, { status: 403 });
            }
        } else {
            // First user should be Developer
            finalRank = "Developer";
        }
        
        // Validate required fields
        if (!name || !mail || !password) {
            return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
        }

        await User.create({ name, mail, password, rank: finalRank });
        return NextResponse.json({ message: "User created" });
    } catch (error) {
        console.error("Error creating user:", error);
        
        // Check if it's a password validation error
        if (error.message && error.message.includes("Password does not meet requirements")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await connectMongoDB();
        
        // Use auth middleware to validate active session
        const currentUser = await getAuthenticatedUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Get effective rank (simulated or actual)
        const effectiveRank = getEffectiveRank(request, currentUser);
        
        // Check if user has permission to view users (use actual rank)
        if (!hasPermission(currentUser.rank, PERMISSIONS.VIEW_USERS)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        // Get visible ranks for the effective rank (for ViewAs simulation)
        const visibleRanks = getVisibleRanks(effectiveRank);
        
        // Filter users based on visible ranks
        const users = await User.find({ rank: { $in: visibleRanks } }).select("-password");
        
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        
        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }
        
        await connectMongoDB();
        
        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if user has permission to delete users (use actual rank)
        if (!hasPermission(currentUser.rank, PERMISSIONS.DELETE_USERS)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        // Get the user to be deleted
        const userToDelete = await User.findById(id);
        
        if (!userToDelete) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        // Check if current user can manage the target user (use actual rank)
        if (!canManageUser(currentUser.rank, userToDelete.rank)) {
            return NextResponse.json({ error: "Cannot delete user with higher or equal rank" }, { status: 403 });
        }
        
        // Prevent self-deletion
        if (currentUser._id.toString() === id) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }
        
        await User.findByIdAndDelete(id);
        return NextResponse.json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}