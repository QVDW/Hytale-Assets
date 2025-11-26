import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import bcrypt from "bcrypt";

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, email, password, profile_picture } = body;

        // Validation
        if (!username || !email || !password || !profile_picture) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUsername = await prisma.userAccount.findUnique({
            where: { username }
        });

        if (existingUsername) {
            return NextResponse.json(
                { message: "Username already exists" },
                { status: 409 }
            );
        }

        // Check if email already exists
        const existingEmail = await prisma.userAccount.findUnique({
            where: { email }
        });

        if (existingEmail) {
            return NextResponse.json(
                { message: "Email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user account
        const userAccount = await prisma.userAccount.create({
            data: {
                username,
                email,
                hashed_password: hashedPassword,
                profile_picture,
                user_role: "regular",
                status: "active"
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                profile_picture: true,
                user_role: true,
                status: true,
                join_date: true
            }
        });

        return NextResponse.json(
            { 
                message: "Registration successful",
                user: userAccount
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: "An error occurred during registration", error: error.message },
            { status: 500 }
        );
    }
}

