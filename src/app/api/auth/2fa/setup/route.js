import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import prisma from "../../../../../../libs/database";
import { getCurrentUser } from "../../../../../utils/authMiddleware";

// Generate TOTP secret and QR code
export async function POST(request) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Generate a new TOTP secret
        const secret = speakeasy.generateSecret({
            name: `ADM (${user.mail})`,
            issuer: 'ADM System'
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Store the temporary secret (not yet enabled)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorSecret: secret.base32,
                twoFactorEnabled: false,
                twoFactorSetupCompleted: false
            }
        });

        return NextResponse.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32,
            message: "2FA setup initiated. Please verify with your authenticator app."
        });

    } catch (error) {
        console.error("Error setting up 2FA:", error);
        return NextResponse.json(
            { error: "Failed to setup 2FA" },
            { status: 500 }
        );
    }
}

// Verify TOTP and enable 2FA
export async function PUT(request) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { token } = await request.json();
        if (!token) {
            return NextResponse.json({ error: "TOTP token required" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });
        
        if (!dbUser.twoFactorSecret) {
            return NextResponse.json({ error: "2FA setup not initiated" }, { status: 400 });
        }

        // Verify the TOTP token
        const verified = speakeasy.totp.verify({
            secret: dbUser.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return NextResponse.json({ error: "Invalid TOTP token" }, { status: 400 });
        }

        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push({
                code: code,
                used: false,
                usedAt: null
            });
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: true,
                twoFactorSetupCompleted: true,
                twoFactorBackupCodes: backupCodes
            }
        });

        return NextResponse.json({
            message: "2FA enabled successfully",
            backupCodes: backupCodes.map(bc => bc.code)
        });

    } catch (error) {
        console.error("Error verifying 2FA setup:", error);
        return NextResponse.json(
            { error: "Failed to verify 2FA setup" },
            { status: 500 }
        );
    }
}

// Disable 2FA
export async function DELETE(request) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { password } = await request.json();
        if (!password) {
            return NextResponse.json({ error: "Password required to disable 2FA" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });
        
        // Verify password
        const bcrypt = await import("bcrypt");
        const validPassword = await bcrypt.compare(password, dbUser.password);
        if (!validPassword) {
            return NextResponse.json({ error: "Invalid password" }, { status: 400 });
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorSecret: null,
                twoFactorEnabled: false,
                twoFactorSetupCompleted: false,
                twoFactorBackupCodes: []
            }
        });

        return NextResponse.json({
            message: "2FA disabled successfully"
        });

    } catch (error) {
        console.error("Error disabling 2FA:", error);
        return NextResponse.json(
            { error: "Failed to disable 2FA" },
            { status: 500 }
        );
    }
}
