// npm i axios @react-native-async-storage/async-storage
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://192.168.198.48:3000",
  timeout: 15000,
});
//192.168.198.48
//172.20.10.3:3000
//10.89.75.29
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
