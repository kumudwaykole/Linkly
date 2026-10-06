import mongoose from "mongoose";

export async function connectToMongoDB(url: string): Promise<void> {
    await mongoose.connect(url);
    console.log("MongoDB connected");
}