// src/config.js
// Centralized server URLs so multi-device collaboration works.

const envBase = import.meta.env.VITE_SERVER_BASE_URL; // e.g. http://192.168.1.20:5000 or https://mydomain.com
const envHost = import.meta.env.VITE_SERVER_HOST;     // e.g. 192.168.1.20
const envPort = import.meta.env.VITE_SERVER_PORT;     // e.g. 5000

const hostname =
    envHost ||
    (typeof window !== "undefined" ? window.location.hostname : "localhost");
const port = envPort || "5000";

const pageProtocol =
    typeof window !== "undefined" ? window.location.protocol : "http:";
const wsProtocol = pageProtocol === "https:" ? "wss:" : "ws:";

export const SERVER_HTTP_URL =
    envBase || `${pageProtocol}//${hostname}:${port}`;

export const SERVER_WS_URL = envBase
    ? envBase.replace(/^http/, "ws")
    : `${wsProtocol}//${hostname}:${port}`;