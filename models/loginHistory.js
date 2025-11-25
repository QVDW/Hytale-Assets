import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    loginAttempt: {
        success: {
            type: Boolean,
            required: true,
            index: true
        },
        failureReason: {
            type: String,
            enum: ['invalid_credentials', 'user_not_found', 'account_locked', 'server_error', '2fa_failed'],
            default: null
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
            index: true
        }
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
            required: true,
            index: true
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
    sessionInfo: {
        sessionToken: {
            type: String,
            default: null
        },
        sessionDuration: {
            type: Number, // in milliseconds
            default: null
        },
        logoutTime: {
            type: Date,
            default: null
        },
        logoutReason: {
            type: String,
            enum: ['manual', 'timeout', 'force_logout', 'token_expired'],
            default: null
        }
    },
    security: {
        isFirstLogin: {
            type: Boolean,
            default: false
        },
        isSuspiciousActivity: {
            type: Boolean,
            default: false
        },
        suspiciousReasons: [{
            type: String,
            enum: ['unusual_location', 'unusual_device', 'multiple_failed_attempts', 'rapid_logins']
        }],
        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

// Indexes for efficient queries
loginHistorySchema.index({ userId: 1, 'loginAttempt.timestamp': -1 });
loginHistorySchema.index({ 'loginAttempt.success': 1, 'loginAttempt.timestamp': -1 });
loginHistorySchema.index({ 'location.ipAddress': 1, 'loginAttempt.timestamp': -1 });
loginHistorySchema.index({ email: 1, 'loginAttempt.timestamp': -1 });

// Static methods
loginHistorySchema.statics.getLoginHistory = function(userId, limit = 50) {
    return this.find({ userId })
        .sort({ 'loginAttempt.timestamp': -1 })
        .limit(limit)
        .populate('userId', 'name mail rank');
};

loginHistorySchema.statics.getFailedAttempts = function(email, timeWindow = 15 * 60 * 1000) {
    const since = new Date(Date.now() - timeWindow);
    return this.find({
        email,
        'loginAttempt.success': false,
        'loginAttempt.timestamp': { $gte: since }
    }).sort({ 'loginAttempt.timestamp': -1 });
};

loginHistorySchema.statics.getRecentLogins = function(userId, timeWindow = 24 * 60 * 60 * 1000) {
    const since = new Date(Date.now() - timeWindow);
    return this.find({
        userId,
        'loginAttempt.success': true,
        'loginAttempt.timestamp': { $gte: since }
    }).sort({ 'loginAttempt.timestamp': -1 });
};

loginHistorySchema.statics.getSuspiciousActivity = function(timeWindow = 24 * 60 * 60 * 1000) {
    const since = new Date(Date.now() - timeWindow);
    return this.find({
        'security.isSuspiciousActivity': true,
        'loginAttempt.timestamp': { $gte: since }
    }).sort({ 'loginAttempt.timestamp': -1 })
    .populate('userId', 'name mail rank');
};

loginHistorySchema.statics.getLoginStats = function(userId, timeWindow = 30 * 24 * 60 * 60 * 1000) {
    const since = new Date(Date.now() - timeWindow);
    return this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                'loginAttempt.timestamp': { $gte: since }
            }
        },
        {
            $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                successfulLogins: {
                    $sum: { $cond: ['$loginAttempt.success', 1, 0] }
                },
                failedAttempts: {
                    $sum: { $cond: ['$loginAttempt.success', 0, 1] }
                },
                uniqueDevices: { $addToSet: '$deviceInfo.userAgent' },
                uniqueIPs: { $addToSet: '$location.ipAddress' },
                lastLogin: { $max: '$loginAttempt.timestamp' }
            }
        },
        {
            $project: {
                totalAttempts: 1,
                successfulLogins: 1,
                failedAttempts: 1,
                uniqueDeviceCount: { $size: '$uniqueDevices' },
                uniqueIPCount: { $size: '$uniqueIPs' },
                lastLogin: 1,
                successRate: {
                    $cond: [
                        { $eq: ['$totalAttempts', 0] },
                        0,
                        { $multiply: [{ $divide: ['$successfulLogins', '$totalAttempts'] }, 100] }
                    ]
                }
            }
        }
    ]);
};

const LoginHistory = mongoose.models.LoginHistory || mongoose.model("LoginHistory", loginHistorySchema);

export default LoginHistory; 