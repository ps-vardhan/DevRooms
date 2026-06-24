import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import Room from '../models/Room.js';
import { userAuth, requireRole } from '../middleware/auth.js';

const roomsRouter = express.Router();

// Validation schema for room creation
const roomCreateSchema = z.object({
    name: z.string()
        .min(5, { message: "Session name is too short (minimum 5 characters)." })
        .max(50, { message: "Session name is too long (maximum 50 characters)." })
        .transform(val => val.trim())
});

// 1. POST / - Create a room (Requires user auth)
roomsRouter.post('/', userAuth, async (req, res) => {
    try {
        const validation = roomCreateSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ 
                message: validation.error.errors[0].message 
            });
        }
        
        const { name } = validation.data;
        const roomId = crypto.randomUUID();
        
        const room = new Room({
            roomId,
            name,
            hostId: req.user._id,
            status: 'waiting',
            sessionMetadata: {
                language: 'javascript'
            }
        });

        const savedRoom = await room.save();
        res.status(201).json({
            message: "Room created successfully!",
            data: savedRoom
        });
    } catch (err) {
        res.status(500).json({ message: "Error creating room", error: err.message });
    }
});

// 2. GET / - List all rooms (excluding deleted ones)
roomsRouter.get('/', async (req, res) => {
    try {
        const rooms = await Room.find({ isDeleted: { $ne: true } })
            .populate('hostId', 'firstName lastName')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ data: rooms });
    } catch (err) {
        res.status(500).json({ message: "Error fetching rooms", error: err.message });
    }
});

// 3. GET /:roomId - Get room details + role handshake (Requires user auth)
roomsRouter.get('/:roomId', userAuth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId }).populate('hostId', 'firstName emailId displayName');
        
        if (!room || room.isDeleted) {
            return res.status(404).json({ message: "Room not found." });
        }

        const isHost = room.hostId._id.toString() === req.user._id.toString();

        res.status(200).json({
            message: "Room fetched successfully",
            data: {
                roomId: room.roomId,
                name: room.name,
                problem: room.problem,
                status: room.status,
                host: {
                    _id: room.hostId._id,
                    firstName: room.hostId.firstName,
                    displayName: room.hostId.displayName || ''
                },
                sessionMetadata: room.sessionMetadata || { language: 'javascript' },
                isHost
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching room details", error: err.message });
    }
});

// 4. POST /:roomId/problem - Update room problem description (Host only, Requires user auth)
roomsRouter.post('/:roomId/problem', userAuth, requireRole('host'), async (req, res) => {
    try {
        const { problem } = req.body;

        if (problem === undefined) {
            return res.status(400).json({ message: "Problem description is required." });
        }

        const room = req.room; // Loaded by requireRole('host')
        room.problem = problem;
        room.status = 'active'; // Set room status to active when a problem is pushed
        await room.save();

        res.status(200).json({
            message: "Problem pushed successfully!",
            data: {
                roomId: room.roomId,
                problem: room.problem,
                status: room.status
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating room problem", error: err.message });
    }
});

// 5. POST /:roomId/leave - Leave a room (Host exit terminates the room)
roomsRouter.post('/:roomId/leave', userAuth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });

        if (!room || room.isDeleted) {
            return res.status(404).json({ message: "Room not found." });
        }

        // If host leaves, terminate the room (status = finished)
        if (room.hostId.toString() === req.user._id.toString()) {
            room.status = 'finished';
            await room.save();

            // Disconnect all WebSocket clients for this room
            if (global.terminateRoomSockets) {
                global.terminateRoomSockets(roomId);
            }

            console.log(`Host left room: ${roomId}. Room terminated.`);
            return res.status(200).json({
                message: "Host left. Room terminated.",
                terminated: true
            });
        }

        res.status(200).json({
            message: "Learner left room.",
            terminated: false
        });
    } catch (err) {
        res.status(500).json({ message: "Error leaving room", error: err.message });
    }
});

// 6. DELETE /:roomId - Delete room (Host only, soft-delete, Requires user auth)
roomsRouter.delete('/:roomId', userAuth, requireRole('host'), async (req, res) => {
    try {
        const room = req.room; // Loaded by requireRole('host')
        room.isDeleted = true;
        await room.save();

        // Disconnect all WebSocket clients for this room on delete
        if (global.terminateRoomSockets) {
            global.terminateRoomSockets(room.roomId);
        }

        console.log(`Room ${room.roomId} was soft deleted by host.`);
        res.status(200).json({
            message: "Room deleted successfully!",
            roomId: room.roomId
        });
    } catch (err) {
        res.status(500).json({ message: "Error deleting room", error: err.message });
    }
});

export default roomsRouter;
