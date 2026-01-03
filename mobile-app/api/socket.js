import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket = null;
let connectionPromise = null;

export async function getSocket() {
  // اگر سوکت وصل است، برگردان
  if (socket?.connected) {
    return socket;
  }

  // اگر در حال اتصال هستیم، منتظر بمان
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("No token available");
      }

      // اگر سوکت قبلی وجود دارد، قطع کن
      if (socket) {
        socket.disconnect();
        socket = null;
      }

      socket = io("http://192.168.1.8:3000", {
        transports: ["websocket"],
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Socket connection timeout"));
        }, 10000);

        socket.on("connect", () => {
          clearTimeout(timeout);
          console.log("Socket connected:", socket.id);
          resolve();
        });

        socket.on("connect_error", (err) => {
          clearTimeout(timeout);
          console.error("Socket connection error:", err.message);
          reject(err);
        });
      });

      // Setup reconnection handlers
      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
      });

      socket.on("reconnect_error", (err) => {
        console.error("Socket reconnection error:", err.message);
      });

      return socket;
    } catch (error) {
      console.error("Failed to create socket:", error);
      socket = null;
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectionPromise = null;
}

export function isSocketConnected() {
  return socket?.connected ?? false;
}