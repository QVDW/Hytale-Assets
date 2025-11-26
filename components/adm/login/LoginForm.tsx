"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff, FiClock, FiAlertTriangle } from "react-icons/fi";
import TwoFactorVerification from "../auth/TwoFactorVerification";
import { validatePasswordStrength, getPasswordStrengthLevel, formatPasswordRequirements } from "../../../src/utils/passwordStrength";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [userId, setUserId] = useState("");
    
    // Password strength state
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
    
    // Throttling state
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
    const [failedAttempts, setFailedAttempts] = useState(0);

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

    // Countdown timer effect for account lockout
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isLocked && lockTimeRemaining > 0) {
            timer = setInterval(() => {
                setLockTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isLocked, lockTimeRemaining]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (isLocked) {
            setError(`Account is locked. Please wait ${lockTimeRemaining} seconds.`);
            return;
        }
        
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const responseData = await res.json();

            if (!res.ok) {
                // Handle account lockout
                if (res.status === 423 && responseData.isLocked) {
                    setIsLocked(true);
                    setLockTimeRemaining(responseData.remainingTime);
                    setError(responseData.message);
                } else {
                    // Handle regular login failure
                    setError(responseData.message || "An error occurred. Please try again.");
                    if (responseData.failedAttempts) {
                        setFailedAttempts(responseData.failedAttempts);
                    }
                }
                setIsLoading(false);
                return;
            }
            
            // Check if 2FA is required
            if (responseData.requiresTwoFactor) {
                setUserId(responseData.userId);
                setShowTwoFactor(true);
                setIsLoading(false);
                return;
            }

            localStorage.setItem("adminToken", responseData.token);
            router.push("/adm");
        } catch {
            setError("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleTwoFactorSuccess = (token: string) => {
        localStorage.setItem("adminToken", token);
        router.push("/adm");
    };

    const handleTwoFactorError = (errorMessage: string) => {
        setError(errorMessage);
    };

    // Show 2FA verification if required
    if (showTwoFactor) {
        return (
            <TwoFactorVerification 
                userId={userId}
                onSuccess={handleTwoFactorSuccess}
                onError={handleTwoFactorError}
            />
        );
    }

    return (
        <div className="adm-login-container">
            <div className="adm-login-card">
                <h1 className="adm-login-title">Admin Login</h1>
                
                {error && <div className="adm-login-error">{error}</div>}
                
                <form onSubmit={handleSubmit} className="adm-form" id="login-form">
                    <div className="adm-form-group">
                        <label htmlFor="email">Email</label>
                        <div className="adm-input-wrapper">
                            <FiMail className="adm-input-icon" />
                            <input 
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email" 
                                id="email" 
                                name="email" 
                                placeholder="Vul je Email in"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="adm-form-group">
                        <label htmlFor="password">Wachtwoord</label>
                        <div className="adm-input-wrapper">
                            <FiLock className="adm-input-icon" />
                            <input 
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                type={showPassword ? "text" : "password"}
                                id="password" 
                                name="password" 
                                placeholder="Vul je Wachtwoord in"
                                required
                            />
                            <button 
                                type="button"
                                className="adm-password-toggle"
                                onClick={togglePasswordVisibility}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
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
                                            {formatPasswordRequirements(passwordStrength.requirements).map((req, index) => (
                                                <li key={index} className={req.met ? 'met' : 'unmet'}>
                                                    {req.text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Failed Attempts Warning */}
                        {failedAttempts > 0 && failedAttempts < 5 && (
                            <div className="login-warning">
                                <FiAlertTriangle />
                                {failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}. 
                                {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
                            </div>
                        )}
                        
                        {/* Account Locked Display */}
                        {isLocked && (
                            <div className="login-locked">
                                <FiClock />
                                Account locked for {lockTimeRemaining} second{lockTimeRemaining !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        className="adm-login-button"
                        disabled={isLoading || isLocked}
                    >
                        {isLoading ? (
                            <span className="adm-login-loading">
                                <span className="adm-spinner"></span> Inloggen...
                            </span>
                        ) : (
                            <span className="adm-login-btn-content">
                                <FiLogIn /> Inloggen
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}