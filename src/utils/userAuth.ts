// User authentication utilities

export interface UserData {
    user_id: string;
    username: string;
    email: string;
    profile_picture: string;
    user_role: string;
    status: string;
    join_date: string;
    last_login: string | null;
}

/**
 * Get the current user token from localStorage
 */
export function getUserToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
    const token = getUserToken();
    if (!token) return false;

    try {
        const response = await fetch("/api/user-auth/me", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get current user data
 */
export async function getCurrentUser(): Promise<UserData | null> {
    const token = getUserToken();
    if (!token) return null;

    try {
        const response = await fetch("/api/user-auth/me", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token is invalid, remove it
                if (typeof window !== "undefined") {
                    localStorage.removeItem("token");
                }
            }
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

/**
 * Logout user by removing token
 */
export function logout(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
    }
}

