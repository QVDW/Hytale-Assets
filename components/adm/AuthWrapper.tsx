"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

const AuthWrapper = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        const validateAuth = async () => {
            // Ensure we're on the client side before accessing localStorage
            if (typeof window === 'undefined') return;
            
            const token = localStorage.getItem("token");
            
            if (!token) {
                router.push("/adm/login");
                return;
            }

            try {
                // Validate token with server
                const response = await fetch("/api/auth/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    // Token is expired or invalid
                    localStorage.removeItem("token");
                    router.push("/adm/login");
                    return;
                }

                if (!response.ok) {
                    localStorage.removeItem("token");
                    router.push("/adm/login");
                    return;
                }

                // Token is valid
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error validating token:", error);
                localStorage.removeItem("token");
                router.push("/adm/login");
            }
        };

        validateAuth();
    }, [router, mounted]);

    if (!mounted || !isAuthenticated) {
        return null;
    }

    return <>{children}</>;
};

export default AuthWrapper;