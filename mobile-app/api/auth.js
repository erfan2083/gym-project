import api from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function signupStart(phone) {
  const res = await api.post('/api/auth/signup/start', { phone: phone });
  return res.data; // { otp_id }
}

export async function signupVerify(otp_id, code) {
  const res = await api.post('/api/auth/signup/verify', { otp_id, code });
  return res.data; // { signup_token }
}

export async function signupComplete({ signup_token, full_name, password, role }) {
  const res = await api.post('/api/auth/signup/complete', {
    signup_token, full_name, password, role,
  });
  const { token, user } = res.data;
  await AsyncStorage.setItem('token', token);
  return { token, user };
}

export async function login({ phone, password }) {
  const res = await api.post('api/auth/login', {
    phone: phone, password
  });
  const { token, user } = res.data;
  await AsyncStorage.setItem('token', token);
  return { token, user };
}

export async function logout() {
  await AsyncStorage.removeItem('token');
}
