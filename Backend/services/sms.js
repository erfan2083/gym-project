// services/sms.js
import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.KAVENEGAR_API_KEY;
const TEMPLATE = process.env.KAVENEGAR_TEMPLATE;
const TYPE = process.env.KAVENEGAR_TYPE || 'sms';

export async function sendOtpSms({ receptor, token }) {
  if (!API_KEY || !TEMPLATE) {
    throw new Error('KAVENEGAR_API_KEY or KAVENEGAR_TEMPLATE missing');
  }
  const url = `https://api.kavenegar.com/v1/${API_KEY}/verify/lookup.json`;

  const params = {
    receptor,
    token,      // همون کد ۵ رقمی
    template: TEMPLATE,
    type: TYPE, // اختیاری
  };

  const res = await axios.get(url, { params });
  // انتظار: res.data.return.status === 200
  return res.data;
}
