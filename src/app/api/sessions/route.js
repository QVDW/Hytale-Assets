import { NextResponse } from "next/server";
import prisma from "../../../../libs/database";
import { getCurrentUser } from "../../../utils/authMiddleware";
import { hasPermission, canViewUserSessions, getVisibleSessionUsers, PERMISSIONS } from "../../../utils/permissions";

export async function GET(request) {
    try {
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
        
        let where = {};
        
        // If requesting specific user's sessions, check permissions
        if (userId) {
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { rank: true }
            });
            if (!targetUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            
            if (!canViewUserSessions(currentUser.rank, targetUser.rank)) {
                return NextResponse.json({ error: "Cannot view this user's sessions" }, { status: 403 });
            }
            
            where.userId = userId;
        } else {
            // Get visible user ranks based on current user's permissions
            const visibleRanks = getVisibleSessionUsers(currentUser.rank);
            const visibleUsers = await prisma.user.findMany({
                where: { rank: { in: visibleRanks } },
                select: { id: true }
            });
            where.userId = { in: visibleUsers.map(u => u.id) };
        }
        
        if (activeOnly) {
            where.isActive = true;
            where.expiresAt = { gt: new Date() };
        }
        
        const skip = (page - 1) * limit;
        
        const sessions = await prisma.userSession.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, mail: true, rank: true }
                }
            },
            orderBy: { lastActivity: 'desc' },
            take: limit,
            skip
        });
            
        const total = await prisma.userSession.count({ where });
        
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
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { rank: true }
            });
            if (!targetUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            
            if (!canViewUserSessions(currentUser.rank, targetUser.rank)) {
                return NextResponse.json({ error: "Cannot manage this user's sessions" }, { status: 403 });
            }
            
            const result = await prisma.userSession.updateMany({
                where: {
                    userId,
                    isActive: true
                },
                data: {
                    isActive: false,
                    logoutTime: new Date(),
                    logoutReason: 'force_logout'
                }
            });
            
            return NextResponse.json({
                message: `Logged out ${result.count} sessions`,
                loggedOutSessions: result.count
            });
            
        } else if (sessionToken) {
            // Force logout specific session
            const session = await prisma.userSession.findFirst({
                where: { sessionToken },
                include: {
                    user: {
                        select: { rank: true }
                    }
                }
            });
            
            if (!session) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            if (!canViewUserSessions(currentUser.rank, session.user.rank)) {
                return NextResponse.json({ error: "Cannot manage this user's sessions" }, { status: 403 });
            }

            // Deactivate by jwtToken since that's what auth middleware uses for validation
            await prisma.userSession.updateMany({
                where: {
                    jwtToken: session.jwtToken,
                    isActive: true
                },
                data: {
                    isActive: false,
                    logoutTime: new Date(),
                    logoutReason: 'force_logout'
                }
            });

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
