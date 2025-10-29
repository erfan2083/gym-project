// utils/phone.js
export const normalizeDigits = (t) => {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return String(t || "")
    .replace(/[۰-۹]/g, (c) => String(fa.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(ar.indexOf(c)))
    .replace(/\D/g, "");
};

export const validatePhone = (val) => {
  const v = normalizeDigits(val);
  const errors = [];

  if (v.length === 0) return { valid: false, errors: [] };

  if (v.length === 1) {
    if (v[0] !== "0") errors.push("شماره باید با 09 شروع شود.");
  } else {
    if (!v.startsWith("09")) errors.push("شماره باید با 09 شروع شود.");
  }

  if (v.length > 2 && v.length !== 11) {
    errors.push("شماره باید دقیقاً ۱۱ رقم باشد.");
  }

  return { valid: v.length === 11 && v.startsWith("09"), errors };
};
