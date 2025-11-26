import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import prisma from "../../../../../../libs/database";
import jwt from "jsonwebtoken";
import { createSession, logLoginAttempt } from "../../../../../utils/sessionTracker";

export async function POST(request) {
    try {
        const { userId, token, isBackupCode = false } = await request.json();
        
        if (!userId || !token) {
            return NextResponse.json({ error: "User ID and token required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.twoFactorEnabled) {
            return NextResponse.json({ error: "2FA not enabled for this user" }, { status: 400 });
        }

        let verified = false;

        if (isBackupCode) {
            // Verify backup code
            const backupCodes = user.twoFactorBackupCodes || [];
            const backupCode = backupCodes.find(
                (bc) => bc.code === token.toUpperCase() && !bc.used
            );

            if (backupCode) {
                verified = true;
                // Mark backup code as used
                backupCode.used = true;
                backupCode.usedAt = new Date().toISOString();
                
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        twoFactorBackupCodes: backupCodes
                    }
                });
            }
        } else {
            // Verify TOTP token
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret || '',
                encoding: 'base32',
                token: token,
                window: 2
            });
        }

        if (!verified) {
            await logLoginAttempt(user.mail, user.id, false, '2fa_failed', request);
            return NextResponse.json({ error: "Invalid 2FA code" }, { status: 400 });
        }

        // Generate JWT token for successful 2FA
        const jwtToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        // Create session tracking
        const session = await createSession(user.id, jwtToken, request);
        
        // Log successful login with 2FA
        await logLoginAttempt(user.mail, user.id, true, null, request, session.sessionToken);

        return NextResponse.json({
            token: jwtToken,
            sessionToken: session.sessionToken,
            message: "2FA verification successful"
        });

    } catch (error) {
        console.error("Error verifying 2FA:", error);
        return NextResponse.json(
            { error: "Failed to verify 2FA" },
            { status: 500 }
        );
    }
}
