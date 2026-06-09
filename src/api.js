import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
    (error) => Promise.reject(error)
);

export const login = (data) => API.post("/auth/login", data);
export const register = (data) => API.post("/auth/register", data);

export const getUser = (username) => API.get(`/auth/user/${username}`);

export const createRoom = (data) => API.post("/rooms", data);
export const getRoom = (id) => API.get(`/rooms/${id}`);
export const joinRoom = (data) => API.post("/rooms/join", data);
