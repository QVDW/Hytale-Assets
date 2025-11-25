import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import LoginHistory from "../../../../models/loginHistory";
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
        
        let query = {};
        
        // If requesting specific user's login history, check permissions
        if (userId) {
            const targetUser = await User.findById(userId).select('rank');
            if (!targetUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            
            if (!canViewUserSessions(currentUser.rank, targetUser.rank)) {
                return NextResponse.json({ error: "Cannot view this user's login history" }, { status: 403 });
            }
            
            query.userId = userId;
        } else {
            // Get visible user ranks based on current user's permissions
            const visibleRanks = getVisibleSessionUsers(currentUser.rank);
            const visibleUsers = await User.find({ rank: { $in: visibleRanks } }).select('_id');
            query.userId = { $in: visibleUsers.map(u => u._id) };
        }
        
        // Apply filters
        if (successOnly) {
            query['loginAttempt.success'] = true;
        } else if (failedOnly) {
            query['loginAttempt.success'] = false;
        }
        
        if (suspiciousOnly) {
            query['security.isSuspiciousActivity'] = true;
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
            query['loginAttempt.timestamp'] = { $gte: since };
        }
        
        const skip = (page - 1) * limit;
        
        const loginHistory = await LoginHistory.find(query)
            .populate('userId', 'name mail rank')
            .sort({ 'loginAttempt.timestamp': -1 })
            .limit(limit)
            .skip(skip);
            
        const total = await LoginHistory.countDocuments(query);
        
        // Get summary statistics
        const stats = await LoginHistory.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    successfulLogins: {
                        $sum: { $cond: ['$loginAttempt.success', 1, 0] }
                    },
                    failedAttempts: {
                        $sum: { $cond: ['$loginAttempt.success', 0, 1] }
                    },
                    suspiciousAttempts: {
                        $sum: { $cond: ['$security.isSuspiciousActivity', 1, 0] }
                    },
                    uniqueUsers: { $addToSet: '$userId' },
                    uniqueIPs: { $addToSet: '$location.ipAddress' }
                }
            },
            {
                $project: {
                    totalAttempts: 1,
                    successfulLogins: 1,
                    failedAttempts: 1,
                    suspiciousAttempts: 1,
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    uniqueIPCount: { $size: '$uniqueIPs' },
                    successRate: {
                        $cond: [
                            { $eq: ['$totalAttempts', 0] },
                            0,
                            { $multiply: [{ $divide: ['$successfulLogins', '$totalAttempts'] }, 100] }
                        ]
                    }
                }
            }
        ]);
        
        return NextResponse.json({
            loginHistory,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: loginHistory.length,
                totalRecords: total
            },
            statistics: stats[0] || {
                totalAttempts: 0,
                successfulLogins: 0,
                failedAttempts: 0,
                suspiciousAttempts: 0,
                uniqueUserCount: 0,
                uniqueIPCount: 0,
                successRate: 0
            }
        });
        
    } catch (error) {
        console.error("Error fetching login history:", error);
        return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 });
    }
} 