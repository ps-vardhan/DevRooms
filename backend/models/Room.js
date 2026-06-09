import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problem: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'finished'],
        default: 'waiting'
    },
    sessionMetadata: {
        language: {
            type: String,
            default: 'javascript'
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
