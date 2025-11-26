import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import jwt from "jsonwebtoken";

export async function GET(request) {
    try {
        const authHeader = request.headers.get("authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];
        
        if (!token) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Check if token is for user account (not admin)
        // User tokens have type: "user", admin tokens don't have a type field
        // If token has type "user", it's definitely a user token
        // If token doesn't have type, check if userId exists in UserAccount
        let isUserToken = false;
        
        if (decoded.type === "user") {
            isUserToken = true;
        } else if (!decoded.type) {
            // Token doesn't have type - check if userId exists in UserAccount
            const userAccountCheck = await prisma.userAccount.findUnique({
                where: { user_id: decoded.userId },
                select: { user_id: true }
            });
            isUserToken = !!userAccountCheck;
        }
        
        if (!isUserToken) {
            return NextResponse.json(
                { error: "Invalid token type" },
                { status: 401 }
            );
        }

        // Get user account
        const userAccount = await prisma.userAccount.findUnique({
            where: { user_id: decoded.userId },
            select: {
                user_id: true,
                username: true,
                email: true,
                profile_picture: true,
                user_role: true,
                status: true,
                join_date: true,
                last_login: true
            }
        });

        if (!userAccount) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if account is banned
        if (userAccount.status === "banned") {
            return NextResponse.json(
                { error: "Account is banned" },
                { status: 403 }
            );
        }

        return NextResponse.json(userAccount);

    } catch (error) {
        console.error("Error getting current user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

