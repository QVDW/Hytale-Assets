import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "../../../../../../libs/database";
import { getCurrentUser } from "../../../../../utils/authMiddleware";

// Get unused backup codes
export async function GET(request) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });
        
        if (!dbUser.twoFactorEnabled) {
            return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
        }

        const backupCodes = dbUser.twoFactorBackupCodes || [];
        const unusedCodes = backupCodes
            .filter((bc) => !bc.used)
            .map((bc) => bc.code);

        return NextResponse.json({
            backupCodes: unusedCodes,
            total: backupCodes.length,
            unused: unusedCodes.length,
            used: backupCodes.length - unusedCodes.length
        });

    } catch (error) {
        console.error("Error getting backup codes:", error);
        return NextResponse.json(
            { error: "Failed to get backup codes" },
            { status: 500 }
        );
    }
}

// Regenerate backup codes
export async function POST(request) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { password } = await request.json();
        if (!password) {
            return NextResponse.json({ error: "Password required to regenerate backup codes" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });
        
        if (!dbUser.twoFactorEnabled) {
            return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
        }

        // Verify password
        const bcrypt = await import("bcrypt");
        const validPassword = await bcrypt.compare(password, dbUser.password);
        if (!validPassword) {
            return NextResponse.json({ error: "Invalid password" }, { status: 400 });
        }

        // Generate new backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push({
                code: code,
                used: false,
                usedAt: null
            });
        }

        // Update user with new backup codes
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorBackupCodes: backupCodes
            }
        });

        return NextResponse.json({
            message: "Backup codes regenerated successfully",
            backupCodes: backupCodes.map(bc => bc.code)
        });

    } catch (error) {
        console.error("Error regenerating backup codes:", error);
        return NextResponse.json(
            { error: "Failed to regenerate backup codes" },
            { status: 500 }
        );
    }
}
