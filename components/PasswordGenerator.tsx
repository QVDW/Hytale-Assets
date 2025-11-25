"use client";

import { FiRefreshCw } from "react-icons/fi";

interface PasswordGeneratorProps {
    onPasswordGenerated: (password: string) => void;
    className?: string;
}

export default function PasswordGenerator({ onPasswordGenerated, className = "" }: PasswordGeneratorProps) {
    const generatePassword = () => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const specialChars = "!@#$%^&*(),.?\":{}|<>";
        
        const allChars = uppercase + lowercase + numbers + specialChars;
        let password = "";

        // Ensure at least one character from each type (for 12-char password)
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += specialChars[Math.floor(Math.random() * specialChars.length)];

        // Fill the remaining 8 characters randomly
        for (let i = 4; i < 12; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password to randomize character positions
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        onPasswordGenerated(password);
    };

    return (
        <button 
            type="button"
            onClick={generatePassword}
            className={`simple-generate-btn ${className}`}
            title="Generate secure 12-character password"
        >
            <FiRefreshCw />
            Generate
        </button>
    );
} 