import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; 

export const signup = async (fullName, email, password, role) => {
  return await axios.post(`${API_URL}/auth/signup`, { fullName, email, password, role });
};

export const login = async (email, password) => {
  return await axios.post(`${API_URL}/auth/login`, { email, password });
};


export const couchProfile = async (userId, bio, specialties, experience_years, price_per_month) => {
  return await axios.post(`${API_URL}/auth/couchProfile`, { userId, bio, specialties, experience_years, price_per_month });
};