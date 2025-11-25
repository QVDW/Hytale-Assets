"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiShield, FiCheck, FiX, FiRefreshCw, FiKey, FiDownload, FiCopy } from "react-icons/fi";
import { authenticatedFetch } from "../../../src/utils/apiConfig";

interface User {
    _id: string;
    name: string;
    mail: string;
    rank: string;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: Array<{
        code: string;
        used: boolean;
        usedAt?: Date;
    }>;
}

interface SetupData {
    secret: string;
    qrCode: string;
    manualEntryKey: string;
    message: string;
}

interface TwoFactorSetupProps {
    user: User;
    onStatusChange?: () => void;
}

export default function TwoFactorSetup({ user, onStatusChange }: TwoFactorSetupProps) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [disablePassword, setDisablePassword] = useState("");
    const [showDisableModal, setShowDisableModal] = useState(false);

    useEffect(() => {
        setIsEnabled(user?.twoFactorEnabled || false);
    }, [user]);

    const startSetup = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await authenticatedFetch("/api/auth/2fa/setup", {
                method: "POST"
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to setup 2FA");
            }

            const data = await response.json();
            setSetupData(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const verifySetup = async () => {
        if (!verificationCode.trim()) {
            setError("Please enter a verification code");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await authenticatedFetch("/api/auth/2fa/setup", {
                method: "PUT",
                body: JSON.stringify({ token: verificationCode })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Verification failed");
            }

            const data = await response.json();
            setIsEnabled(true);
            setBackupCodes(data.backupCodes);
            setShowBackupCodes(true);
            setSetupData(null);
            setVerificationCode("");
            setSuccess("2FA enabled successfully! Please save your backup codes.");
            onStatusChange?.();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        if (!disablePassword.trim()) {
            setError("Please enter your password");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await authenticatedFetch("/api/auth/2fa/setup", {
                method: "DELETE",
                body: JSON.stringify({ password: disablePassword })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to disable 2FA");
            }

            setIsEnabled(false);
            setSetupData(null);
            setShowDisableModal(false);
            setDisablePassword("");
            setSuccess("2FA disabled successfully");
            onStatusChange?.();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getBackupCodes = async () => {
        setLoading(true);
        try {
            const response = await authenticatedFetch("/api/auth/2fa/backup-codes");
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to get backup codes");
            }

            const data = await response.json();
            setBackupCodes(data.backupCodes);
            setShowBackupCodes(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const regenerateBackupCodes = async () => {
        const password = prompt("Enter your password to regenerate backup codes:");
        if (!password) return;

        setLoading(true);
        try {
            const response = await authenticatedFetch("/api/auth/2fa/backup-codes", {
                method: "POST",
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to regenerate backup codes");
            }

            const data = await response.json();
            setBackupCodes(data.backupCodes);
            setShowBackupCodes(true);
            setSuccess("Backup codes regenerated successfully");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccess("Copied to clipboard");
    };

    const downloadBackupCodes = () => {
        const content = `ADM Account Backup Codes\n\nGenerated: ${new Date().toISOString()}\nAccount: ${user.mail}\n\nBackup Codes:\n${backupCodes.join('\n')}\n\nIMPORTANT: Store these codes in a safe place. Each code can only be used once.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adm-backup-codes-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="twofa-setup-container">
            <div className="adm-card">
                <div className="card-header">
                    <h3 className="flex items-center gap-2">
                        <FiShield className={isEnabled ? "text-green-600" : "text-gray-400"} />
                        Two-Factor Authentication
                        {isEnabled && <span className="text-green-600 text-sm">(Enabled)</span>}
                    </h3>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <FiX />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <FiCheck />
                        {success}
                    </div>
                )}

                {!isEnabled && !setupData && (
                    <div className="card-content">
                        <p className="text-gray-600 mb-4">
                            Add an extra layer of security to your account by enabling two-factor authentication.
                        </p>
                        <button 
                            onClick={startSetup}
                            disabled={loading}
                            className="adm-btn primary"
                        >
                            {loading ? <FiRefreshCw className="spinning" /> : <FiShield />}
                            Enable 2FA
                        </button>
                    </div>
                )}

                {setupData && (
                    <div className="card-content">
                        <div className="setup-steps">
                            <div className="step">
                                <h4>Step 1: Scan QR Code</h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                </p>
                                <div className="qr-code-container text-center mb-4">
                                    <Image src={setupData.qrCode} alt="2FA QR Code" className="mx-auto" width={200} height={200} />
                                </div>
                                <div className="manual-entry">
                                    <p className="text-sm text-gray-600 mb-2">Can&apos;t scan? Enter this code manually:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                            {setupData.manualEntryKey}
                                        </code>
                                        <button 
                                            onClick={() => copyToClipboard(setupData.manualEntryKey)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FiCopy />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="step">
                                <h4>Step 2: Verify Setup</h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    Enter the 6-digit code from your authenticator app
                                </p>
                                <div className="adm-form-group">
                                    <div className="adm-input-wrapper">
                                        <FiShield className="adm-input-icon" />
                                        <input 
                                            type="number"
                                            placeholder="000000"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            maxLength={6}
                                            pattern="[0-9]{6}"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={verifySetup}
                                    disabled={loading || !verificationCode}
                                    className="adm-btn primary"
                                >
                                    {loading ? <FiRefreshCw className="spinning" /> : <FiCheck />}
                                    Verify & Enable
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isEnabled && (
                    <div className="card-content">
                        <div className="enabled-actions flex flex-wrap gap-3">
                            <button 
                                onClick={getBackupCodes}
                                className="adm-btn secondary"
                            >
                                <FiKey />
                                View Backup Codes
                            </button>
                            <button 
                                onClick={regenerateBackupCodes}
                                className="adm-btn secondary"
                            >
                                <FiRefreshCw />
                                Regenerate Backup Codes
                            </button>
                            <button 
                                onClick={() => setShowDisableModal(true)}
                                className="adm-btn danger"
                            >
                                <FiX />
                                Disable 2FA
                            </button>
                        </div>
                    </div>
                )}

                {/* Backup Codes Modal */}
                {showBackupCodes && (
                    <div className="modal-overlay" onClick={() => setShowBackupCodes(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Backup Codes</h3>
                                <button 
                                    onClick={() => setShowBackupCodes(false)}
                                    className="modal-close"
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-content">
                                <p className="text-sm text-gray-600 mb-4">
                                    These backup codes can be used to access your account if you lose your authenticator device. 
                                    Each code can only be used once.
                                </p>
                                <div className="backup-codes-grid">
                                    {backupCodes.map((code, index) => (
                                        <div key={index} className="backup-code">
                                            <code>{code}</code>
                                        </div>
                                    ))}
                                </div>
                                <div className="modal-actions">
                                    <button onClick={downloadBackupCodes} className="adm-btn secondary">
                                        <FiDownload />
                                        Download
                                    </button>
                                    <button 
                                        onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                        className="adm-btn secondary"
                                    >
                                        <FiCopy />
                                        Copy All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disable 2FA Modal */}
                {showDisableModal && (
                    <div className="modal-overlay" onClick={() => setShowDisableModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Disable Two-Factor Authentication</h3>
                                <button 
                                    onClick={() => setShowDisableModal(false)}
                                    className="modal-close"
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-content">
                                <p className="text-sm text-gray-600 mb-4">
                                    Are you sure you want to disable 2FA? This will make your account less secure.
                                </p>
                                <div className="adm-form-group">
                                    <label>Enter your password to confirm:</label>
                                    <div className="adm-input-wrapper">
                                        <input 
                                            type="password"
                                            placeholder="Your password"
                                            value={disablePassword}
                                            onChange={(e) => setDisablePassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button 
                                        onClick={() => setShowDisableModal(false)}
                                        className="adm-btn secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={disable2FA}
                                        disabled={loading || !disablePassword}
                                        className="adm-btn danger"
                                    >
                                        {loading ? <FiRefreshCw className="spinning" /> : <FiX />}
                                        Disable 2FA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 