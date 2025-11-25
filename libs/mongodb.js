import mongoose from "mongoose";

let isConnected = false;

const connectMongoDB = async () => {
    if (mongoose.connection.readyState === 1) {
        if (!isConnected) {
            console.log("MongoDB is already connected");
            isConnected = true;
        }
        return;
    }
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error("MONGODB_URI is not defined in environment variables");
            throw new Error("MONGODB_URI is not defined in environment variables");
        }
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully");
        isConnected = true;
    } catch (error) {
        console.error("MongoDB connection failed", error);
        throw new Error("MongoDB connection failed");
    }
};

export default connectMongoDB;