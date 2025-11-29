import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";

/**
 * User Search API
 * 
 * Search for frontend users (UserAccount) by user_id, username, or email
 * 
 * GET /api/user-auth/search?q=search_term
 * 
 * Returns: Array of matching users
 */

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                { error: "Search query is required" },
                { status: 400 }
            );
        }

        const searchTerm = query.trim();

        // Search by user_id, username, or email
        // user_id: exact match or contains (case-sensitive for IDs)
        // username and email: case-insensitive contains
        const users = await prisma.userAccount.findMany({
            where: {
                AND: [
                    { status: "active" }, // Only show active users
                    {
                        OR: [
                            { user_id: { contains: searchTerm } },
                            { username: { contains: searchTerm, mode: "insensitive" } },
                            { email: { contains: searchTerm, mode: "insensitive" } }
                        ]
                    }
                ]
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                user_role: true,
                join_date: true,
                last_login: true,
                profile_picture: true,
                status: true
            },
            take: 20, // Limit to 20 results
            orderBy: {
                join_date: "desc"
            }
        });

        return NextResponse.json({
            users: users,
            count: users.length
        });

    } catch (error) {
        console.error("Error searching users:", error);
        return NextResponse.json(
            { error: "Failed to search users", message: error.message },
            { status: 500 }
        );
    }
}

