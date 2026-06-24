import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';

// 1. Define Schema
const userInfo = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 30
    },
    lastName: {
        type: String,
        required: false,
        minlength: 2,
        maxlength: 30
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher'],
        default: 'student'
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    displayName: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                return v === '' || (v.length >= 2 && v.length <= 30);
            },
            message: 'Display name must be between 2 and 30 characters.'
        },
        default: ''
    }
}, {
    timestamps: true
});

// 2. Attach Methods
userInfo.methods.getJWT = async function () {
    const user = this;
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("FATAL: JWT_SECRET environment variable is not defined!");
    }
    const token = jwt.sign(
        { _id: user._id },
        jwtSecret,
        { expiresIn: '7d' }
    );
    return token;
};

userInfo.methods.validatePassword = async function (userPassword) {
    const user = this;
    const passwordHash = user.password;
    return await bcrypt.compare(userPassword, passwordHash);
};

// 3. Validation Helper
export const validateSignUpData = (req) => {
    const { firstName, emailId, password } = req.body;

    if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 30) {
        throw new Error("First name must be between 2 and 30 characters.");
    }
    
    if (!emailId || !validator.isEmail(emailId)) {
        throw new Error("Please enter a valid email address.");
    }

    if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
    }
};

const User = mongoose.model('User', userInfo);
export default User;
