import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket;

export async function getSocket() {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem("token");

  socket = io("http://192.168.78.48:3000", {
    transports: ["websocket"],
    auth: { token },
    autoConnect: true,
  });

  return socket;
}
