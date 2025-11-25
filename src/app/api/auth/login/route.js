import { NextResponse } from "next/server";
import connectMongoDB from "../../../../../libs/mongodb";
import User from "../../../../../models/user";
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

        await connectMongoDB();
        console.log('MongoDB connected');

        user = await User.findOne({ mail: email });
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

        // Check if account is locked (with fallback for existing users)
        const isLocked = user.isAccountLocked ? user.isAccountLocked() : 
                        (user.loginAttempts?.lockedUntil && user.loginAttempts.lockedUntil > new Date());
        
        if (isLocked) {
            const remainingTime = user.getRemainingLockTime ? user.getRemainingLockTime() :
                                 Math.max(0, (user.loginAttempts?.lockedUntil?.getTime() || 0) - Date.now());
            console.log('Account is locked, remaining time:', remainingTime);
            
            // Log failed login attempt due to account lock
            await logLoginAttempt(email, user._id, false, 'account_locked', request);
            
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
            
            // Increment failed attempts and potentially lock account (with fallback for existing users)
            try {
                if (user.incrementFailedAttempts && typeof user.incrementFailedAttempts === 'function') {
                    await user.incrementFailedAttempts();
                    console.log('Used incrementFailedAttempts method');
                } else {
                    // Fallback for existing users without throttling fields
                    console.log('Using fallback logic for existing user');
                    
                    // Get current values directly from database using raw MongoDB operation
                    const currentData = await User.collection.findOne({ _id: user._id });
                    const currentAttempts = currentData?.loginAttempts || {
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
                        'loginAttempts.failedCount': newFailedCount,
                        'loginAttempts.totalAttempts': newTotalAttempts,
                        'loginAttempts.lastFailedAttempt': now
                    };
                    
                    // Lock account if too many attempts
                    if (newFailedCount >= 5) {
                        updateData['loginAttempts.lockedUntil'] = new Date(Date.now() + 30 * 1000);
                        updateData['loginAttempts.failedCount'] = 0; // Reset for next cycle
                        console.log('Account will be locked due to too many attempts');
                    }
                    
                    console.log(`Updating failed attempts to: ${newFailedCount}`);
                    
                    // Use direct MongoDB update to bypass Mongoose schema validation
                    await User.collection.updateOne(
                        { _id: user._id },
                        { $set: updateData }
                    );
                    
                    console.log('Direct MongoDB update completed');
                    
                    // Verify the update worked
                    const verifyData = await User.collection.findOne({ _id: user._id });
                    console.log('Verified saved loginAttempts:', JSON.stringify(verifyData?.loginAttempts));
                    
                    // Update the user object in memory for the response
                    user.loginAttempts = verifyData.loginAttempts;
                }
            } catch (saveError) {
                console.error('Error updating user login attempts:', saveError);
                // Continue without breaking login process but log for debugging
            }
            
            // Log failed login attempt
            await logLoginAttempt(email, user._id, false, 'invalid_credentials', request);
            
            // Check if account was just locked
            const remainingTime = user.getRemainingLockTime ? user.getRemainingLockTime() :
                                 Math.max(0, (user.loginAttempts?.lockedUntil?.getTime() || 0) - Date.now());
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
            const currentFailedAttempts = user.loginAttempts?.failedCount || 0;
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
                userId: user._id,
                message: "2FA verification required"
            }, { status: 200 });
        }

        console.log('Generating JWT token');
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        // Reset failed login attempts on successful login (with fallback for existing users)
        if (user.resetFailedAttempts) {
            await user.resetFailedAttempts();
        } else {
            // Fallback for existing users
            try {
                if (user.loginAttempts) {
                    user.loginAttempts.failedCount = 0;
                    user.loginAttempts.lastFailedAttempt = null;
                    user.loginAttempts.lockedUntil = null;
                    await user.save();
                }
            } catch (saveError) {
                console.error('Error resetting user login attempts:', saveError);
                // Continue without breaking login process
            }
        }

        // Create session tracking
        const session = await createSession(user._id, token, request);
        
        // Log successful login attempt
        await logLoginAttempt(email, user._id, true, null, request, session.sessionToken);

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
                await logLoginAttempt(email, user._id, false, 'server_error', request);
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