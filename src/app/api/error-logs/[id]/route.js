import { NextResponse } from "next/server";
import connectMongoDB from "../../../../../libs/mongodb";
import ErrorLog from "../../../../../models/errorLog";
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

        await connectMongoDB();

        const { id } = await params;
        const body = await request.json();
        const { resolved } = body;

        const updateData = {
            resolved: resolved === true || resolved === 'true',
            resolvedBy: resolved ? user._id : null,
            resolvedAt: resolved ? new Date() : null
        };

        const errorLog = await ErrorLog.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('userId', 'name mail rank')
         .populate('resolvedBy', 'name mail');

        if (!errorLog) {
            return NextResponse.json({ error: "Error log not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            errorLog,
            message: `Error log ${resolved ? 'resolved' : 'unresolved'} successfully`
        });
    } catch (error) {
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

        await connectMongoDB();

        const { id } = await params;

        const errorLog = await ErrorLog.findByIdAndDelete(id);

        if (!errorLog) {
            return NextResponse.json({ error: "Error log not found" }, { status: 404 });
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