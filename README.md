<<<<<<< HEAD

# DevRoom: Live Coding Education Platform

DevRoom is a high-performance, real-time collaborative coding and whiteboarding platform designed for live education sessions. It allows instructors to host coding rooms, push programming challenges, draw on a shared whiteboard, and monitor students in real-time, while allowing students to switch between a synchronized shared view and their own private code playground.

---

## 🚀 Key Features

- **Real-time Collaborative Code Editor**: Integration with Monaco Editor synced using Yjs CRDTs, providing a smooth Google Docs-like editing experience with cursor presence awareness.
- **Dual-Workspace Isolation (Shared vs. Private)**:
  - _Shared View_: Students watch the instructor type in real-time (read-only for learners, writeable for hosts).
  - _My Workspace_: Students can branch out and write, test, and debug their own solution locally.
- **Smart Auto-Forking**: When the instructor pushes a new coding challenge or boilerplate update, the platform automatically takes a snapshot of the shared state and copies it into each student's private workspace.
- **Synchronized Interactive Whiteboard**: A vector-based whiteboard canvas that allows hosts to draw diagrams, sync drawings instantly via Y.Array, and wipe the canvas clean.
- **In-Browser Sandbox Console**: Run JS code in a visual console interface that intercepts outputs and verifies results against standard test constraints.
- **Hardened Security Infrastructure**:
  - _CSRF Protection_: Strict validation of `Origin` and `Referer` headers on all state-changing endpoints.
  - _Brute-Force Mitigation_: Rate limiting of login attempts to 5 attempts per 15 minutes.
  - _Secure Authentication_: Sessions stored in `HttpOnly`, `Secure`, and `SameSite=Strict` JWT cookies, and password hashing using bcrypt with 12 rounds.
  - _Host Room Termination_: When the host leaves, the server transitions the room database status to `finished` and automatically closes all client websocket connections.

---

## ⚙️ Detailed Working & Implementation

```text
                  +---------------------------------------+
                  |         Instructor Web Client         |
                  +-------------------+-------------------+
                                      | (Whiteboard/Shared Editor Sync)
                                      v
+------------------+     upgrade      +-------------------+
|  Express Server  +----------------->+ WebSocket Server  |
|  (Auth / Rooms)  |                  | (Yjs Sync Hub)    |
+--------+---------+                  +---------+---------+
         |                                      |
         v (Mongoose Schema Check)              v (Broadcast Sync)
+--------+---------+                  +---------+---------+
|     MongoDB      |                  | Student Web Client|
| (Users / Rooms)  |                  +-------------------+
+------------------+
```

### 1. Collaborative Document Syncing (Yjs & WebSockets)

The backend ([server.js](file:///d:/data_scrape/Live%20Coding%20Education%20Platform/backend/server.js)) exposes a websocket server under `/yjs`. When a workspace room is opened, clients establish a websocket provider connection mapping to `room-${roomId}-shared`.
Using `y-monaco` and `y-websocket` libraries, text changes in Monaco Editor are bound to a shared `Y.Text` document instance, ensuring mathematical convergence on all edits across different networks.

### 2. Auto-Fork & Private Playground Sync

The frontend [YjsContext.jsx](file:///d:/data_scrape/Live%20Coding%20Education%20Platform/src/context/YjsContext.jsx) initiates two `Y.Doc` instances:

- `sharedDoc` (bound to the websocket connection).
- `privateDoc` (purely in-memory).

A watcher observes update transactions on `sharedDoc`. When the host pushes a new problem set:

1. The server updates the database status of the room to `active`.
2. The host updates the `problemText` and writes a new `problemPushId` to the `sharedDoc` metadata mapping.
3. The watcher detects this new ID, takes a binary snapshot of `sharedDoc` (`Y.encodeStateAsUpdate`), and applies it directly to `privateDoc`. This copies the instructor's starter code into the student's local sandbox, allowing them to solve the problem independently.

---

## 📋 System Requirements

- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local or cloud instance (e.g., MongoDB Atlas) running on port `27017`
- **Web Browser**: Any modern browser supporting WebSockets and ES6 Modules

---

## 🛠️ Getting Started & Setup

### 1. Install Dependencies

Clone the repository, navigate to the project root, and install the modules:

```bash
cd "Live Coding Education Platform"
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `Live Coding Education Platform` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/live-coding
JWT_SECRET=your_high_entropy_jwt_secret_key_here
NODE_ENV=development
```

_(Note: `.env` is automatically ignored from git version control via `.gitignore` to protect production secrets)._

### 3. Run the Servers

Start the database integration and Express application server:

```bash
npm run server
```

In a separate terminal, start the Vite frontend development server:

```bash
npm run dev
```

# Open [http://localhost:5173](http://localhost:5173) in your browser to access the lobby.

# Collaborative Development Suite

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Chakra UI](https://img.shields.io/badge/Chakra--UI-2.10-319795?style=for-the-badge&logo=chakra-ui)](https://v2.chakra-ui.com/)
[![License-MIT](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](LICENSE)

A high-performance, unified engineering workspace that integrates **real-time code editing**, **infinite whiteboarding**, and **spatial voice chat** into a single, immersive "Obsidian" glassmorphic interface.

---

## Project Showcase

> [!TIP]
> This platform is designed for teams who need more than just a code editor. It's a complete ecosystem for technical brainstorming, live pairing, and architectural planning.

---

## Core Capabilities

### Peer-to-Peer Code Workspace

- **Monaco Engine**: Industrial-strength editing with syntax support for 100+ languages and intelligent autocomplete.
- **Live Propagation**: Sub-millisecond state synchronization across any number of peers using **Yjs CRDTs**.
- **Persistent Terminal**: An always-on execution console in a resizable right-sidebar, providing immediate runtime feedback.

### Infinite Collaborative Board

- **Edge-to-Edge Workspace**: A vast 2500x1800 canvas optimized for complex architectural diagrams and freehand sketches.
- **Smart Canvas**: Integrated shape tools (Circle/Rect), custom brush textures, and advanced zoom logic (0.5x to 3x).
- **Session Continuity**: High-fidelity canvas state preservation ensures your drawings are exactly where you left them.

### Spatial Voice Conferencing

- **LiveLink Audio**: Low-latency, peer-to-peer WebRTC voice rooms for drop-in technical discussions.
- **Glassmorphic Controls**: A floating pill-style footer provides rapid mic toggling and presence monitoring.
- **Network Intelligence**: Real-time collaborative avatars showing who’s active, who's muted, and who just joined.

---

## Architectural Blueprint

### High-Level Tech Stack

- **Frontend**: React 19 (Hooks/Context), Vite (Build), Chakra UI (Design System), Framer Motion (Animations).
- **Real-time Logic**: Yjs (CRDT synchronization), Socket.IO (Signaling), simple-peer (WebRTC).
- **Persistence**: Node.js, Express, MongoDB (Aggregated session history and account security).

### Design Philosophy: "The Obsidian System"

Built the suite with a focus on **visual excellence** and **interaction density**:

- **Glassmorphism**: 25px blur levels on all high-level control panels.
- **Pill UI**: Detached, rounded floating elements that provide a sense of "layered" depth.
- **Micro-interactions**: Subtle hover scales and glow keyframes for intuitive feedback.

---

## ⚠️ Robustness & Known Edge Cases

To ensure a smooth experience, take note of the following architectural constraints and potential failure points:

### 1. Networking & WebRTC

> [!WARNING]
> **Firewalls & NAT**: In some restricted network environments, direct peer-to-peer WebRTC connections may fail. This implementation uses public STUN servers. For guaranteed production reliability, integrating a **TURN server** is recommended.

### 2. Synchronization (Yjs)

- **High Latency Recovery**: Yjs is highly resilient, but extreme network instability may cause temporary "ghost" cursors until the peer re-syncs. The system is designed to converge automatically without data loss.

### 3. Environment Dependencies

- **JWT Integrity**: The server performs a strict check for `JWT_SECRET` on startup. If missing, the process will terminate to prevent insecure sessions.
- **Persistence**: While collaboration is real-time, room discovery and authentication require an active **MongoDB** connection.

### 4. Browser Compatibility

- This suite utilizes modern Node.js polyfills. Best performance is achieved on the latest versions of Chrome, Edge, or Firefox.

---

## 🛠️ Execution Guide

### 1. Prerequisites

- **Node.js**: v18 or later
- **MongoDB**: Active instance (Local or Atlas)
- **Environment**: A `.env` file in `/server` containing `Mongo_URI`, `PORT`, and a secure `JWT_SECRET`.

### 2. Deploy Backend

```bash
cd server
npm install
npm start
```

### 3. Deploy Frontend

```bash
# From the root directory
npm install
npm run dev
```

> > > > > > > a9858fce53e89caf6bc22def26bb1f0522c6343f
