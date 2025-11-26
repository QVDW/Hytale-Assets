import { NextResponse } from "next/server";
import prisma from "../../../../libs/database";
import { requireAuth } from "../../../utils/authMiddleware";
import { getVisibleRanks } from "../../../utils/permissions";

export async function GET(request) {
    try {
        // Require authentication and active session
        const currentUser = await requireAuth(request);
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Get effective rank (simulated or actual) - same logic as users API
        function getEffectiveRank(request, actualUser) {
            const simulatedRank = request.headers.get("x-simulated-rank");
            
            // Only allow developers to use simulated rank
            if (simulatedRank && actualUser && actualUser.rank === "Developer") {
                return simulatedRank;
            }
            
            return actualUser ? actualUser.rank : null;
        }
        
        const effectiveRank = getEffectiveRank(request, currentUser);
        
        // Get visible ranks for the effective rank (consistent with users panel)
        const visibleRanks = getVisibleRanks(effectiveRank);
        
        // Filter user count based on visible ranks (consistent with users panel)
        const userCount = await prisma.user.count({
            where: { rank: { in: visibleRanks } }
        });
        
        const totalItems = await prisma.item.count();
        const activeItems = await prisma.item.count({
            where: { isActive: true }
        });
        
        const faqCount = await prisma.faq.count();
        
        // Also filter recent users by visible ranks  
        const recentUsers = await prisma.user.findMany({
            where: { rank: { in: visibleRanks } },
            orderBy: { createdAt: 'desc' },
            take: 2,
            select: { name: true, createdAt: true }
        });
            
        const recentItems = await prisma.item.findMany({
            orderBy: { createdAt: 'desc' },
            take: 2,
            select: { name: true, createdAt: true }
        });
            
        const recentFaqs = await prisma.faq.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { question: true, createdAt: true }
        });
            
        // Fix: Capture a single timestamp for consistency
        const requestTime = new Date();
        
        const formatTimeAgo = (date) => {
            const diffInSeconds = Math.floor((requestTime - new Date(date)) / 1000);
            
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
            return `${Math.floor(diffInSeconds / 86400)} days ago`;
        };
        
        const recentActivity = [
            ...recentUsers.map(user => ({
                type: 'user',
                action: 'New user registered',
                name: user.name,
                time: formatTimeAgo(user.createdAt),
                timestamp: user.createdAt // Include raw timestamp for client-side processing
            })),
            ...recentItems.map(item => ({
                type: 'item',
                action: 'New item added',
                name: item.name,
                time: formatTimeAgo(item.createdAt),
                timestamp: item.createdAt // Include raw timestamp for client-side processing
            })),
            ...recentFaqs.map(faq => ({
                type: 'question',
                action: 'New question added',
                name: faq.question,
                time: formatTimeAgo(faq.createdAt),
                timestamp: faq.createdAt // Include raw timestamp for client-side processing
            }))
        ].sort((a, b) => {
            // Sort by actual timestamp for more consistent ordering
            return new Date(b.timestamp) - new Date(a.timestamp);
        }).slice(0, 4);
        
        return NextResponse.json({
            stats: {
                totalUsers: userCount,
                totalItems,
                activeItems,
                totalQuestions: faqCount
            },
            recentActivity,
            serverTimestamp: requestTime.toISOString() // Include server timestamp for reference
        });
    } catch (error) {
        console.error("Dashboard data fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
} 