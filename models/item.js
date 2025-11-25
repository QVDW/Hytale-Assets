import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    link: {
        type: String,
        required: false,
    },
    releaseDate: {
        type: Date,
        required: false,
    },
    isFeatured: {
        type: Boolean,
        required: false,
    },
    isActive: {
        type: Boolean,
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
});

itemSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

export default Item;