// src/config.js
// Enforces a strict safe singular connection with no fallbacks.

const resolvedOrigin = import.meta.env.VITE_SERVER_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");

if (!resolvedOrigin) {
  throw new Error("Config validation failed: VITE_SERVER_BASE_URL or window.location.origin is required.");
}

export const SERVER_HTTP_URL = resolvedOrigin;
export const SERVER_WS_URL = resolvedOrigin.replace(/^http/, "ws");