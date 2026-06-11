# DevRoom: Live Coding Education Platform

DevRoom is a high-performance, real-time collaborative coding and whiteboarding platform designed for live education sessions. It allows instructors to host coding rooms, push programming challenges, draw on a shared whiteboard, and monitor students in real-time, while allowing students to switch between a synchronized shared view and their own private code playground.

---

## Technology Stack

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Material-UI](https://img.shields.io/badge/MUI-9.0-007FFF?style=flat-square&logo=mui)](https://mui.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco--Editor-0.55-blue?style=flat-square&logo=visual-studio-code)](https://microsoft.github.io/monaco-editor/)
[![Yjs CRDT](https://img.shields.io/badge/Yjs-CRDT-orange?style=flat-square)](https://yjs.dev/)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws-lightgrey?style=flat-square)](https://github.com/websockets/ws)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.3-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Container-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

---

## Core Capabilities & Features

### Workspace & Collaboration
* **Attractive 3D Spline UI Design**
  Incorporates an interactive Spline-based 3D scene directly into the lobby and registration portal. This creates a state-of-the-art visual atmosphere that immediately engages users as they join the platform.
* **Shared Host & Participant Environment**
  Bridges instructors and students into a unified workspace featuring synchronized views, real-time feedback, and joint cursors. This collaborative environment keeps learners aligned with the host's focus during interactive coding lectures.
* **Dual-Workspace Sessions (Shared vs. Private)**
  Spawns independent document instances (`sharedDoc` and `privateDoc`) for every connected participant. This lets students switch between watching the instructor's board and working on their private playground.
* **Personal Sandbox Console**
  Provides each student with a local sandbox environment in the right sidebar console. This allows participants to write and debug code locally without interfering with the public shared room editor.

### Interactive Sync & Logic
* **Yjs-Synced Tldraw Canvas**
  Integrates an infinite vector whiteboard board using a Tldraw library import bound to Yjs shared arrays. Students and hosts brainstorm, sketch diagrams, and collaborate visually with sub-millisecond drawing state propagation.
* **Conditional Problem Propagation**
  Automatically propagates new coding boilerplates using the Yjs array method when the host pushes a new coding challenge. A gated check checks if the incoming problem ID has changed, preventing overwrite loops.
* **MongoDB Persistent Room State**
  Ensures each collaborative coding workspace state is saved and preserved in a MongoDB database. This allows sessions to maintain continuity so that no whiteboard strokes or editor codes are lost between connections.
* **Lifecycle Room Management**
  Efficiently handles active, pending, and inactive rooms through dedicated lifecycle endpoints. The system transitions room statuses to `finished` upon host exit, ensuring proper garbage collection and connection teardown.

### Runtime, Sandbox & Security
* **Role-Based Access Control**
  Enforces strict permission validation between instructors (hosts) and students (participants). Hosts maintain write-access to shared structures and whiteboard cleans, while students operate in a synchronized read-only mode.
* **Modern Monaco Editor IDE**
  Employs the Monaco Editor engine to provide syntax highlighting, code folding, and auto-completions for over 100 languages. This matches the professional development capabilities of industrial-strength desktop environments.
* **Dockerized Sandbox Execution**
  Runs sandboxed user code execution inside secure, isolated Docker containers against predefined input constraints. Intercepted logs and return values are verified against curated test cases to ensure strict code validation.
* **No-Code AI Review Method**
  Offers context-aware AI review and code optimization suggestions only when a user's code execution fails. To promote student learning, the AI never leaks the solution code, describing only the logic and optimization.
* **Automated PDF Export on Exit**
  Compiles the final Monaco code and whiteboard canvas state into a unified PDF file upon host room termination. The exported PDF document is automatically saved back to MongoDB for permanent session tracking.
* **Hardened Secure Environment**
  Implements bulletproof security including CSRF header validation, login rate-limiting (5 attempts/15 min), and HttpOnly cookie-based JWT sessions. Strict Origin checks on state-changing endpoints protect room metadata from cross-site scripting.

---

## Detailed Working & Architecture

The architecture follows a client-server-database paradigm optimized for low-latency synchronization. A Node.js and Express backend handles HTTP routing for authentication and room metadata management while wrapping a WebSocket server powered by the `ws` library. MongoDB serves as the persistent datastore to maintain session history, credentials, and room configurations. When clients open a workspace, they establish a real-time WebSocket connection to synchronization hubs. Instructors orchestrate the room flow by pushing problem challenges, which triggers the backend server to update DB status and replicate starter configurations. Yjs CRDTs mathematically converge edits across all clients to keep participants synchronized with the host.

### 1. Collaborative Document Syncing (Yjs & WebSockets)
The backend ([server.js](file:///d:/DevRooms/backend/server.js)) exposes a websocket server under `/yjs`. When a workspace room is opened, clients establish a websocket provider connection mapping to `room-${roomId}-shared`.
Using `y-monaco` and `y-websocket` libraries, text changes in Monaco Editor are bound to a shared `Y.Text` document instance, ensuring mathematical convergence on all edits across different networks.

### 2. Auto-Fork & Private Playground Sync
The frontend [YjsContext.jsx](file:///d:/DevRooms/src/context/YjsContext.jsx) initiates two `Y.Doc` instances:
* `sharedDoc` (bound to the websocket connection).
* `privateDoc` (purely in-memory).

A watcher observes update transactions on `sharedDoc`. When the host pushes a new problem set:
1. The server updates the database status of the room to `active`.
2. The host updates the `problemText` and writes a new `problemPushId` to the `sharedDoc` metadata mapping.
3. The watcher detects this new ID, takes a binary snapshot of `sharedDoc` (`Y.encodeStateAsUpdate`), and applies it directly to `privateDoc`. This copies the instructor's starter code into the student's local sandbox, allowing them to solve the problem independently.

---

## System Requirements

* **Node.js**: v18.0.0 or higher
* **MongoDB**: Local or cloud instance (e.g., MongoDB Atlas) running on port `27017`
* **Web Browser**: Any modern browser supporting WebSockets and ES6 Modules

---

## Getting Started & Setup

### 1. Install Dependencies

Clone the repository, navigate to the project root, and install the modules:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

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

Open [http://localhost:5173](http://localhost:5173) in your browser to access the lobby.
