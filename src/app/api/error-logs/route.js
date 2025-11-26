import { NextResponse } from "next/server";
import prisma from "../../../../libs/database";
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

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const level = url.searchParams.get('level');
        const resolved = url.searchParams.get('resolved');
        const source = url.searchParams.get('source');
        const search = url.searchParams.get('search');

        // Build query
        const where = {};
        if (level) where.level = level;
        if (resolved !== null && resolved !== undefined) where.resolved = resolved === 'true';
        if (source) where.source = { contains: source, mode: 'insensitive' };
        if (search) {
            where.OR = [
                { message: { contains: search, mode: 'insensitive' } },
                { source: { contains: search, mode: 'insensitive' } },
                { stack: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get error logs with pagination
        const errorLogs = await prisma.errorLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, mail: true, rank: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        // Get total count for pagination
        const totalCount = await prisma.errorLog.count({ where });

        // Get statistics
        const statsResult = await prisma.errorLog.groupBy({
            by: ['level'],
            where,
            _count: {
                level: true
            }
        });

        const stats = statsResult.reduce((acc, stat) => {
            acc[stat.level] = stat._count.level;
            return acc;
        }, {});

        return NextResponse.json({
            errorLogs,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            stats
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
        const body = await request.json();
        const { message, stack, level = 'error', source, userId, tags, metadata } = body;

        // Get client information
        const userAgent = request.headers.get('user-agent');
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

        // Validate userId
        let validUserId = null;
        if (userId && typeof userId === 'string' && userId.length > 0) {
            validUserId = userId;
        }

        // Create error log
        const errorLog = await prisma.errorLog.create({
            data: {
                message,
                stack,
                level,
                source,
                userId: validUserId,
                userAgent,
                ipAddress,
                url: request.url,
                method: 'POST',
                tags: tags || [],
                metadata: metadata || {}
            }
        });

        return NextResponse.json({ 
            success: true, 
            errorLogId: errorLog.id,
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

        const url = new URL(request.url);
        const level = url.searchParams.get('level');
        const resolved = url.searchParams.get('resolved');
        const source = url.searchParams.get('source');
        const search = url.searchParams.get('search');

        // Build query - same as GET to allow filtered deletion
        const where = {};
        if (level) where.level = level;
        if (resolved !== null && resolved !== undefined) where.resolved = resolved === 'true';
        if (source) where.source = { contains: source, mode: 'insensitive' };
        if (search) {
            where.OR = [
                { message: { contains: search, mode: 'insensitive' } },
                { source: { contains: search, mode: 'insensitive' } },
                { stack: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Delete all matching error logs
        const result = await prisma.errorLog.deleteMany({ where });

        return NextResponse.json({ 
            success: true, 
            deletedCount: result.count,
            message: `Successfully deleted ${result.count} error log${result.count === 1 ? '' : 's'}`
        });
    } catch (error) {
        console.error("Error deleting error logs:", error);
        await logServerError(error, request, 'error-logs-delete-all');
        return NextResponse.json({ error: "Failed to delete error logs" }, { status: 500 });
    }
}
