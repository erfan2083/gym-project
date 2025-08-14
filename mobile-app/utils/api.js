import axios from 'axios';

const API_URL = 'http://192.168.1.100:5000/api'; // آدرس سرور خودت رو بزار

export const signup = async (fullName, email, password) => {
  return await axios.post(`${API_URL}/auth/signup`, { fullName, email, password });
};

export const login = async (email, password) => {
  return await axios.post(`${API_URL}/auth/login`, { email, password });
};
