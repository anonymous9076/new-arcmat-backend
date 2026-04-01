import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Flexible check for environment variable casing (essential for Vercel/Linux)
const MONGO_URI = process.env.database || process.env.DATABASE || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("CRITICAL: MongoDB connection string missing (tried: database, DATABASE, MONGODB_URI)");
  throw new Error("MongoDB connection string missing");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectdb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  cached.conn = await cached.promise;
  console.log("MongoDB connected");
  return cached.conn;
}

export default connectdb;
