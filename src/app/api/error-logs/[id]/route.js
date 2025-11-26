import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import { requirePermission } from "../../../../utils/authMiddleware";
import { PERMISSIONS } from "../../../../utils/permissions";
import { logServerError } from "../../../../utils/serverErrorLogger";

// PUT - Update error log (resolve/unresolve)
export async function PUT(request, { params }) {
    try {
        const user = await requirePermission(request, PERMISSIONS.VIEW_ERROR_LOGS);
        if (user instanceof NextResponse) {
            return user; // Return error response
        }

        const { id } = await params;
        const body = await request.json();
        const { resolved } = body;

        const updateData = {
            resolved: resolved === true || resolved === 'true',
            resolvedBy: resolved ? user.id : null,
            resolvedAt: resolved ? new Date() : null
        };

        const errorLog = await prisma.errorLog.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: { id: true, name: true, mail: true, rank: true }
                }
            }
        });

        if (!errorLog) {
            return NextResponse.json({ error: "Error log not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            errorLog,
            message: `Error log ${resolved ? 'resolved' : 'unresolved'} successfully`
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Error log not found" }, { status: 404 });
        }
        console.error("Error updating error log:", error);
        await logServerError(error, request, 'error-logs-put');
        return NextResponse.json({ error: "Failed to update error log" }, { status: 500 });
    }
}

// DELETE - Delete error log
export async function DELETE(request, { params }) {
    try {
        const user = await requirePermission(request, PERMISSIONS.VIEW_ERROR_LOGS);
        if (user instanceof NextResponse) {
            return user; // Return error response
        }

        const { id } = await params;

        try {
            await prisma.errorLog.delete({
                where: { id }
            });
        } catch (error) {
            if (error.code === 'P2025') {
                return NextResponse.json({ error: "Error log not found" }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ 
            success: true, 
            message: "Error log deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting error log:", error);
        await logServerError(error, request, 'error-logs-delete');
        return NextResponse.json({ error: "Failed to delete error log" }, { status: 500 });
    }
}
