require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const WebSocket = require("ws");
const { Server: SocketIOServer } = require("socket.io");

const cors = require("cors");

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");

const { setupWSConnection } = require("./utils");

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`[Socket.IO] client connected: ${socket.id}`);


  socket.on("join room", ({ roomId, username }) => {

    const safeUsername = username || "Guest";
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, []);
    }

    const roomUsers = rooms.get(roomId);

    socket.emit("all users", roomUsers);

    roomUsers.push({ socketId: socket.id, username: safeUsername });

    socket.roomId = roomId;
    socket.username = safeUsername;

    console.log(
      `[Socket.IO] ${safeUsername} (${socket.id}) joined room ${roomId}. Room now has ${roomUsers.length} user(s).`
    );
  })

  socket.on("sending signal", ({ userToSignal, callerID, signal }) => {
    let callerUsername = "Guest";
    if (socket.roomId && rooms.has(socket.roomId)) {
      const entry = rooms.get(socket.roomId).find((u) => u.socketId === callerID);
      if (entry) callerUsername = entry.username;
    }

    io.to(userToSignal).emit("user joined", {
      signal,
      callerID,
      username: callerUsername,
    });
  });

  socket.on("returning signal", ({ signal, callerID }) => {
    io.to(callerID).emit("receiving returned signal", {
      signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const { roomId, id: socketId } = socket;

    if (roomId && rooms.has(roomId)) {
      const updated = rooms.get(roomId).filter((u) => u.socketId !== socket.id);
      if (updated.length === 0) {
        rooms.delete(roomId);
      } else {
        rooms.set(roomId, updated);
      }
      socket.to(roomId).emit("user left", socket.id);
    }

    console.log(`[Socket.IO] client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

mongoose
  .connect(
    process.env.Mongo_URI || "mongodb://localhost:27017/collaborative-editor"
  )
  .then(() => console.log("MongoDb Connected"))
  .catch((err) => console.error("[MongoDB] Connection Error:", err));


const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (pathname.startsWith("/yjs")) {
    // The room ID is usually the part after /yjs/
    // If the URL is /yjs/room123, then docName should be room123
    const docName = pathname.replace(/^\/yjs\/?/, "") || "default";

    wss.handleUpgrade(request, socket, head, (ws) => {
      setupWSConnection(ws, request, { docName, gc: true });
    });
  }
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
