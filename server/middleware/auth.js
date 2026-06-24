import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Room from '../models/Room.js';

// --- Authentication Middleware ---
export const userAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Please login" });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("FATAL: JWT_SECRET environment variable is not defined!");
        }
        const decoded = jwt.verify(token, jwtSecret);

        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Independent database validation for the user's role field
        if (!user.role || !['student', 'teacher'].includes(user.role)) {
            return res.status(403).json({ message: "Access denied: Invalid user role." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token has expired" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// --- Role Verification Middleware ---
export const requireRole = (role) => {
    return async (req, res, next) => {
        try {
            if (role === 'host') {
                const { roomId } = req.params;
                if (!roomId) {
                    return res.status(400).json({ message: "Room ID parameter is missing." });
                }

                const room = await Room.findOne({ roomId });
                if (!room) {
                    return res.status(404).json({ message: "Room not found." });
                }

                // Check if current authenticated user is the host of this room
                if (room.hostId.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ message: "Access denied: Only the host can perform this action." });
                }

                req.room = room; // attach loaded room to request
                return next();
            }

            // Standard role checks (e.g. 'teacher')
            if (req.user.role !== role) {
                return res.status(403).json({ message: `Access denied: Requires ${role} role.` });
            }

            next();
        } catch (err) {
            console.error("requireRole Middleware Error:", err);
            res.status(500).json({ message: "Server error during authorization check." });
        }
    };
};

