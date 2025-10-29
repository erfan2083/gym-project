// utils/otp.js
import crypto from 'crypto';

// تولید کد ۵ رقمی با پَد صفر
export function generateOtpCode() {
  const n = Math.floor(Math.random() * 100000); // 0..99999
  return n.toString().padStart(5, '0');
}

// هش تعیین‌گر (deterministic) با HMAC-SHA256
export function hashOtpCode(code) {
  const secret = process.env.OTP_SECRET;
  if (!secret) throw new Error('OTP_SECRET missing');
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}
