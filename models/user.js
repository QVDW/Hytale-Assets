import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { validatePasswordStrength } from "../src/utils/passwordStrength.js";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mail: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    rank: {
        type: String,
        enum: ["Developer", "Eigenaar", "Manager", "Werknemer"],
        default: "Werknemer",
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    // Two-Factor Authentication fields
    twoFactorSecret: {
        type: String,
        default: null,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorBackupCodes: [{
        code: {
            type: String,
            required: true
        },
        used: {
            type: Boolean,
            default: false
        },
        usedAt: {
            type: Date,
            default: null
        }
    }],
    twoFactorSetupCompleted: {
        type: Boolean,
        default: false,
    },
    // Login throttling fields
    loginAttempts: {
        failedCount: {
            type: Number,
            default: 0
        },
        lastFailedAttempt: {
            type: Date,
            default: null
        },
        lockedUntil: {
            type: Date,
            default: null
        },
        totalAttempts: {
            type: Number,
            default: 0
        }
    }
});

userSchema.pre('save', async function(next) {
    if (!this.password) {
        return next(new Error("Password is required"));
    }
    
    // Only process if password is modified or this is a new document
    if (this.isModified('password') || this.isNew) {
        try {
            // Check if password is already hashed (bcrypt hashes start with $2)
            const isAlreadyHashed = this.password.startsWith('$2');
            
            if (!isAlreadyHashed) {
                // Validate password strength for plain text passwords
                const validation = validatePasswordStrength(this.password);
                if (!validation.isValid) {
                    return next(new Error(`Password does not meet requirements: ${validation.errors.join(', ')}`));
                }
                
                // Hash the password
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Add a pre hook for findOneAndUpdate to ensure password validation
userSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    
    if (update.password) {
        try {
            // Check if password is already hashed
            const isAlreadyHashed = update.password.startsWith('$2');
            
            if (!isAlreadyHashed) {
                // Validate password strength
                const validation = validatePasswordStrength(update.password);
                if (!validation.isValid) {
                    return next(new Error(`Password does not meet requirements: ${validation.errors.join(', ')}`));
                }
                
                // Hash the password
                const salt = await bcrypt.genSalt(10);
                update.password = await bcrypt.hash(update.password, salt);
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Static method to get rank hierarchy
userSchema.statics.getRankHierarchy = function() {
    return {
        "Developer": 4,
        "Eigenaar": 3,
        "Manager": 2,
        "Werknemer": 1
    };
};

// Instance method to check if user has permission (based on rank hierarchy)
userSchema.methods.hasPermission = function(requiredRank) {
    const hierarchy = this.constructor.getRankHierarchy();
    return hierarchy[this.rank] >= hierarchy[requiredRank];
};

// Instance method to get user's rank level
userSchema.methods.getRankLevel = function() {
    const hierarchy = this.constructor.getRankHierarchy();
    return hierarchy[this.rank];
};

// Login throttling methods
userSchema.methods.isAccountLocked = function() {
    return this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil > new Date();
};

userSchema.methods.incrementFailedAttempts = function() {
    this.loginAttempts.failedCount += 1;
    this.loginAttempts.totalAttempts += 1;
    this.loginAttempts.lastFailedAttempt = new Date();
    
    // Implement the specific throttling logic:
    // 5 failed attempts = 30 second lockout
    // After lockout, 1 chance then another 30 second lockout
    if (this.loginAttempts.failedCount >= 5) {
        // Lock for 30 seconds
        this.loginAttempts.lockedUntil = new Date(Date.now() + 30 * 1000);
        // Reset failed count to give them 1 chance after lockout
        this.loginAttempts.failedCount = 0;
    }
    
    return this.save();
};

userSchema.methods.resetFailedAttempts = function() {
    this.loginAttempts.failedCount = 0;
    this.loginAttempts.lastFailedAttempt = null;
    this.loginAttempts.lockedUntil = null;
    return this.save();
};

userSchema.methods.getRemainingLockTime = function() {
    if (!this.isAccountLocked()) {
        return 0;
    }
    return Math.max(0, this.loginAttempts.lockedUntil.getTime() - Date.now());
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;