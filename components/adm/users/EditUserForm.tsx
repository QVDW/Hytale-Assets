"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getApiUrl } from "../../../src/utils/apiConfig";
import { useEffectiveRank } from "../../../hooks/useViewAs";
import PasswordGenerator from '../../PasswordGenerator';
import { validatePasswordStrength, getPasswordStrengthLevel, formatPasswordRequirements } from '../../../src/utils/passwordStrength';
import { FiAlertTriangle, FiEye, FiEyeOff } from 'react-icons/fi';

interface EditUserFormProps {
    id: string;
    name: string;
    email: string;
    rank?: string;
}

export default function EditUserForm({ id, name, email, rank }: EditUserFormProps) {
    const [newName, setNewName] = useState(name);
    const [newEmail, setNewEmail] = useState(email);
    const [newPassword, setNewPassword] = useState("");
    const [newRank, setNewRank] = useState(rank || "Werknemer");
    const [availableRanks, setAvailableRanks] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
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
        if (newPassword) {
            const validation = validatePasswordStrength(newPassword) as {
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
    }, [newPassword]);

    useEffect(() => {
        const fetchCurrentUserRank = async () => {
            try {
                if (effectiveRank) {
                    // Use effective rank for available ranks
                    const { getAvailableRanks: getAvailableRanksFunc } = await import("../../../src/utils/permissions");
                    const available = getAvailableRanksFunc(effectiveRank);
                    setAvailableRanks(available);
                } else {
                    // Fallback to actual user rank
                    const token = localStorage.getItem("adminToken");
                    const res = await fetch(getApiUrl("/api/auth/me"), {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });

                    if (res.ok) {
                        const userData = await res.json();
                        
                        const { getAvailableRanks: getAvailableRanksFunc } = await import("../../../src/utils/permissions");
                        const available = getAvailableRanksFunc(userData.rank);
                        setAvailableRanks(available);
                    }
                }
            } catch (error) {
                console.error("Error fetching current user rank:", error);
            }
        };

        fetchCurrentUserRank();
    }, [effectiveRank]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Validate password strength if password is being changed
        if (newPassword) {
            const validation = validatePasswordStrength(newPassword) as {
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
                setLoading(false);
                return;
            }
        }

        const updateData = {
            name: newName,
            email: newEmail,
            rank: newRank,
            ...(newPassword && { password: newPassword })
        };

        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(getApiUrl(`/api/users/${id}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updateData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || res.statusText);
            }

            console.log("Update successful");
            router.push("/adm/users");
        } catch (error) {
            console.error("Error updating user:", error);
            alert(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="adm-form">
            <label htmlFor="name">Naam:</label>
            <input 
                onChange={(e) => setNewName(e.target.value)}
                value={newName}
                type="text" 
                id="name" 
                name="name" 
                placeholder="John Doe"
                required
            />
            
            <label htmlFor="email">Email:</label>
            <input 
                onChange={(e) => setNewEmail(e.target.value)}
                value={newEmail}
                type="email" 
                id="email" 
                name="email" 
                placeholder="JohnDoe@gmail.com"
                required
            />
            
            <label htmlFor="rank">Rank:</label>
            <select 
                onChange={(e) => setNewRank(e.target.value)}
                value={newRank}
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
            
            <div className="password-field-container">
                <label htmlFor="password">Nieuw Wachtwoord (optioneel):</label>
                
                <div className="password-input-group">
                    <input 
                        onChange={(e) => setNewPassword(e.target.value)}
                        value={newPassword}
                        type={showPassword ? "text" : "password"}
                        id="password" 
                        name="password" 
                        placeholder="Laat leeg om huidig wachtwoord te behouden"
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
                        onPasswordGenerated={(generatedPassword) => setNewPassword(generatedPassword)}
                    />
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && passwordStrength && (
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
            
            <button type="submit" disabled={loading}>
                {loading ? "Bijwerken..." : "Gebruiker bijwerken"}
            </button>
        </form>
    );
}