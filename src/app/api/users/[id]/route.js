import { NextResponse } from "next/server";
import connectMongoDB from "../../../../../libs/mongodb";
import User from "../../../../../models/user";
import jwt from "jsonwebtoken";
import { getAvailableRanks, canManageUser, hasPermission, PERMISSIONS } from "../../../../utils/permissions";

// Helper function to get current user from token
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

export async function PUT(request, { params }) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const id = resolvedParams.id;
        
        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        const { name, email: mail, password, rank } = await request.json();
        await connectMongoDB();

        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if user has permission to edit users
        if (!hasPermission(currentUser.rank, PERMISSIONS.EDIT_USERS)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        // Get the user to be updated
        const userToUpdate = await User.findById(id);
        
        if (!userToUpdate) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        // Check if current user can manage the target user
        if (!canManageUser(currentUser.rank, userToUpdate.rank)) {
            return NextResponse.json({ error: "Cannot edit user with higher or equal rank" }, { status: 403 });
        }

        const updateData = {
            name,
            mail
        };

        // Handle rank update if provided
        if (rank && rank !== userToUpdate.rank) {
            const availableRanks = getAvailableRanks(currentUser.rank);
            if (!availableRanks.includes(rank)) {
                return NextResponse.json({ error: "Cannot assign this rank" }, { status: 403 });
            }
            updateData.rank = rank;
        }

        // Handle password update if provided
        if (password) {
            // Let the User model handle password validation and hashing
            updateData.password = password;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");
        
        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        return NextResponse.json({ 
            message: "User updated successfully", 
            user: updatedUser 
        });
    } catch (error) {
        console.error("Update error:", error);
        
        // Check if it's a password validation error
        if (error.message && error.message.includes("Password does not meet requirements")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const id = resolvedParams.id;

        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        await connectMongoDB();
        
        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if user has permission to view users
        if (!hasPermission(currentUser.rank, PERMISSIONS.VIEW_USERS)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        const user = await User.findById(id).select("-password");
        
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        // Check if current user can view the target user
        if (!canManageUser(currentUser.rank, user.rank)) {
            return NextResponse.json({ error: "Cannot view user with higher rank" }, { status: 403 });
        }
        
        return NextResponse.json(user);
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}