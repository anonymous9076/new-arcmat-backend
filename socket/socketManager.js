import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

/**
 * Initialize the Socket.IO server and attach it to the HTTP server.
 * @param {import("http").Server} server The HTTP server
 */
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["https://arcmat-frontend-one.vercel.app", "http://localhost:3000", "http://localhost:5173", "https://arcmat.in", "https://www.arcmat.in"],
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
        },
    });

    // Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            
            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded?.id || decoded?._id;
            if (!userId) {
                return next(new Error("Authentication error: Invalid token payload"));
            }

            socket.user = { ...decoded, _id: userId };

            // Automatically join a room specific to the user for direct messages/notifications
            socket.join(`user_${userId}`);
            
            next();
        } catch (error) {
            console.error("Socket authentication error:", error.message);
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user._id} (Socket ID: ${socket.id})`);

        // Client can explicitly ask to join a project discussion room
        socket.on("join_project", (projectId) => {
            if (projectId) {
                socket.join(`project_${projectId}`);
                console.log(`User ${socket.user._id} joined project room: project_${projectId}`);
            }
        });

        // Client can explicitly ask to leave a project discussion room
        socket.on("leave_project", (projectId) => {
            if (projectId) {
                socket.leave(`project_${projectId}`);
                console.log(`User ${socket.user._id} left project room: project_${projectId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user._id}`);
        });
    });

    console.log("Socket.IO initialized successfully");
    return io;
};

/**
 * Get the initialized Socket.IO instance.
 * @returns {Server}
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};

/**
 * Helper to emit an event to a specific user.
 * @param {string} userId The user's MongoDB ObjectId as a string
 * @param {string} event The event name
 * @param {any} data The data to send
 */
export const emitToUser = (userId, event, data) => {
    if (io && userId) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

/**
 * Helper to emit an event to a specific project room.
 * @param {string} projectId The project's MongoDB ObjectId as a string
 * @param {string} event The event name
 * @param {any} data The data to send
 */
export const emitToProject = (projectId, event, data) => {
    if (io && projectId) {
        io.to(`project_${projectId}`).emit(event, data);
    }
};
