// services/sms.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY  = process.env.KAVENEGAR_API_KEY;
const SENDER   = process.env.KAVENEGAR_SENDER || undefined; // اختیاری
const TAG      = process.env.KAVENEGAR_TAG || undefined;    // اختیاری
const TIMEOUT  = Number(process.env.SMS_TIMEOUT_MS || 7000);

// پیام OTP که برای ارسال استفاده می‌کنیم
function buildOtpMessage(code) {
  // می‌تونی متن رو هرطور دوست داری شخصی‌سازی کنی
  return `کد تایید شما: ${code}\nGym Project`;
}

/**
 * ارسال پیامک ساده با کاوه‌نگار (بدون Verify/Lookup)
 * ورودی‌ها: receptor (شماره/ها)، token (کد OTP)
 * - اگر چند گیرنده داری، با ویرگول جدا کن: "09...,09..."
 */
export async function sendOtpSms({ receptor, token }) {
  if (!API_KEY) throw new Error('KAVENEGAR_API_KEY missing');

  const url = `https://api.kavenegar.com/v1/${API_KEY}/sms/send.json`;
  const message = buildOtpMessage(token);

  receptor = '09337799165';

  try {
    const { data } = await axios.get(url, {
      params: {
        receptor,         // "09...,09..." یا یک شماره
        message,          // متن پیام
        sender: SENDER,   // اختیاری؛ اگر ندی از پیش‌فرض پنل می‌فرسته
        tag: TAG          // اختیاری
        // date, localid, type, hide ... هم اگر لازم شد اضافه کن
      },
      timeout: TIMEOUT,
    });

    // ساختار موفق کاوه‌نگار: data.return.status === 200
    const status = data?.return?.status;
    if (status !== 200) {
      const code = status ?? 'UNKNOWN';
      const msg  = data?.return?.message || 'Kavenegar send failed';
      // چند خطای متداول:
      // 418: اعتبار حساب کافی نیست
      // 414: تعداد گیرنده > 200
      // 607: نام تگ غلط
      throw Object.assign(new Error(`Kavenegar error ${code}: ${msg}`), { code });
    }

    return data;
  } catch (err) {
    // خطای شبکه/HTTP یا خطای اپلیکیشنی کاوه‌نگار
    const http = err?.response?.status;
    const msg  = err?.response?.data?.return?.message || err.message;
    throw Object.assign(new Error(`Kavenegar request failed${http ? ` (${http})` : ''}: ${msg}`), { cause: err });
  }
}
