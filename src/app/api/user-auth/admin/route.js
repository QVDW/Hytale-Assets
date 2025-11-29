import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";

/**
 * Frontend Admin Management API
 * 
 * This API allows you to manage admin accounts for frontend users (UserAccount model).
 * 
 * Endpoints:
 * - GET /api/user-auth/admin
 *   Returns a list of all admin accounts
 *   Response: { admins: [...], count: number }
 * 
 * - POST /api/user-auth/admin
 *   Adds a user to the admin list by user_id
 *   Body: { user_id: "user_id_here" }
 *   Response: { message: "...", user: {...} }
 * 
 * - DELETE /api/user-auth/admin
 *   Removes a user from the admin list by user_id
 *   Body: { user_id: "user_id_here" }
 *   Response: { message: "...", user: {...} }
 */

// GET: List all admin accounts
export async function GET(request) {
    try {
        // Get all admin accounts
        const adminAccounts = await prisma.userAccount.findMany({
            where: {
                user_role: "admin",
                status: "active"
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                user_role: true,
                join_date: true,
                last_login: true,
                profile_picture: true
            },
            orderBy: {
                join_date: "desc"
            }
        });

        return NextResponse.json({
            admins: adminAccounts,
            count: adminAccounts.length
        });

    } catch (error) {
        console.error("Error fetching admin accounts:", error);
        return NextResponse.json(
            { error: "Failed to fetch admin accounts", message: error.message },
            { status: 500 }
        );
    }
}

// POST: Add a user to admin list by user_id
export async function POST(request) {
    try {
        const body = await request.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        // Check if user exists
        const userAccount = await prisma.userAccount.findUnique({
            where: { user_id: user_id },
            select: {
                user_id: true,
                username: true,
                email: true,
                user_role: true,
                status: true
            }
        });

        if (!userAccount) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is already an admin
        if (userAccount.user_role === "admin") {
            return NextResponse.json(
                { 
                    error: "User is already an admin",
                    user: {
                        user_id: userAccount.user_id,
                        username: userAccount.username,
                        email: userAccount.email
                    }
                },
                { status: 400 }
            );
        }

        // Check if user is banned
        if (userAccount.status === "banned") {
            return NextResponse.json(
                { error: "Cannot make banned user an admin" },
                { status: 400 }
            );
        }

        // Update user role to admin
        const updatedUser = await prisma.userAccount.update({
            where: { user_id: user_id },
            data: { user_role: "admin" },
            select: {
                user_id: true,
                username: true,
                email: true,
                user_role: true,
                join_date: true,
                last_login: true,
                profile_picture: true
            }
        });

        return NextResponse.json({
            message: "User successfully promoted to admin",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error adding admin:", error);
        return NextResponse.json(
            { error: "Failed to add admin", message: error.message },
            { status: 500 }
        );
    }
}

// DELETE: Remove a user from admin list by user_id
export async function DELETE(request) {
    try {
        const body = await request.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        // Check if user exists
        const userAccount = await prisma.userAccount.findUnique({
            where: { user_id: user_id },
            select: {
                user_id: true,
                username: true,
                email: true,
                user_role: true,
                status: true
            }
        });

        if (!userAccount) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is already a regular user
        if (userAccount.user_role === "regular") {
            return NextResponse.json(
                { 
                    error: "User is already a regular user",
                    user: {
                        user_id: userAccount.user_id,
                        username: userAccount.username,
                        email: userAccount.email
                    }
                },
                { status: 400 }
            );
        }

        // Update user role to regular
        const updatedUser = await prisma.userAccount.update({
            where: { user_id: user_id },
            data: { user_role: "regular" },
            select: {
                user_id: true,
                username: true,
                email: true,
                user_role: true,
                join_date: true,
                last_login: true,
                profile_picture: true
            }
        });

        return NextResponse.json({
            message: "User successfully demoted from admin",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error removing admin:", error);
        return NextResponse.json(
            { error: "Failed to remove admin", message: error.message },
            { status: 500 }
        );
    }
}

