import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { validateSignUpData } from '../models/User.js';
import { userAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

// --- Authentication Routes ---
authRouter.post('/signup', async (req, res) => {
    try {
        validateSignUpData(req);
        const { firstName, lastName, emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email!" });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const savedUser = await new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            avatarUrl: ''
        }).save();

        const token = await savedUser.getJWT();
        res.cookie('token', token, {
            expires: new Date(Date.now() + 7 * 24 * 3600000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(201).json({
            message: "User registered successfully!",
            data: { _id: savedUser._id, firstName: savedUser.firstName, lastName: savedUser.lastName, emailId: savedUser.emailId, avatarUrl: '' }
        });
    } catch (err) {
        res.status(400).json({ message: err.message || "Server error" });
    }
});

authRouter.post('/login', async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId || !password) {
            return res.status(400).json({ message: "Email and password are required!" });
        }

        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials!" });
        }

        const isPasswordValid = await user.validatePassword(password);
        if (isPasswordValid) {
            const token = await user.getJWT();
            res.cookie('token', token, {
                expires: new Date(Date.now() + 7 * 24 * 3600000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            res.status(200).json({
                message: "Logged in successfully!",
                token,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                avatarUrl: user.avatarUrl || '',
                _id: user._id
            });
        } else {
            res.status(400).json({ message: "Invalid credentials!" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

authRouter.post('/logout', async (req, res) => {
    try {
        res.cookie('token', null, {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.status(200).json({ message: "Logged out successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error logging out", error: err.message });
    }
});

authRouter.get('/profile', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("FATAL: JWT_SECRET environment variable is not defined!");
        }
        const decoded = jwt.verify(token, jwtSecret);

        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ _id: user._id, firstName: user.firstName, lastName: user.lastName, emailId: user.emailId, avatarUrl: user.avatarUrl || '' });
    } catch {
        res.status(401).json({ message: "Invalid token or session expired" });
    }
});

// PUT /profile - Update profile details (Requires userAuth)
authRouter.put('/profile', userAuth, async (req, res) => {
    try {
        const { firstName, lastName, avatarUrl } = req.body;

        if (firstName) {
            if (firstName.trim().length < 2 || firstName.trim().length > 30) {
                return res.status(400).json({ message: "First name must be between 2 and 30 characters." });
            }
            req.user.firstName = firstName.trim();
        }

        if (lastName !== undefined) {
            const trimmedLast = lastName.trim();
            if (trimmedLast !== '' && (trimmedLast.length < 2 || trimmedLast.length > 30)) {
                return res.status(400).json({ message: "Last name must be between 2 and 30 characters." });
            }
            req.user.lastName = trimmedLast;
        }

        if (avatarUrl !== undefined) {
            req.user.avatarUrl = avatarUrl;
        }

        const updatedUser = await req.user.save();

        res.status(200).json({
            message: "Profile updated successfully!",
            data: {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                emailId: updatedUser.emailId,
                avatarUrl: updatedUser.avatarUrl || ''
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating profile details", error: err.message });
    }
});
