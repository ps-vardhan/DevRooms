import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import http from 'http';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import Room from './models/Room.js';
import { authRouter } from './routes/auth.js';
import roomsRouter from './routes/rooms.js';

dotenv.config();

// Ensure critical environment variables are defined
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express
const server = http.createServer(app);

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Simple CSRF protection middleware checking Origin and Referer headers
const csrfCheck = (req, res, next) => {
    const stateChangingMethods = ['POST', 'PUT', 'DELETE'];
    if (stateChangingMethods.includes(req.method)) {
        const origin = req.headers.origin;
        const referer = req.headers.referer;
        const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

        let isValid;
        if (origin) {
            isValid = allowedOrigins.includes(origin);
        } else if (referer) {
            try {
                const refererUrl = new URL(referer);
                isValid = allowedOrigins.includes(refererUrl.origin);
            } catch {
                isValid = false;
            }
        } else {
            return res.status(403).json({ message: "CSRF check failed: Missing Origin or Referer header." });
        }

        if (!isValid) {
            return res.status(403).json({ message: "CSRF check failed: Origin or Referer not allowed." });
        }
    }
    next();
};

app.use(csrfCheck);
app.use(express.json());
app.use(cookieParser());

// Rate limiting for login endpoint: max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { message: "Too many login attempts, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/login', loginLimiter);

// Mount the routes
app.use('/api', authRouter);
app.use('/api/rooms', roomsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Auth server running' });
});

// Setup WebSocket Server for Yjs
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
    // Store the room name on the WebSocket object to filter target drops later
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        ws.roomName = url.pathname.split('/').pop(); // e.g. room-UUID-shared
    } catch (err) {
        console.error("Error setting roomName on ws client:", err);
    }

    setupWSConnection(ws, req, { gc: true });
});

// Helper function to close all client sockets when a room is terminated
global.terminateRoomSockets = (roomId) => {
    const targetRoom = `room-${roomId}-shared`;
    console.log(`Closing WebSocket connections for terminated room: ${targetRoom}`);
    for (const client of wss.clients) {
        if (client.roomName === targetRoom) {
            client.close();
        }
    }
};

// Handle HTTP upgrades for WebSocket connections
server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/yjs')) {
        // Extract roomId to check if it's already terminated (finished) in MongoDB
        const match = pathname.match(/\/yjs\/room-([a-zA-Z0-9-]+)-shared/);
        if (match) {
            const roomId = match[1];
            try {
                const room = await Room.findOne({ roomId });
                if (room && room.status === 'finished') {
                    console.log(`Upgrade rejected: Room ${roomId} is finished.`);
                    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                    socket.destroy();
                    return;
                }
            } catch (err) {
                console.error("Error checking room status on WebSocket upgrade:", err);
            }
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/live-coding';

console.log(`Attempting to connect to MongoDB at: ${mongoURI}`);

mongoose.connect(mongoURI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        console.error('Process exiting due to MongoDB connection failure (fallback disabled).');
        process.exit(1);
    });
