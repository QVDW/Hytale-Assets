import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import User from "../../../../models/user";
import Item from "../../../../models/item";
import FAQ from "../../../../models/faq";
import { requireAuth } from "../../../utils/authMiddleware";
import { getVisibleRanks } from "../../../utils/permissions";

export async function GET(request) {
    try {
        // Require authentication and active session
        const currentUser = await requireAuth(request);
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        await connectMongoDB();
        
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
        const userCount = await User.countDocuments({ rank: { $in: visibleRanks } });
        
        const totalItems = await Item.countDocuments();
        const activeItems = await Item.countDocuments({ isActive: true });
        
        const faqCount = await FAQ.countDocuments();
        
        // Also filter recent users by visible ranks  
        const recentUsers = await User.find({ rank: { $in: visibleRanks } })
            .sort({ created_at: -1 })
            .limit(2)
            .select('name created_at')
            .lean();
            
        const recentItems = await Item.find({})
            .sort({ created_at: -1 })
            .limit(2)
            .select('name created_at')
            .lean();
            
        const recentFaqs = await FAQ.find({})
            .sort({ createdAt: -1 })
            .limit(1)
            .select('question createdAt')
            .lean();
            
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
                time: formatTimeAgo(user.created_at),
                timestamp: user.created_at // Include raw timestamp for client-side processing
            })),
            ...recentItems.map(item => ({
                type: 'item',
                action: 'New item added',
                name: item.name,
                time: formatTimeAgo(item.created_at),
                timestamp: item.created_at // Include raw timestamp for client-side processing
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