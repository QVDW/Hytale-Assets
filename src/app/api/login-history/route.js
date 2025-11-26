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
        
        // Check if user has permission to view login history
        if (!hasPermission(currentUser.rank, PERMISSIONS.VIEW_LOGIN_HISTORY)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const page = parseInt(url.searchParams.get('page')) || 1;
        const successOnly = url.searchParams.get('successOnly') === 'true';
        const failedOnly = url.searchParams.get('failedOnly') === 'true';
        const suspiciousOnly = url.searchParams.get('suspiciousOnly') === 'true';
        const timeRange = url.searchParams.get('timeRange') || '7d'; // 7d, 30d, 90d, all
        
        let where = {};
        
        // If requesting specific user's login history, check permissions
        if (userId) {
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { rank: true }
            });
            if (!targetUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            
            if (!canViewUserSessions(currentUser.rank, targetUser.rank)) {
                return NextResponse.json({ error: "Cannot view this user's login history" }, { status: 403 });
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
        
        // Apply time range filter
        if (timeRange !== 'all') {
            const timeRangeMap = {
                '1d': 1 * 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                '90d': 90 * 24 * 60 * 60 * 1000
            };
            
            const since = new Date(Date.now() - (timeRangeMap[timeRange] || timeRangeMap['7d']));
            where.createdAt = { gte: since };
        }
        
        const skip = (page - 1) * limit;
        const hasJsonFilters = successOnly || failedOnly || suspiciousOnly;
        
        let loginHistory, total, filteredHistory;
        
        if (hasJsonFilters) {
            // When JSON filters are needed, fetch a reasonable batch size for filtering
            // This prevents loading all records while still allowing JSON field filtering
            const batchSize = Math.max(limit * 20, 1000); // Fetch up to 20 pages worth or 1000 records
            
            const allMatchingRecords = await prisma.loginHistory.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, mail: true, rank: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: batchSize // Limit batch size to prevent memory exhaustion
            });
            
            // Apply JSON field filters (loginAttempt.success, security.isSuspiciousActivity)
            filteredHistory = allMatchingRecords;
            
            if (successOnly) {
                filteredHistory = filteredHistory.filter(entry => {
                    const attempt = entry.loginAttempt;
                    return attempt && typeof attempt === 'object' && attempt.success === true;
                });
            } else if (failedOnly) {
                filteredHistory = filteredHistory.filter(entry => {
                    const attempt = entry.loginAttempt;
                    return attempt && typeof attempt === 'object' && attempt.success === false;
                });
            }
            
            if (suspiciousOnly) {
                filteredHistory = filteredHistory.filter(entry => {
                    const security = entry.security;
                    return security && typeof security === 'object' && security.isSuspiciousActivity === true;
                });
            }
            
            // Apply pagination after filtering
            total = filteredHistory.length;
            loginHistory = filteredHistory.slice(skip, skip + limit);
        } else {
            // No JSON filters needed - use full database-level pagination for optimal performance
            [loginHistory, total] = await Promise.all([
                prisma.loginHistory.findMany({
                    where,
                    include: {
                        user: {
                            select: { id: true, name: true, mail: true, rank: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.loginHistory.count({ where })
            ]);
            
            // For statistics calculation, fetch all matching records (not just paginated subset)
            // This ensures accurate statistics across all matching records
            filteredHistory = await prisma.loginHistory.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, mail: true, rank: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        
        // Calculate statistics from all filtered records (not just paginated subset)
        const stats = {
            totalAttempts: filteredHistory.length,
            successfulLogins: filteredHistory.filter(entry => {
                const attempt = entry.loginAttempt;
                return attempt && typeof attempt === 'object' && attempt.success === true;
            }).length,
            failedAttempts: filteredHistory.filter(entry => {
                const attempt = entry.loginAttempt;
                return attempt && typeof attempt === 'object' && attempt.success === false;
            }).length,
            suspiciousAttempts: filteredHistory.filter(entry => {
                const security = entry.security;
                return security && typeof security === 'object' && security.isSuspiciousActivity === true;
            }).length,
            uniqueUserCount: new Set(filteredHistory.map(entry => entry.userId)).size,
            uniqueIPCount: new Set(filteredHistory.map(entry => {
                const loc = entry.location;
                return loc && typeof loc === 'object' && loc.ipAddress;
            }).filter(Boolean)).size
        };
        
        stats.successRate = stats.totalAttempts > 0 
            ? (stats.successfulLogins / stats.totalAttempts) * 100 
            : 0;
        
        return NextResponse.json({
            loginHistory,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: loginHistory.length,
                totalRecords: total
            },
            statistics: stats
        });
        
    } catch (error) {
        console.error("Error fetching login history:", error);
        return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 });
    }
}
