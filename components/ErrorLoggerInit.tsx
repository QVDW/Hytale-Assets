"use client";

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '../src/utils/errorLogger';

export default function ErrorLoggerInit() {
    useEffect(() => {
        // Initialize global error handler when the component mounts
        setupGlobalErrorHandler();
        console.log('Global error handler initialized');
    }, []);

    // This component doesn't render anything
    return null;
} 