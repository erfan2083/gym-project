// utils/phone.js
export function normalizePhone(input) {
  if (!input) return input;
  let p = input.replace(/[^\d+]/g, ''); // remove spaces/dashes/etc
  // مثال: اگر با 0098 شروع شده -> +98
  if (p.startsWith('0098')) p = '+98' + p.slice(4);
  // اگر با 0 شروع شد و ایران است، به +98 تبدیل کن
  if (p.startsWith('0')) p = '+98' + p.slice(1);
  // اگر بدون + بود و 98 شروع می‌شد
  if (/^98\d+/.test(p)) p = '+' + p;
  return p;
}
