import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import ErrorLog from "../../../../models/errorLog";
import { requirePermission } from "../../../utils/authMiddleware";
import { PERMISSIONS } from "../../../utils/permissions";
import { logServerError } from "../../../utils/serverErrorLogger";

// GET - Retrieve error logs (developer only)
export async function GET(request) {
    try {
        const user = await requirePermission(request, PERMISSIONS.VIEW_ERROR_LOGS);
        if (user instanceof NextResponse) {
            return user; // Return error response
        }

        await connectMongoDB();

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const level = url.searchParams.get('level');
        const resolved = url.searchParams.get('resolved');
        const source = url.searchParams.get('source');
        const search = url.searchParams.get('search');

        // Build query
        const query = {};
        if (level) query.level = level;
        if (resolved !== null && resolved !== undefined) query.resolved = resolved === 'true';
        if (source) query.source = { $regex: source, $options: 'i' };
        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { source: { $regex: search, $options: 'i' } },
                { stack: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get error logs with pagination
        const errorLogs = await ErrorLog.find(query)
            .populate('userId', 'name mail rank')
            .populate('resolvedBy', 'name mail')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalCount = await ErrorLog.countDocuments(query);

        // Get statistics
        const stats = await ErrorLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$level',
                    count: { $sum: 1 }
                }
            }
        ]);

        return NextResponse.json({
            errorLogs,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            stats: stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error("Error fetching error logs:", error);
        await logServerError(error, request, 'error-logs-get');
        return NextResponse.json({ error: "Failed to fetch error logs" }, { status: 500 });
    }
}

// POST - Create new error log
export async function POST(request) {
    try {
        await connectMongoDB();

        const body = await request.json();
        const { message, stack, level = 'error', source, userId, tags, metadata } = body;

        // Get client information
        const userAgent = request.headers.get('user-agent');
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

        // Validate userId - only set if it's a valid ObjectId
        let validUserId = null;
        if (userId) {
            try {
                // Check if it's a valid ObjectId format (24 hex characters)
                if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
                    validUserId = userId;
                }
                // If it's already an ObjectId, use it
                else if (userId.constructor.name === 'ObjectId') {
                    validUserId = userId;
                }
                // Otherwise, leave it as null (for test data like "test-user-id")
            } catch {
                // Invalid ObjectId, leave as null
            }
        }

        // Create error log
        const errorLog = await ErrorLog.create({
            message,
            stack,
            level,
            source,
            userId: validUserId,
            userAgent,
            ipAddress,
            url: request.url,
            method: 'POST',
            tags,
            metadata
        });

        return NextResponse.json({ 
            success: true, 
            errorLogId: errorLog._id,
            message: "Error logged successfully"
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating error log:", error);
        await logServerError(error, request, 'error-logs-post');
        return NextResponse.json({ error: "Failed to create error log" }, { status: 500 });
    }
}

// DELETE - Remove all error logs (developer only)
export async function DELETE(request) {
    try {
        const user = await requirePermission(request, PERMISSIONS.VIEW_ERROR_LOGS);
        if (user instanceof NextResponse) {
            return user; // Return error response
        }

        await connectMongoDB();

        const url = new URL(request.url);
        const level = url.searchParams.get('level');
        const resolved = url.searchParams.get('resolved');
        const source = url.searchParams.get('source');
        const search = url.searchParams.get('search');

        // Build query - same as GET to allow filtered deletion
        const query = {};
        if (level) query.level = level;
        if (resolved !== null && resolved !== undefined) query.resolved = resolved === 'true';
        if (source) query.source = { $regex: source, $options: 'i' };
        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { source: { $regex: search, $options: 'i' } },
                { stack: { $regex: search, $options: 'i' } }
            ];
        }

        // Delete all matching error logs
        const result = await ErrorLog.deleteMany(query);

        return NextResponse.json({ 
            success: true, 
            deletedCount: result.deletedCount,
            message: `Successfully deleted ${result.deletedCount} error log${result.deletedCount === 1 ? '' : 's'}`
        });
    } catch (error) {
        console.error("Error deleting error logs:", error);
        await logServerError(error, request, 'error-logs-delete-all');
        return NextResponse.json({ error: "Failed to delete error logs" }, { status: 500 });
    }
} 