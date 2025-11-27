import { NextResponse } from "next/server";
import prisma from "../../../../../../libs/database";
import jwt from "jsonwebtoken";

// Helper function to get current user (optional - for tracking)
async function getCurrentUser(request) {
    try {
        const authHeader = request.headers.get("authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.split(" ")[1];
        
        if (!token) {
            return null;
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }

        // Check if token is for user account
        let isUserToken = false;
        
        if (decoded.type === "user") {
            isUserToken = true;
        } else if (!decoded.type) {
            const userAccountCheck = await prisma.userAccount.findUnique({
                where: { user_id: decoded.userId },
                select: { user_id: true }
            });
            isUserToken = !!userAccountCheck;
        }
        
        if (!isUserToken) {
            return null;
        }

        // Get user account
        const userAccount = await prisma.userAccount.findUnique({
            where: { user_id: decoded.userId },
            select: {
                user_id: true,
                username: true,
                status: true
            }
        });

        if (!userAccount || userAccount.status === "banned") {
            return null;
        }

        return userAccount;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

export async function POST(request, { params }) {
    try {
        const { asset_id } = await params;

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Fetch asset
        const asset = await prisma.asset.findUnique({
            where: {
                asset_id: asset_id
            }
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Check if asset is approved
        if (asset.status !== "approved") {
            return NextResponse.json(
                { error: "Asset is not available for download" },
                { status: 403 }
            );
        }

        // Get current user (optional - for tracking)
        const user = await getCurrentUser(request);
        const clientIp = request.headers.get("x-forwarded-for") || 
                        request.headers.get("x-real-ip") || 
                        "unknown";

        // Increment download count
        await prisma.asset.update({
            where: {
                asset_id: asset_id
            },
            data: {
                download_count: {
                    increment: 1
                }
            }
        });

        // Create download record if user is authenticated
        if (user) {
            try {
                await prisma.download.create({
                    data: {
                        user_id: user.user_id,
                        asset_id: asset_id,
                        ip_address: clientIp
                    }
                });
            } catch (error) {
                // Log error but don't fail the download
                console.error("Error creating download record:", error);
            }
        }

        // Return file URL for download
        return NextResponse.json({
            success: true,
            file_url: asset.file_url,
            download_count: asset.download_count + 1
        });

    } catch (error) {
        console.error("Error processing download:", error);
        return NextResponse.json(
            { error: "Failed to process download" },
            { status: 500 }
        );
    }
}

