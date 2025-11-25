"use client";

import { useState, FormEvent } from "react";
import { FiShield, FiKey, FiRefreshCw } from "react-icons/fi";

interface TwoFactorVerificationProps {
    userId: string;
    onSuccess: (token: string, sessionToken: string) => void;
    onError: (error: string) => void;
}

export default function TwoFactorVerification({ userId, onSuccess, onError }: TwoFactorVerificationProps) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!code.trim()) {
            setError("Please enter a verification code");
            onError("Please enter a verification code");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    token: code.trim(),
                    isBackupCode: useBackupCode
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || "Verification failed";
                setError(errorMessage);
                onError(errorMessage);
                setIsLoading(false);
                return;
            }

            onSuccess(data.token, data.sessionToken);
        } catch (error) {
            console.error("2FA verification error:", error);
            const errorMessage = "An error occurred during verification";
            setError(errorMessage);
            onError(errorMessage);
            setIsLoading(false);
        }
    };

    const toggleBackupCode = () => {
        setUseBackupCode(!useBackupCode);
        setCode("");
        setError("");
    };

    return (
        <div className="adm-login-container">
            <div className="adm-login-card">
                <div className="text-center mb-6">
                    <FiShield className="mx-auto text-4xl text-blue-600 mb-4" />
                    <h1 className="adm-login-title">Two-Factor Authentication</h1>
                    <p className="text-gray-600 text-sm">
                        {useBackupCode 
                            ? "Enter one of your backup codes" 
                            : "Enter the 6-digit code from your authenticator app"
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="adm-form">
                    
                    <div className="adm-form-group two-fa-form-group">
                        <div className="two-fa-form-group-label">
                        <label htmlFor="code">
                            {useBackupCode ? "Backup Code" : "Verification Code"}
                        </label>
                        {useBackupCode ? (
                            <FiKey className="adm-input-icon" />
                        ) : (
                            <FiShield className="adm-input-icon" />
                        )}
                        </div>
                        <div className="adm-input-wrapper">
                            <input 
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    if (error) setError("");
                                }}
                                value={code}
                                type={useBackupCode ? "text" : "number"}
                                id="code" 
                                name="code" 
                                placeholder={useBackupCode ? "Enter backup code" : "000000"}
                                maxLength={useBackupCode ? 8 : 6}
                                pattern={useBackupCode ? "[A-Fa-f0-9]{8}" : "[0-9]{6}"}
                                required
                                autoComplete="one-time-code"
                                autoFocus
                                />
                        </div>
                    </div>
                    {error && (
                        <div className="adm-error-message">
                            {error}
                        </div>
                    )}
                    <button 
                        type="submit" 
                        className="adm-btn primary full-width"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <FiRefreshCw className="spinning" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <FiShield />
                                Verify
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button 
                        type="button"
                        onClick={toggleBackupCode}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                        {useBackupCode 
                            ? "Use authenticator app instead" 
                            : "Use backup code instead"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
} 