import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true
    },
    stack: {
        type: String,
        required: false
    },
    level: {
        type: String,
        enum: ['error', 'warning', 'info', 'debug'],
        default: 'error'
    },
    source: {
        type: String, // API route, page, component, etc.
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    ipAddress: {
        type: String,
        required: false
    },
    url: {
        type: String,
        required: false
    },
    method: {
        type: String,
        required: false
    },
    requestBody: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    responseStatus: {
        type: Number,
        required: false
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    resolvedAt: {
        type: Date,
        required: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    }
}, {
    timestamps: true
});

// Index for better query performance
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ level: 1 });
errorLogSchema.index({ resolved: 1 });
errorLogSchema.index({ source: 1 });

const ErrorLog = mongoose.models.ErrorLog || mongoose.model("ErrorLog", errorLogSchema);

export default ErrorLog; 