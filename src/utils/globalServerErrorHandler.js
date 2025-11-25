import connectMongoDB from "../../libs/mongodb";
import ErrorLog from "../../models/errorLog";

/**
 * Log server error without request context (for global handlers)
 */
async function logGlobalServerError(error, source = 'global-server', additionalData = {}) {
    try {
        await connectMongoDB();

        const message = error.message || 'An unknown server error occurred';
        const stack = error.stack || error.toString();

        const errorLog = await ErrorLog.create({
            message,
            stack,
            level: 'error',
            source,
            userAgent: 'server',
            ipAddress: 'server',
            url: 'server',
            method: 'SERVER',
            resolved: false,
            tags: ['server-error', 'global-handler'],
            metadata: {
                ...additionalData,
                timestamp: new Date().toISOString(),
                errorName: error.name,
                errorCode: error.code,
                nodeVersion: process.version,
                platform: process.platform
            }
        });

        console.log(`Global server error logged to database with ID: ${errorLog._id}`);
        return errorLog._id;
    } catch (logError) {
        console.error('Failed to log global server error to database:', logError);
        return null;
    }
}

/**
 * Setup global error handlers for the server
 */
export function setupGlobalServerErrorHandlers() {
    // Only setup in server environment
    if (typeof window !== 'undefined') {
        return;
    }

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught Exception:', error);
        await logGlobalServerError(error, 'uncaught-exception', {
            type: 'uncaughtException'
        });
        // Don't exit the process in development, but log that we should
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        const error = reason instanceof Error ? reason : new Error(String(reason));
        await logGlobalServerError(error, 'unhandled-rejection', {
            type: 'unhandledRejection',
            reason: String(reason)
        });
    });

    // Handle warning events (including Next.js warnings and errors)
    process.on('warning', async (warning) => {
        // Only log Next.js related warnings and errors
        if (warning.name === 'NextjsWarning' || 
            warning.message.includes('params') || 
            warning.message.includes('Route') ||
            warning.message.includes('next')) {
            console.warn('Process Warning:', warning);
            await logGlobalServerError(warning, 'process-warning', {
                type: 'processWarning',
                warningName: warning.name,
                warningCode: warning.code
            });
        }
    });


}

/**
 * Enhanced console.error that also logs to database
 */
export function enhanceConsoleError() {
    if (typeof window !== 'undefined') {
        return; // Only run on server
    }

    const originalConsoleError = console.error;
    
    console.error = async function(...args) {
        // Call original console.error first
        originalConsoleError.apply(console, args);
        
        // Try to extract error information and log to database
        const errorInfo = args.find(arg => arg instanceof Error) || 
                         (args.length > 0 && typeof args[0] === 'string' ? new Error(args.join(' ')) : null);
        
        if (errorInfo) {
            // Check if this looks like a Next.js framework error
            const message = args.join(' ');
            
            if (message.includes('params') || 
                message.includes('Route') || 
                message.includes('used `') ||
                message.includes('should be awaited') ||
                message.includes('nextjs.org/docs/messages') ||
                message.includes('NextjsWarning')) {
                
                try {
                    await logGlobalServerError(errorInfo, 'console-error-nextjs', {
                        type: 'consoleError',
                        fullMessage: message,
                        args: args.map(arg => String(arg))
                    });
                } catch (logError) {
                    console.error('Failed to log console error to database:', logError);
                }
            }
        }
    };
}

const globalServerErrorHandler = {
    setupGlobalServerErrorHandlers,
    enhanceConsoleError,
    logGlobalServerError
};

export default globalServerErrorHandler; 