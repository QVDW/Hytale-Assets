import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user by email or username
        const userAccount = await prisma.userAccount.findFirst({
            where: {
                OR: [
                    { email },
                    { username: email }
                ]
            }
        });

        if (!userAccount) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if account is banned
        if (userAccount.status === "banned") {
            return NextResponse.json(
                { message: "Account is banned" },
                { status: 403 }
            );
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, userAccount.hashed_password);

        if (!validPassword) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Update last login
        await prisma.userAccount.update({
            where: { user_id: userAccount.user_id },
            data: { last_login: new Date() }
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: userAccount.user_id, type: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        // Return user data (without password)
        const userData = {
            user_id: userAccount.user_id,
            username: userAccount.username,
            email: userAccount.email,
            profile_picture: userAccount.profile_picture,
            user_role: userAccount.user_role,
            status: userAccount.status,
            join_date: userAccount.join_date,
            last_login: new Date()
        };

        return NextResponse.json({
            token,
            user: userData,
            message: "Login successful"
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: "An error occurred during login", error: error.message },
            { status: 500 }
        );
    }
}

