import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.database;

if (!MONGO_URI) {
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
