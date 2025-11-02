export const normalizeDigits = (t) => {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return String(t || "")
    .replace(/[۰-۹]/g, (c) => String(fa.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(ar.indexOf(c)))
    .replace(/\D/g, "");
};
export const chunkDigits = (digits, pattern = [4, 3, 4], sep = " ") => {
  const out = [];
  let i = 0;
  for (const size of pattern) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + size));
    i += size;
  }
  return out.filter(Boolean).join(sep);
};
export const formatIranMobile = (input) => {
  const d = normalizeDigits(input).slice(0, 11);
  return chunkDigits(d, [4, 3, 4], " ");
};
export const validatePhone = (val) => {
  const v = normalizeDigits(val);
  const isValid = /^09\d{9}$/.test(v);
  if (v.length === 0) return { valid: false, errors: [] };
  return {
    valid: isValid,
    errors: isValid ? [] : ["شماره موبایل معتبر نیست."],
  };
};
