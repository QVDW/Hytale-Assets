"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

import AdmNavbar from "../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../components/adm/AuthWrapper";
import { getApiUrl } from '../../../../utils/apiConfig';
import { useEffectiveRank } from '../../../../../hooks/useViewAs';
import { hasPermission, PERMISSIONS } from '../../../../utils/permissions';
import PasswordGenerator from '../../../../../components/PasswordGenerator';
import { validatePasswordStrength, getPasswordStrengthLevel, formatPasswordRequirements } from '../../../../utils/passwordStrength';
import { FiAlertTriangle, FiEye, FiEyeOff } from 'react-icons/fi';

interface UserExistsResponse {
    hasUsers: boolean;
    count: number;
}

export default function AddUser() {
    const [name, setName] = useState("");
    const [mail, setMail] = useState("");
    const [password, setPassword] = useState("");
    const [rank, setRank] = useState("Werknemer");
    const [hasUsers, setHasUsers] = useState<boolean | null>(null);
    const [availableRanks, setAvailableRanks] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<{
        score: number;
        isValid: boolean;
        requirements: {
            minLength: boolean;
            hasUppercase: boolean;
            hasLowercase: boolean;
            hasNumbers: boolean;
            hasSpecialChars: boolean;
        };
        errors: string[];
    } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const effectiveRank = useEffectiveRank();

    const router = useRouter();

    // Password strength validation effect
    useEffect(() => {
        if (password) {
            const validation = validatePasswordStrength(password) as {
                score: number;
                isValid: boolean;
                requirements: {
                    minLength: boolean;
                    hasUppercase: boolean;
                    hasLowercase: boolean;
                    hasNumbers: boolean;
                    hasSpecialChars: boolean;
                };
                errors: string[];
            };
            setPasswordStrength(validation);
        } else {
            setPasswordStrength(null);
        }
    }, [password]);

    // Conditionally apply authentication only if users exist
    useAuth(hasUsers === false); // Skip auth check if no users exist

    // Check if user has permission to add users (only for existing users)
    useEffect(() => {
        if (hasUsers === true && effectiveRank) {
            const canAddUsers = hasPermission(effectiveRank, PERMISSIONS.ADD_USERS);
            if (!canAddUsers) {
                alert("You don't have permission to add users. Only Eigenaar and Developer can create accounts.");
                router.push("/adm/users");
                return;
            }
        }
    }, [hasUsers, effectiveRank, router]);

    useEffect(() => {
        const checkUsersExist = async () => {
            try {
                const response = await fetch(getApiUrl("/api/users/exists"));
                if (response.ok) {
                    const data: UserExistsResponse = await response.json();
                    setHasUsers(data.hasUsers);
                    
                    // If users exist, fetch available ranks
                    if (data.hasUsers) {
                        await fetchAvailableRanks();
                    } else {
                        // First user will be Developer
                        setRank("Developer");
                        setAvailableRanks(["Developer"]);
                    }
                }
            } catch (error) {
                console.error("Error checking if users exist:", error);
                // Assume users exist on error for security
                setHasUsers(true);
                await fetchAvailableRanks();
            } finally {
                setIsLoading(false);
            }
        };

        const fetchAvailableRanks = async () => {
            try {
                if (effectiveRank) {
                    // Use effective rank for available ranks
                    const { getAvailableRanks: getAvailableRanksFunc } = await import("../../../../utils/permissions");
                    const available = getAvailableRanksFunc(effectiveRank);
                    setAvailableRanks(available);
                    
                    // Set default rank to lowest available rank
                    if (available.length > 0) {
                        setRank(available[available.length - 1]);
                    }
                } else {
                    // Fallback to actual user rank
                    const token = localStorage.getItem("token");
                    const res = await fetch(getApiUrl("/api/auth/me"), {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });

                    if (res.ok) {
                        const userData = await res.json();
                        
                        const { getAvailableRanks: getAvailableRanksFunc } = await import("../../../../utils/permissions");
                        const available = getAvailableRanksFunc(userData.rank);
                        setAvailableRanks(available);
                        
                        // Set default rank to lowest available rank
                        if (available.length > 0) {
                            setRank(available[available.length - 1]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching available ranks:", error);
                setAvailableRanks(["Werknemer"]);
            }
        };

        checkUsersExist();
    }, [effectiveRank]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!name || !mail || !password) {
            alert("Please fill in all fields.");
            setIsSubmitting(false);
            return;
        }

        // Validate password strength
        const validation = validatePasswordStrength(password) as {
            score: number;
            isValid: boolean;
            requirements: {
                minLength: boolean;
                hasUppercase: boolean;
                hasLowercase: boolean;
                hasNumbers: boolean;
                hasSpecialChars: boolean;
            };
            errors: string[];
        };
        if (!validation.isValid) {
            alert(`Password does not meet requirements:\n${validation.errors.join('\n')}`);
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers: Record<string, string> = {
                "Content-type": "application/json"
            };
            
            // Add authorization header if users exist
            if (hasUsers && token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(getApiUrl("/api/users"), {
                method: "POST", 
                headers,
                body: JSON.stringify({ name, mail, password, rank }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || res.statusText);
            } else {
                // For first user, redirect to login page
                if (hasUsers === false) {
                    router.push("/adm/login");
                    alert("First admin user created successfully! Please log in.");
                } else {
                    router.push("/adm/users");
                    alert("User added successfully.");
                }
            }

        } catch (error) {
            console.error(error);
            alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Show loading while checking user existence
    if (isLoading) {
        return (
            <div className="flex column">
                <div id="main-content">
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100vh',
                        fontSize: '18px' 
                    }}>
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    const content = (
        <div className="flex column">
            {hasUsers && <AdmNavbar />}
            <div id="main-content">
                {hasUsers === false && (
                    <div className="first-setup-banner" style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '12px 20px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        border: '1px solid #bbdefb'
                    }}>
                        🎉 Welcome! Set up your first admin account to get started.
                    </div>
                )}
                <h1 className="adm-title">
                    {hasUsers === false ? "Create First Admin User" : "Add User"}
                </h1>
                <form onSubmit={handleSubmit} className="adm-form">
                    <label htmlFor="name">Name:</label>
                    <input 
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        type="text" 
                        id="name" 
                        name="name" 
                        placeholder="John Doe"
                        required
                    />
                    
                    <label htmlFor="email">Email:</label>
                    <input 
                        onChange={(e) => setMail(e.target.value)}
                        value={mail}
                        type="email" 
                        id="email" 
                        name="email" 
                        placeholder="JohnDoe@gmail.com"
                        required
                    />
                    
                    {hasUsers !== false && (
                        <>
                            <label htmlFor="rank">Rank:</label>
                            <select 
                                onChange={(e) => setRank(e.target.value)}
                                value={rank}
                                id="rank" 
                                name="rank"
                                required
                            >
                                {availableRanks.map((rankOption) => (
                                    <option key={rankOption} value={rankOption}>
                                        {rankOption}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                    
                    <div className="password-field-container">
                        <label htmlFor="password">Password:</label>
                        
                        <div className="password-input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                id="password" 
                                name="password" 
                                placeholder="P@s$W0rD"
                                required
                            />
                            
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle-btn"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                            
                            <PasswordGenerator
                                onPasswordGenerated={(generatedPassword) => setPassword(generatedPassword)}
                            />
                        </div>
                        
                        {/* Password Strength Indicator */}
                        {password && passwordStrength && (
                            <div className="password-strength-container">
                                <div className="password-strength-bar">
                                    <div 
                                        className="password-strength-fill"
                                                                        style={{
                                    width: `${(getPasswordStrengthLevel(passwordStrength.score) as { level: string; color: string; percentage: number }).percentage}%`,
                                    backgroundColor: (getPasswordStrengthLevel(passwordStrength.score) as { level: string; color: string; percentage: number }).color
                                }}
                            />
                        </div>
                        <div className="password-strength-label">
                            Password Strength: {(getPasswordStrengthLevel(passwordStrength.score) as { level: string; color: string; percentage: number }).level}
                                </div>
                                
                                {!passwordStrength.isValid && (
                                    <div className="password-requirements">
                                        <div className="password-requirements-header">
                                            <FiAlertTriangle />
                                            Password must contain:
                                        </div>
                                        <ul className="password-requirements-list">
                                            {formatPasswordRequirements(passwordStrength.requirements).map((req: { text: string; met: boolean }, index: number) => (
                                                <li key={index} className={req.met ? 'met' : 'unmet'}>
                                                    {req.text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : (hasUsers === false ? "Create Admin Account" : "Add User")}
                    </button>
                </form>
            </div>
        </div>
    );

    // Only wrap with AuthWrapper if users exist
    return hasUsers === false ? content : <AuthWrapper>{content}</AuthWrapper>;
}