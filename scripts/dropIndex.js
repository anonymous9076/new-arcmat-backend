import dotenv from "dotenv";
dotenv.config();
import connectdb from "./db/connection.js";
import mongoose from "mongoose";

async function run() {
    try {
        await connectdb();
        console.log("Connected to DB");

        // Get the collection
        const collection = mongoose.connection.collection("categories");

        // Drop the index
        try {
            await collection.dropIndex("name_1");
            console.log("Successfully dropped index 'name_1'");
        } catch (e) {
            console.log("Error dropping index 'name_1':", e.message);
            // Maybe it's not name_1, let's list them
            const indexes = await collection.indexes();
            console.log("Existing indexes:", indexes);
        }

        process.exit(0);
    } catch (error) {
        console.error("Script failed:", error);
        process.exit(1);
    }
}

run();
