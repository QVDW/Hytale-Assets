export async function register() {
    // Only run on server side
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { setupGlobalServerErrorHandlers, enhanceConsoleError } = await import('./src/utils/globalServerErrorHandler.js');
        
        // Initialize global error handlers
        setupGlobalServerErrorHandlers();
        enhanceConsoleError();
    }
} 