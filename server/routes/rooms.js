const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const requireAuth = require("../middleware/auth");

const ROOM_MEMBER_LIMIT = 50;

const generateId = (length) =>
  crypto.randomBytes(6).toString("hex").toUpperCase();

router.post("/", requireAuth, async (req, res) => {
  const { name } = req.body;

  try {
    let roomId = generateId(6);
    while (await Room.findOne({ roomId })) {
      roomId = generateId(6);
    }

    const passwordKey = generateId(3);
    const hashedPassword = await bcrypt.hash(passwordKey, 10);

    const newRoom = await Room.create({
      roomId,
      name: name || "Untitled",
      password: hashedPassword,
      owner: req.user.id,
      members: [req.user.id],
    });

    res.json({
      msg: "Room Created",
      roomId: newRoom.roomId,
      passwordKey,
      name: newRoom.name,
    });
  } catch (err) {
    console.error("Create Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/join", requireAuth, async (req, res) => {
  const { roomId, password } = req.body;

  if (!roomId || !password) {
    return res.status(400).json({ msg: "roomId and password are required." });
  }

  try {
    const room = await Room.findOne({ roomId });

    if (!room) return res.status(404).json({ msg: "Room not found" });

    const isMatch = await bcrypt.compare(password, room.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid Password" });

    const alreadyMember = room.members.some(
      (id) => id.equals(req.user.id)
    );

    if (!alreadyMember && room.members.length >= ROOM_MEMBER_LIMIT) {
      return res.status(403).json({
        msg: `Room is full. MAximum ${ROOM_MEMBER_LIMIT} members allowed.`,
      });
    }

    await Room.updateOne(
      { roomId },
      { $addToSet: { members: req.user.id } }
    );

    res.json({ msg: "Acess Granted", roomId: room.roomId, name: room.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const rooms = await Room.findOne({ roomId: req.params.roomId })
      .select("roomID name owner createdAt")
      .populate("owner", "username");

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.mesage });
  }
});

router.get("/:roomId", requireAuth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("owner", "useranme")
      .populate("members", "username");

    if (!room) return res.status(404).json({ msg: "Room not found." });

    res.json({
      roomId: room.roomId,
      name: room.name,
      owner: room.owner,
      members: room.members,
      memberCount: room.members.length,
      isFull: room.members.length >= ROOM_MEMBER_LIMIT,
      createdAt: room.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
