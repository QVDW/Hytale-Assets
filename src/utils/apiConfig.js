// API configuration and utilities

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Utility function for making authenticated API requests
export const authenticatedFetch = async (url, options = {}) => {
    // Check if we're in browser environment before accessing localStorage
    if (typeof window === 'undefined') {
        throw new Error("authenticatedFetch can only be called on the client side");
    }
    
    const token = localStorage.getItem("token");
    
    if (!token) {
        // No token available, redirect to login
        window.location.href = "/adm/login";
        throw new Error("No authentication token");
    }

    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        
        // Handle token expiration
        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/adm/login";
            throw new Error("Token expired");
        }
        
        return response;
    } catch (error) {
        // If it's a network error and we get a 401-like response
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            localStorage.removeItem("token");
            window.location.href = "/adm/login";
        }
        throw error;
    }
};

// Helper function to construct full API URL
export const getApiUrl = (path) => {
  // Make sure path starts with '/' if not already
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Always use relative paths for consistency in both SSR and client-side
  // Next.js handles API routes internally, so relative paths work in both contexts
  return formattedPath;
};

// Helper function for image URLs
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // For upload paths, use our API route
  if (imagePath.startsWith('/uploads/')) {
    const fileName = imagePath.substring('/uploads/'.length);
    return `/api/uploads?file=${encodeURIComponent(fileName)}`;
  }
  
  return imagePath;
};
