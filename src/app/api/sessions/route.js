import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import UserSession from "../../../../models/userSession";
import User from "../../../../models/user";
import { getCurrentUser } from "../../../utils/authMiddleware";
import { hasPermission, canViewUserSessions, getVisibleSessionUsers, PERMISSIONS } from "../../../utils/permissions";

export async function GET(request) {
    try {
        await connectMongoDB();
        
        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if user has permission to view sessions
        if (!hasPermission(currentUser.rank, PERMISSIONS.VIEW_ALL_SESSIONS)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const page = parseInt(url.searchParams.get('page')) || 1;
        const activeOnly = url.searchParams.get('activeOnly') === 'true';
        
        let query = {};
        
        // If requesting specific user's sessions, check permissions
        if (userId) {
            const targetUser = await User.findById(userId).select('rank');
            if (!targetUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            
            if (!canViewUserSessions(currentUser.rank, targetUser.rank)) {
                return NextResponse.json({ error: "Cannot view this user's sessions" }, { status: 403 });
            }
            
            query.userId = userId;
        } else {
            // Get visible user ranks based on current user's permissions
            const visibleRanks = getVisibleSessionUsers(currentUser.rank);
            const visibleUsers = await User.find({ rank: { $in: visibleRanks } }).select('_id');
            query.userId = { $in: visibleUsers.map(u => u._id) };
        }
        
        if (activeOnly) {
            query.isActive = true;
            query.expiresAt = { $gt: new Date() };
        }
        
        const skip = (page - 1) * limit;
        
        const sessions = await UserSession.find(query)
            .populate('userId', 'name mail rank')
            .sort({ lastActivity: -1 })
            .limit(limit)
            .skip(skip);
            
        const total = await UserSession.countDocuments(query);
        
        return NextResponse.json({
            sessions,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: sessions.length,
                totalSessions: total
            }
        });
        
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        await connectMongoDB();
        
        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if user has permission to force logout
        if (!hasPermission(currentUser.rank, PERMISSIONS.FORCE_LOGOUT_USERS)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        const { sessionToken, userId, logoutAll } = await request.json();
        
        if (logoutAll && userId) {
            // Force logout all sessions for a specific user
            const targetUser = await User.findById(userId).select('rank');
            if (!targetUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            
            if (!canViewUserSessions(currentUser.rank, targetUser.rank)) {
                return NextResponse.json({ error: "Cannot manage this user's sessions" }, { status: 403 });
            }
            
            const result = await UserSession.forceLogoutUser(userId);
            
            return NextResponse.json({
                message: `Logged out ${result.modifiedCount} sessions`,
                loggedOutSessions: result.modifiedCount
            });
            
                } else if (sessionToken) {
            // Force logout specific session
            const session = await UserSession.findOne({ sessionToken }).populate('userId', 'rank');
            
            if (!session) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            if (!canViewUserSessions(currentUser.rank, session.userId.rank)) {
                return NextResponse.json({ error: "Cannot manage this user's sessions" }, { status: 403 });
            }

            // Deactivate by jwtToken since that's what auth middleware uses for validation
            await UserSession.deactivateSession(session.jwtToken, 'jwtToken');

            return NextResponse.json({
                message: "Session terminated successfully"
            });
            
        } else {
            return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
        }
        
    } catch (error) {
        console.error("Error managing sessions:", error);
        return NextResponse.json({ error: "Failed to manage sessions" }, { status: 500 });
    }
} 