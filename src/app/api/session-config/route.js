import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import { getCurrentUser } from "../../../utils/authMiddleware";
import { hasPermission, PERMISSIONS } from "../../../utils/permissions";

// This would typically be stored in a configuration collection
// For now, we'll use environment variables or default values
const DEFAULT_SESSION_CONFIG = {
    sessionTimeoutDays: 30,
    maxActiveSessions: 5,
    enforceLocationTracking: true,
    enableSuspiciousActivityDetection: true,
    autoLogoutOnSuspiciousActivity: false,
    requireReauthenticationHours: 24,
    cleanupExpiredSessionsIntervalHours: 1
};

export async function GET(request) {
    try {
        await connectMongoDB();
        
        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if user has permission to view session configuration
        if (!hasPermission(currentUser.rank, PERMISSIONS.CONFIGURE_SESSION_TIMEOUT)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        // In a real implementation, you would fetch this from a configuration collection
        // For now, we'll return default values with any environment overrides
        const config = {
            sessionTimeoutDays: parseInt(process.env.SESSION_TIMEOUT_DAYS) || DEFAULT_SESSION_CONFIG.sessionTimeoutDays,
            maxActiveSessions: parseInt(process.env.MAX_ACTIVE_SESSIONS) || DEFAULT_SESSION_CONFIG.maxActiveSessions,
            enforceLocationTracking: process.env.ENFORCE_LOCATION_TRACKING === 'true' || DEFAULT_SESSION_CONFIG.enforceLocationTracking,
            enableSuspiciousActivityDetection: process.env.ENABLE_SUSPICIOUS_ACTIVITY_DETECTION === 'true' || DEFAULT_SESSION_CONFIG.enableSuspiciousActivityDetection,
            autoLogoutOnSuspiciousActivity: process.env.AUTO_LOGOUT_ON_SUSPICIOUS === 'true' || DEFAULT_SESSION_CONFIG.autoLogoutOnSuspiciousActivity,
            requireReauthenticationHours: parseInt(process.env.REQUIRE_REAUTH_HOURS) || DEFAULT_SESSION_CONFIG.requireReauthenticationHours,
            cleanupExpiredSessionsIntervalHours: parseInt(process.env.CLEANUP_INTERVAL_HOURS) || DEFAULT_SESSION_CONFIG.cleanupExpiredSessionsIntervalHours
        };
        
        return NextResponse.json({ config });
        
    } catch (error) {
        console.error("Error fetching session configuration:", error);
        return NextResponse.json({ error: "Failed to fetch session configuration" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectMongoDB();
        
        const currentUser = await getCurrentUser(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        
        // Check if user has permission to configure session timeout
        if (!hasPermission(currentUser.rank, PERMISSIONS.CONFIGURE_SESSION_TIMEOUT)) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        const configUpdate = await request.json();
        
        // Validate configuration values
        const validatedConfig = validateSessionConfig(configUpdate);
        if (validatedConfig.error) {
            return NextResponse.json({ error: validatedConfig.error }, { status: 400 });
        }
        
        // In a real implementation, you would save this to a configuration collection
        // For demonstration, we'll just return the validated config
        // You could also update environment variables or a config file here
        
        console.log('Session configuration updated by:', currentUser.name);
        console.log('New configuration:', validatedConfig.config);
        
        return NextResponse.json({
            message: "Session configuration updated successfully",
            config: validatedConfig.config
        });
        
    } catch (error) {
        console.error("Error updating session configuration:", error);
        return NextResponse.json({ error: "Failed to update session configuration" }, { status: 500 });
    }
}

// Helper function to validate session configuration
function validateSessionConfig(config) {
    const validated = {};
    const errors = [];
    
    // Validate session timeout (1-365 days)
    if (config.sessionTimeoutDays !== undefined) {
        const timeoutDays = parseInt(config.sessionTimeoutDays);
        if (isNaN(timeoutDays) || timeoutDays < 1 || timeoutDays > 365) {
            errors.push("Session timeout must be between 1 and 365 days");
        } else {
            validated.sessionTimeoutDays = timeoutDays;
        }
    }
    
    // Validate max active sessions (1-50)
    if (config.maxActiveSessions !== undefined) {
        const maxSessions = parseInt(config.maxActiveSessions);
        if (isNaN(maxSessions) || maxSessions < 1 || maxSessions > 50) {
            errors.push("Max active sessions must be between 1 and 50");
        } else {
            validated.maxActiveSessions = maxSessions;
        }
    }
    
    // Validate boolean values
    if (config.enforceLocationTracking !== undefined) {
        validated.enforceLocationTracking = Boolean(config.enforceLocationTracking);
    }
    
    if (config.enableSuspiciousActivityDetection !== undefined) {
        validated.enableSuspiciousActivityDetection = Boolean(config.enableSuspiciousActivityDetection);
    }
    
    if (config.autoLogoutOnSuspiciousActivity !== undefined) {
        validated.autoLogoutOnSuspiciousActivity = Boolean(config.autoLogoutOnSuspiciousActivity);
    }
    
    // Validate reauthentication hours (1-168 hours = 1 week)
    if (config.requireReauthenticationHours !== undefined) {
        const reauthHours = parseInt(config.requireReauthenticationHours);
        if (isNaN(reauthHours) || reauthHours < 1 || reauthHours > 168) {
            errors.push("Reauthentication time must be between 1 and 168 hours");
        } else {
            validated.requireReauthenticationHours = reauthHours;
        }
    }
    
    // Validate cleanup interval (1-168 hours)
    if (config.cleanupExpiredSessionsIntervalHours !== undefined) {
        const cleanupHours = parseInt(config.cleanupExpiredSessionsIntervalHours);
        if (isNaN(cleanupHours) || cleanupHours < 1 || cleanupHours > 168) {
            errors.push("Cleanup interval must be between 1 and 168 hours");
        } else {
            validated.cleanupExpiredSessionsIntervalHours = cleanupHours;
        }
    }
    
    if (errors.length > 0) {
        return { error: errors.join(', ') };
    }
    
    return { config: validated };
} 