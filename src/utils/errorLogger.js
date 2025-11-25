/**
 * Error Logger Utility
 * Provides easy methods to log errors to the database
 */



// Log levels
export const LOG_LEVELS = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    DEBUG: 'debug'
};

/**
 * Log an error to the database
 * @param {string} message - Error message
 * @param {Error|string} error - Error object or stack trace
 * @param {string} level - Log level (error, warning, info, debug)
 * @param {string} source - Source of the error (component, API route, etc.)
 * @param {string} userId - User ID if available
 * @param {Array} tags - Array of tags for categorization
 * @param {Object} metadata - Additional metadata
 */
export const logError = async (message, error = null, level = LOG_LEVELS.ERROR, source = null, userId = null, tags = [], metadata = {}) => {
    try {
        // Extract stack trace if error is an Error object
        let stack = null;
        if (error instanceof Error) {
            stack = error.stack;
            if (!message) message = error.message;
        } else if (typeof error === 'string') {
            stack = error;
        }

        // Prepare log data
        const logData = {
            message,
            stack,
            level,
            source,
            userId,
            tags,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
                url: typeof window !== 'undefined' ? window.location.href : null
            }
        };

        // Send to API
        const response = await fetch('/api/error-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData)
        });

        if (!response.ok) {
            console.error('Failed to log error to database:', response.statusText);
        }
    } catch (logError) {
        console.error('Error logging to database:', logError);
    }
};

/**
 * Log an error with ERROR level
 */
export const logErrorLevel = (message, error, source, userId, tags, metadata) => {
    return logError(message, error, LOG_LEVELS.ERROR, source, userId, tags, metadata);
};

/**
 * Log a warning
 */
export const logWarning = (message, error, source, userId, tags, metadata) => {
    return logError(message, error, LOG_LEVELS.WARNING, source, userId, tags, metadata);
};

/**
 * Log info
 */
export const logInfo = (message, error, source, userId, tags, metadata) => {
    return logError(message, error, LOG_LEVELS.INFO, source, userId, tags, metadata);
};

/**
 * Log debug information
 */
export const logDebug = (message, error, source, userId, tags, metadata) => {
    return logError(message, error, LOG_LEVELS.DEBUG, source, userId, tags, metadata);
};

/**
 * Enhanced error handler for API routes
 * Automatically logs errors and returns appropriate responses
 */
export const handleAPIError = async (error, source, userId = null, additionalData = {}) => {
    const errorMessage = error.message || 'An unknown error occurred';
    const errorStack = error.stack || error.toString();
    
    // Log the error
    await logError(
        errorMessage,
        errorStack,
        LOG_LEVELS.ERROR,
        source,
        userId,
        ['api-error'],
        {
            ...additionalData,
            errorName: error.name,
            errorCode: error.code
        }
    );

    // Return error response
    return {
        error: errorMessage,
        timestamp: new Date().toISOString()
    };
};

/**
 * Global error handler for uncaught errors
 * Should be set up in the main application
 */
export const setupGlobalErrorHandler = () => {
    if (typeof window !== 'undefined') {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            logError(
                event.message,
                event.error,
                LOG_LEVELS.ERROR,
                `${event.filename}:${event.lineno}:${event.colno}`,
                null,
                ['uncaught-error']
            );
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            logError(
                'Unhandled promise rejection',
                event.reason,
                LOG_LEVELS.ERROR,
                'promise-rejection',
                null,
                ['unhandled-promise']
            );
        });
    }
};

const errorLogger = {
    logError,
    logErrorLevel,
    logWarning,
    logInfo,
    logDebug,
    handleAPIError,
    setupGlobalErrorHandler,
    LOG_LEVELS
};

export default errorLogger; 