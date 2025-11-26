"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const useAuth = (skipCheck = false) => {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        console.log("useAuth useEffect triggered");

        if (skipCheck) return;

        const checkAuth = async () => {

            // Ensure we're on the client side before accessing localStorage
            if (typeof window === 'undefined') return;

            const token = localStorage.getItem("adminToken");
            
            if (!token) {
                console.log("No token found, redirecting to login");
                router.push("/adm/login");
                return;
            }

            try {
                // Validate token with server
                const response = await fetch("/api/auth/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        "Pragma": "no-cache"
                    },
                    cache: 'no-store'
                });

                if (response.status === 401) {
                    console.log("Session terminated or token expired, clearing and redirecting to login");
                    localStorage.removeItem("adminToken");
                    if (typeof window !== 'undefined') {
                        window.location.href = "/adm/login";
                    }
                    return;
                }

                if (!response.ok) {
                    console.log("Failed to validate token, redirecting to login");
                    localStorage.removeItem("adminToken");
                    if (typeof window !== 'undefined') {
                        window.location.href = "/adm/login";
                    }
                    return;
                }

                // Authentication valid
            } catch (error) {
                console.error("Error validating token:", error);
                localStorage.removeItem("adminToken");
                router.push("/adm/login");
            }
        };

        checkAuth();

        // Check every 10 minutes for session validation (less frequent)
        const intervalId = setInterval(checkAuth, 600000);

        return () => {
            clearInterval(intervalId);
        };
    }, [router, skipCheck, mounted]);
};

export default useAuth;