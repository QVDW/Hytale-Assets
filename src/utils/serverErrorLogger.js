import connectMongoDB from "../../libs/mongodb";
import ErrorLog from "../../models/errorLog";

/**
 * Server-side error logger for API routes
 * @param {Error} error - The error object
 * @param {Request} request - The Next.js request object
 * @param {string} source - Source of the error (API route name)
 * @param {string} userId - User ID if available
 * @param {Object} additionalData - Additional metadata
 */
export async function logServerError(error, request, source = 'api-route', userId = null, additionalData = {}) {
    try {
        await connectMongoDB();

        // Extract error information
        const message = error.message || 'An unknown server error occurred';
        const stack = error.stack || error.toString();
        
        // Get request information
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
        
        // Validate userId - only set if it's a valid ObjectId
        let validUserId = null;
        if (userId) {
            try {
                if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
                    validUserId = userId;
                } else if (userId.constructor && userId.constructor.name === 'ObjectId') {
                    validUserId = userId;
                }
            } catch {
                // Invalid ObjectId, leave as null
            }
        }

        // Create error log
        const errorLog = await ErrorLog.create({
            message,
            stack,
            level: 'error',
            source,
            userId: validUserId,
            userAgent,
            ipAddress,
            url: request.url,
            method: request.method,
            resolved: false,
            tags: ['server-error', 'api-route'],
            metadata: {
                ...additionalData,
                timestamp: new Date().toISOString(),
                errorName: error.name,
                errorCode: error.code
            }
        });

        console.log(`Error logged to database with ID: ${errorLog._id}`);
        return errorLog._id;
    } catch (logError) {
        console.error('Failed to log error to database:', logError);
        return null;
    }
}

/**
 * Enhanced API error handler that logs errors and returns appropriate responses
 * @param {Error} error - The error object
 * @param {Request} request - The Next.js request object
 * @param {string} source - Source of the error
 * @param {string} userId - User ID if available
 * @param {number} statusCode - HTTP status code to return
 * @param {string} userMessage - User-friendly error message
 */
export async function handleAPIError(error, request, source = 'api-route', userId = null, userMessage = 'An error occurred') {
    // Log the error to database
    const errorLogId = await logServerError(error, request, source, userId);
    
    // Also log to console for immediate debugging
    console.error(`[${source}] Error:`, error);
    
    // Return error response
    return {
        error: userMessage,
        timestamp: new Date().toISOString(),
        errorId: errorLogId,
        ...(process.env.NODE_ENV === 'development' && { 
            details: error.message,
            stack: error.stack 
        })
    };
}

/**
 * Wrapper function for API route handlers that automatically logs errors
 * @param {Function} handler - The API route handler function
 * @param {string} source - Source identifier for the API route
 */
export function withErrorLogging(handler, source) {
    return async (request, context) => {
        try {
            return await handler(request, context);
        } catch (error) {
            // Log the error
            await logServerError(error, request, source);
            
            // Re-throw the error so it's still handled by Next.js
            throw error;
        }
    };
} 