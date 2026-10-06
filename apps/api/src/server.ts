import app from './app.js';
import { connectToMongoDB } from "./config/db.js";
import 'dotenv/config';

const PORT = 8000;

async function startServer(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing");
    }

    await connectToMongoDB(mongoUri);

    app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
}

startServer().catch((error: unknown) => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
});