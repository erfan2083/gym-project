import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; 

export const signup = async (fullName, email, password) => {
  return await axios.post(`${API_URL}/auth/signup`, { fullName, email, password, role });
};

export const login = async (email, password) => {
  return await axios.post(`${API_URL}/auth/login`, { email, password });
};
