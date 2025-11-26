import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createSession, logLoginAttempt } from "../../../../utils/sessionTracker";

export async function POST(request) {
    let user = null;
    let email = '';
    
    try {
        const body = await request.json();
        email = body.email;
        const password = body.password;
        
        console.log('Login attempt for email:', email);

        user = await prisma.user.findUnique({
            where: { mail: email }
        });
        console.log('User found:', !!user);

        if (!user) {
            console.log('User not found in database');
            
            // Log failed login attempt
            await logLoginAttempt(email, null, false, 'user_not_found', request);
            
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Check if account is locked
        const loginAttempts = user.loginAttempts || {};
        const lockedUntil = loginAttempts.lockedUntil ? new Date(loginAttempts.lockedUntil) : null;
        const isLocked = lockedUntil && lockedUntil > new Date();
        
        if (isLocked) {
            const remainingTime = Math.max(0, lockedUntil.getTime() - Date.now());
            console.log('Account is locked, remaining time:', remainingTime);
            
            // Log failed login attempt due to account lock
            await logLoginAttempt(email, user.id, false, 'account_locked', request);
            
            return NextResponse.json(
                { 
                    message: "Account temporarily locked due to too many failed attempts",
                    isLocked: true,
                    remainingTime: Math.ceil(remainingTime / 1000) // Convert to seconds
                },
                { status: 423 } // 423 Locked status code
            );
        }

        console.log('Comparing passwords...');
        const trimmedPassword = password.trim();
        
        const validPassword = await bcrypt.compare(trimmedPassword, user.password);
        console.log('Password valid:', validPassword);

        if (!validPassword) {
            console.log('Invalid password provided');
            
            // Increment failed attempts and potentially lock account
            try {
                const currentAttempts = loginAttempts || {
                    failedCount: 0,
                    lastFailedAttempt: null,
                    lockedUntil: null,
                    totalAttempts: 0
                };
                
                console.log('Current loginAttempts from DB:', JSON.stringify(currentAttempts));
                
                // Calculate new values
                const newFailedCount = (currentAttempts.failedCount || 0) + 1;
                const newTotalAttempts = (currentAttempts.totalAttempts || 0) + 1;
                const now = new Date();
                
                let updateData = {
                    failedCount: newFailedCount,
                    totalAttempts: newTotalAttempts,
                    lastFailedAttempt: now.toISOString()
                };
                
                // Lock account if too many attempts
                if (newFailedCount >= 5) {
                    updateData.lockedUntil = new Date(Date.now() + 30 * 1000).toISOString();
                    updateData.failedCount = 0; // Reset for next cycle
                    console.log('Account will be locked due to too many attempts');
                }
                
                console.log(`Updating failed attempts to: ${newFailedCount}`);
                
                // Update user with new login attempts
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        loginAttempts: updateData
                    }
                });
                
                console.log('Login attempts update completed');
                
                // Reload user to get updated data
                user = await prisma.user.findUnique({
                    where: { id: user.id }
                });
            } catch (saveError) {
                console.error('Error updating user login attempts:', saveError);
                // Continue without breaking login process but log for debugging
            }
            
            // Log failed login attempt
            await logLoginAttempt(email, user.id, false, 'invalid_credentials', request);
            
            // Check if account was just locked
            const updatedAttempts = user.loginAttempts || {};
            const updatedLockedUntil = updatedAttempts?.lockedUntil ? new Date(updatedAttempts.lockedUntil) : null;
            const remainingTime = updatedLockedUntil ? Math.max(0, updatedLockedUntil.getTime() - Date.now()) : 0;
            
            if (remainingTime > 0) {
                return NextResponse.json(
                    { 
                        message: "Too many failed attempts. Account locked temporarily.",
                        isLocked: true,
                        remainingTime: Math.ceil(remainingTime / 1000)
                    },
                    { status: 423 }
                );
            }
            
            // Get the current failed attempts count for the response
            const currentFailedAttempts = updatedAttempts?.failedCount || 0;
            console.log(`Returning failed attempts count: ${currentFailedAttempts}`);
            
            return NextResponse.json(
                { 
                    message: "Invalid password",
                    failedAttempts: currentFailedAttempts,
                    maxAttempts: 5
                },
                { status: 401 }
            );
        }

        // Check if user has 2FA enabled
        if (user.twoFactorEnabled) {
            console.log('2FA required for user');
            
            return NextResponse.json({
                requiresTwoFactor: true,
                userId: user.id,
                message: "2FA verification required"
            }, { status: 200 });
        }

        console.log('Generating JWT token');
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        // Reset failed login attempts on successful login
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    loginAttempts: {
                        failedCount: 0,
                        lastFailedAttempt: null,
                        lockedUntil: null,
                        totalAttempts: (user.loginAttempts && user.loginAttempts.totalAttempts) || 0
                    }
                }
            });
        } catch (saveError) {
            console.error('Error resetting user login attempts:', saveError);
            // Continue without breaking login process
        }

        // Create session tracking
        const session = await createSession(user.id, token, request);
        
        // Log successful login attempt
        await logLoginAttempt(email, user.id, true, null, request, session.sessionToken);

        console.log('Login successful');
        return NextResponse.json({
            token,
            sessionToken: session.sessionToken,
            message: "Login successful"
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Log failed login attempt due to server error
        if (user && email) {
            try {
                await logLoginAttempt(email, user.id, false, 'server_error', request);
            } catch (logError) {
                console.error('Error logging failed attempt:', logError);
            }
        }
        
        return NextResponse.json(
            { message: "An error occurred", error: error.message },
            { status: 500 }
        );
    }
}
