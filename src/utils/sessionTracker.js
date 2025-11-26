/**
 * Session Tracking Utility
 * Handles device detection, location information, and session management
 */

import { v4 as uuidv4 } from 'uuid';
import prisma from '../../libs/database';

// Parse User Agent for device information
export const parseUserAgent = (userAgent) => {
    if (!userAgent) {
        return {
            browser: 'Unknown',
            os: 'Unknown',
            device: 'Unknown',
            isMobile: false
        };
    }

    // Simple user agent parsing
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';
    let isMobile = false;

    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
    } else if (userAgent.includes('Edg')) {
        browser = 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browser = 'Opera';
    }

    // OS detection
    if (userAgent.includes('Windows')) {
        os = 'Windows';
    } else if (userAgent.includes('Mac OS X') || userAgent.includes('macOS')) {
        os = 'macOS';
    } else if (userAgent.includes('Linux')) {
        os = 'Linux';
    } else if (userAgent.includes('Android')) {
        os = 'Android';
        isMobile = true;
        device = 'Mobile';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        os = 'iOS';
        isMobile = true;
        device = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
    }

    // Mobile detection (additional checks)
    if (!isMobile && (userAgent.includes('Mobile') || userAgent.includes('Tablet'))) {
        isMobile = true;
        device = userAgent.includes('Tablet') ? 'Tablet' : 'Mobile';
    }

    return {
        browser,
        os,
        device,
        isMobile
    };
};

// Get location information from IP address
export const getLocationFromIP = async (ipAddress) => {
    // Default location info
    const defaultLocation = {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown',
        coordinates: {
            latitude: null,
            longitude: null
        }
    };

    // Skip location lookup for local/private IPs
    if (!ipAddress || 
        ipAddress === '127.0.0.1' || 
        ipAddress === '::1' || 
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.')) {
        return defaultLocation;
    }

    try {
        // You can use a free IP geolocation service here
        // For now, we'll return default values
        // In production, you might want to use services like:
        // - ipapi.co
        // - ipinfo.io
        // - freegeoip.app
        
        // Example implementation (commented out to avoid external dependencies):
        /*
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (response.ok) {
            const data = await response.json();
            return {
                country: data.country_name || 'Unknown',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown',
                timezone: data.timezone || 'Unknown',
                coordinates: {
                    latitude: data.latitude || null,
                    longitude: data.longitude || null
                }
            };
        }
        */
        
        return defaultLocation;
    } catch (error) {
        console.error('Error getting location from IP:', error);
        return defaultLocation;
    }
};

// Extract IP address from request
export const getClientIP = (request) => {
    // Check various headers for the real IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
        return realIp;
    }
    
    if (cfConnectingIp) {
        return cfConnectingIp;
    }
    
    // Fallback to a default (you might get this in development)
    return '127.0.0.1';
};

// Create a new session
export const createSession = async (userId, jwtToken, request) => {
    try {
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = getClientIP(request);
        
        const deviceInfo = {
            userAgent,
            ...parseUserAgent(userAgent)
        };
        
        const location = {
            ipAddress,
            ...(await getLocationFromIP(ipAddress))
        };

        // Generate unique session token
        const sessionToken = uuidv4();
        
        // Set session expiration (30 days by default, configurable)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const session = await prisma.userSession.create({
            data: {
                userId,
                sessionToken,
                jwtToken,
                deviceInfo,
                location,
                expiresAt
            }
        });

        return session;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

// Log login attempt
export const logLoginAttempt = async (email, userId, success, failureReason, request, sessionToken = null) => {
    try {
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = getClientIP(request);
        
        const deviceInfo = {
            userAgent,
            ...parseUserAgent(userAgent)
        };
        
        const location = {
            ipAddress,
            ...(await getLocationFromIP(ipAddress))
        };

        // Check for suspicious activity
        const security = await analyzeSecurity(email, userId, ipAddress, userAgent, success);

        const loginHistory = await prisma.loginHistory.create({
            data: {
                userId: userId || '',
                email,
                loginAttempt: {
                    success,
                    failureReason,
                    timestamp: new Date()
                },
                deviceInfo,
                location,
                sessionInfo: {
                    sessionToken
                },
                security
            }
        });

        return loginHistory;
    } catch (error) {
        console.error('Error logging login attempt:', error);
        throw error;
    }
};

// Analyze security risks
const analyzeSecurity = async (email, userId, ipAddress, userAgent) => {
    try {
        const security = {
            isFirstLogin: false,
            isSuspiciousActivity: false,
            suspiciousReasons: [],
            riskScore: 0
        };

        if (!userId) {
            return security;
        }

        // Check if first login - get all login histories for user and filter
        const allUserLogins = await prisma.loginHistory.findMany({
            where: { userId },
            select: { loginAttempt: true }
        });
        
        const successfulLogins = allUserLogins.filter(login => {
            const attempt = login.loginAttempt;
            return attempt && attempt.success === true;
        });
        
        security.isFirstLogin = successfulLogins.length === 0;

        // Check for multiple failed attempts
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentAttempts = await prisma.loginHistory.findMany({
            where: {
                email,
                createdAt: { gte: fifteenMinutesAgo }
            },
            select: { loginAttempt: true }
        });

        const recentFailedAttempts = recentAttempts.filter(attempt => {
            const loginAttempt = attempt.loginAttempt;
            return loginAttempt && loginAttempt.success === false;
        });

        if (recentFailedAttempts.length >= 3) {
            security.suspiciousReasons.push('multiple_failed_attempts');
            security.riskScore += 30;
        }

        // Check for unusual location
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentSuccessfulLogins = await prisma.loginHistory.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { loginAttempt: true, location: true }
        });

        const successfulRecentLogins = recentSuccessfulLogins.filter(login => {
            const attempt = login.loginAttempt;
            return attempt && attempt.success === true;
        }).slice(0, 10);

        const knownIPs = new Set(successfulRecentLogins.map(login => {
            const loc = login.location;
            return loc && loc.ipAddress;
        }).filter(Boolean));
        if (knownIPs.size > 0 && !knownIPs.has(ipAddress)) {
            security.suspiciousReasons.push('unusual_location');
            security.riskScore += 20;
        }

        // Check for unusual device
        const recentLoginsWithDevice = await prisma.loginHistory.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { loginAttempt: true, deviceInfo: true }
        });

        const successfulWithDevice = recentLoginsWithDevice.filter(login => {
            const attempt = login.loginAttempt;
            return attempt && attempt.success === true;
        }).slice(0, 10);

        const knownUserAgents = new Set(successfulWithDevice.map(login => {
            const dev = login.deviceInfo;
            return dev && dev.userAgent;
        }).filter(Boolean));
        if (knownUserAgents.size > 0 && !knownUserAgents.has(userAgent)) {
            security.suspiciousReasons.push('unusual_device');
            security.riskScore += 15;
        }

        // Check for rapid logins
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const rapidLogins = await prisma.loginHistory.findMany({
            where: {
                userId,
                createdAt: { gte: fiveMinutesAgo }
            },
            select: { loginAttempt: true }
        });

        const rapidSuccessfulLogins = rapidLogins.filter(login => {
            const attempt = login.loginAttempt;
            return attempt && attempt.success === true;
        });

        if (rapidSuccessfulLogins.length >= 3) {
            security.suspiciousReasons.push('rapid_logins');
            security.riskScore += 25;
        }

        security.isSuspiciousActivity = security.riskScore > 30 || security.suspiciousReasons.length > 2;

        return security;
    } catch (error) {
        console.error('Error analyzing security:', error);
        return {
            isFirstLogin: false,
            isSuspiciousActivity: false,
            suspiciousReasons: [],
            riskScore: 0
        };
    }
};

// Update session activity
export const updateSessionActivity = async (sessionToken) => {
    try {
        await prisma.userSession.updateMany({
            where: { 
                sessionToken, 
                isActive: true 
            },
            data: { 
                lastActivity: new Date() 
            }
        });
    } catch (error) {
        console.error('Error updating session activity:', error);
    }
};

// Validate and get session
export const getSessionByToken = async (sessionToken) => {
    try {
        const session = await prisma.userSession.findFirst({
            where: {
                sessionToken,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        mail: true,
                        rank: true
                    }
                }
            }
        });

        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
};

// Cleanup expired sessions
export const cleanupExpiredSessions = async () => {
    try {
        const now = new Date();
        const result = await prisma.userSession.updateMany({
            where: {
                isActive: true,
                expiresAt: { lt: now }
            },
            data: {
                isActive: false,
                logoutTime: now,
                logoutReason: 'token_expired'
            }
        });
        console.log(`Cleaned up ${result.count} expired sessions`);
        
        return result;
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
    }
};

const sessionTracker = {
    parseUserAgent,
    getLocationFromIP,
    getClientIP,
    createSession,
    logLoginAttempt,
    updateSessionActivity,
    getSessionByToken,
    cleanupExpiredSessions
};

export default sessionTracker; 