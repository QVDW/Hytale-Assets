/**
 * Password strength validation utility
 */

export const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*(),.?":{}|<>'
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid boolean and details
 */
export function validatePasswordStrength(password) {
    const result = {
        isValid: true,
        score: 0,
        requirements: {
            minLength: false,
            hasUppercase: false,
            hasLowercase: false,
            hasNumbers: false,
            hasSpecialChars: false
        },
        errors: []
    };

    if (!password) {
        result.isValid = false;
        result.errors.push('Password is required');
        return result;
    }

    // Check minimum length
    if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
        result.requirements.minLength = true;
        result.score += 20;
    } else {
        result.isValid = false;
        result.errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
        result.requirements.hasUppercase = true;
        result.score += 20;
    } else if (PASSWORD_REQUIREMENTS.requireUppercase) {
        result.isValid = false;
        result.errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (/[a-z]/.test(password)) {
        result.requirements.hasLowercase = true;
        result.score += 20;
    } else if (PASSWORD_REQUIREMENTS.requireLowercase) {
        result.isValid = false;
        result.errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (/[0-9]/.test(password)) {
        result.requirements.hasNumbers = true;
        result.score += 20;
    } else if (PASSWORD_REQUIREMENTS.requireNumbers) {
        result.isValid = false;
        result.errors.push('Password must contain at least one number');
    }

    // Check for special characters
    const specialCharsRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (specialCharsRegex.test(password)) {
        result.requirements.hasSpecialChars = true;
        result.score += 20;
    } else if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
        result.isValid = false;
        result.errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
    }

    return result;
}

/**
 * Get password strength level based on score
 * @param {number} score - Password strength score
 * @returns {Object} - Strength level and color
 */
export function getPasswordStrengthLevel(score) {
    if (score >= 100) {
        return { level: 'Very Strong', color: '#22c55e', percentage: 100 };
    } else if (score >= 80) {
        return { level: 'Strong', color: '#84cc16', percentage: 80 };
    } else if (score >= 60) {
        return { level: 'Good', color: '#eab308', percentage: 60 };
    } else if (score >= 40) {
        return { level: 'Fair', color: '#f97316', percentage: 40 };
    } else {
        return { level: 'Weak', color: '#ef4444', percentage: 20 };
    }
}

/**
 * Format password requirements for display
 * @param {Object} requirements - Requirements object from validation
 * @returns {Array} - Array of requirement objects with text and met status
 */
export function formatPasswordRequirements(requirements) {
    return [
        {
            text: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
            met: requirements.minLength
        },
        {
            text: 'At least one uppercase letter (A-Z)',
            met: requirements.hasUppercase
        },
        {
            text: 'At least one lowercase letter (a-z)',
            met: requirements.hasLowercase
        },
        {
            text: 'At least one number (0-9)',
            met: requirements.hasNumbers
        },
        {
            text: 'At least one special character (!@#$%^&*(),.?":{}|<>)',
            met: requirements.hasSpecialChars
        }
    ];
} 