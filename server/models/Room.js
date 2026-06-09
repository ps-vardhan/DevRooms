const mongoose = require("mongoose");


const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      default: "Untitled Room",
      trim: true,
      maxlength: [60, "Room name cannot exceed 60 characters"],
    },
    password: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
