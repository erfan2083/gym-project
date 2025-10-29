// controllers/authController.js
import pool from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { normalizePhone } from '../utils/phone.js';
import { generateOtpCode, hashOtpCode } from '../utils/otp.js';
import { sendOtpSms } from '../services/sms.js';
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// POST /auth/signup/start  { phone }
export async function signupStart(req, res) {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone is required' });

    phone = normalizePhone(phone);

    // اگر کاربر موجوده و نقش مهم نبود، می‌تونی خطا بدهی یا اجازه بدی برای login otp
    // اینجا: برای ثبت‌نام، اگر موجود بود خطا می‌دهیم
    const exists = await pool.query(
      'SELECT 1 FROM "gym-project"."User" WHERE phone_number = $1 LIMIT 1',
      [phone]
    );
    if (exists.rowCount > 0) {
      return res.status(409).json({ message: 'Phone already registered' });
    }

    // تولید کد و هش
    const code = generateOtpCode();            // "03452" مثلا
    const codeHash = hashOtpCode(code);        // HMAC-SHA256

    // TTL مثلا 180 ثانیه
    const ttlSeconds = 180;

    // CALL request_otp(..., OUT o_otp_id) -> row برنمی‌گرداند
    await pool.query(
      'CALL "gym-project".request_otp($1,$2,$3,$4,$5,$6)',
      [phone, 'signup', codeHash, ttlSeconds, null, null] // آخرین null برای OUT placeholder است؛ pg نادیده‌اش می‌گیرد
    );

    // پس از CALL، رکورد جدید OTP را بخوانیم تا id را بگیریم
    const otpRes = await pool.query(
      `SELECT id FROM "gym-project".otp_code
       WHERE phone_number=$1 AND purpose='signup' AND consumed=false AND verified=false
       ORDER BY id DESC LIMIT 1`,
      [phone]
    );
    const otpId = otpRes.rows[0]?.id;
    if (!otpId) return res.status(500).json({ message: 'OTP creation failed' });

    // ارسال پیامک با کاوه‌نگار
    await sendOtpSms({ receptor: phone, token: code });

    return res.json({ otp_id: otpId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

// POST /auth/signup/verify   { otp_id, code }
export async function signupVerify(req, res) {
  try {
    const { otp_id, code } = req.body;
    if (!otp_id || !code) {
      return res.status(400).json({ message: 'otp_id and code are required' });
    }

    const codeHash = hashOtpCode(code);

    // CALL verify_otp(otp_id, code_hash, OUT ok, OUT server_token)
    await pool.query(
      'CALL "gym-project".verify_otp($1,$2,$3,$4)',
      [otp_id, codeHash, null, null]
    );

    // بعد از CALL وضعیت را از جدول بخوان:
    const row = await pool.query(
      `SELECT verified, server_token FROM "gym-project".otp_code WHERE id=$1`,
      [otp_id]
    );
    const verified = row.rows[0]?.verified;
    const serverToken = row.rows[0]?.server_token;
    if (!verified || !serverToken) {
      return res.status(401).json({ message: 'Invalid code' });
    }

    return res.json({ signup_token: serverToken });
  } catch (err) {
    // ممکنه پروسیجر exception بده: 'OTP expired or consumed' ...
    console.error(err);
    return res.status(400).json({ message: 'Verification failed', detail: err.message });
  }
}

// POST /auth/signup/complete  { signup_token, full_name, password, role }
export async function signupComplete(req, res) {
  try {
    const { signup_token, full_name, password, role } = req.body;
    if (!signup_token || !full_name || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // hash password
    const hash = await bcrypt.hash(password, 10);

    // CALL complete_signup_with_token(..., OUT user_id)
    await pool.query(
      'CALL "gym-project".complete_signup_with_token($1,$2,$3,$4,$5)',
      [signup_token, full_name, hash, role, null]
    );

    // user_id را بخوانیم (از طریق شماره داخل otp_code)
    const userRow = await pool.query(
      `SELECT u.id, u.full_name, u.phone_number, u.role
       FROM "gym-project".otp_code o
       JOIN "gym-project"."User" u ON u.phone_number = o.phone_number
       WHERE o.server_token = $1
       ORDER BY u.id DESC
       LIMIT 1`,
      [signup_token]
    );

    const user = userRow.rows[0];
    if (!user) return res.status(500).json({ message: 'User creation not found' });

    // JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Signup completed',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone_number,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Complete signup failed', detail: err.message });
  }
}

// POST /auth/login   { phone, password }
export async function login(req, res) {
  try {
    let { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'phone and password are required' });
    }
    phone = normalizePhone(phone);

    const result = await pool.query(
      'SELECT * FROM "gym-project".get_user_by_phone($1)',
      [phone]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid phone or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid phone or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone_number,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}
