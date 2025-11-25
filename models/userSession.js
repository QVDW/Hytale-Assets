import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    jwtToken: {
        type: String,
        required: true,
        index: true
    },
    deviceInfo: {
        userAgent: {
            type: String,
            required: true
        },
        browser: String,
        os: String,
        device: String,
        isMobile: {
            type: Boolean,
            default: false
        }
    },
    location: {
        ipAddress: {
            type: String,
            required: true
        },
        country: String,
        region: String,
        city: String,
        timezone: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    loginTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    lastActivity: {
        type: Date,
        default: Date.now,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    logoutTime: {
        type: Date,
        default: null
    },
    logoutReason: {
        type: String,
        enum: ['manual', 'timeout', 'force_logout', 'token_expired'],
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    }
});

// Index for efficient queries
userSessionSchema.index({ userId: 1, isActive: 1 });
userSessionSchema.index({ expiresAt: 1 });
userSessionSchema.index({ lastActivity: 1 });

// Update lastActivity on save
userSessionSchema.pre('save', function(next) {
    if (this.isModified() && !this.isModified('lastActivity')) {
        this.lastActivity = new Date();
    }
    this.updated_at = new Date();
    next();
});

// Static methods
userSessionSchema.statics.getActiveSessions = function(userId) {
    return this.find({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
    }).sort({ lastActivity: -1 });
};

userSessionSchema.statics.deactivateSession = async function(tokenValue, tokenType = 'sessionToken') {
    // Support lookup by either sessionToken or jwtToken
    const query = { isActive: true };
    if (tokenType === 'jwtToken') {
        query.jwtToken = tokenValue;
    } else {
        query.sessionToken = tokenValue;
    }
    
    const result = await this.findOneAndUpdate(
        query,
        {
            isActive: false,
            logoutTime: new Date(),
            logoutReason: 'force_logout'
        },
        { new: true }
    );
    
    return result;
};

userSessionSchema.statics.forceLogoutUser = function(userId, excludeSessionToken = null) {
    const query = {
        userId,
        isActive: true
    };
    
    if (excludeSessionToken) {
        query.sessionToken = { $ne: excludeSessionToken };
    }
    
    return this.updateMany(query, {
        isActive: false,
        logoutTime: new Date(),
        logoutReason: 'force_logout'
    });
};

userSessionSchema.statics.cleanupExpiredSessions = function() {
    return this.updateMany(
        {
            isActive: true,
            expiresAt: { $lt: new Date() }
        },
        {
            isActive: false,
            logoutTime: new Date(),
            logoutReason: 'token_expired'
        }
    );
};

const UserSession = mongoose.models.UserSession || mongoose.model("UserSession", userSessionSchema);

export default UserSession; 