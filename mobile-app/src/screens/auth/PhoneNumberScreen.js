import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";

import PhoneField from "../../components/PhoneField";
import PhoneSubmit from "../../components/PhoneSubmit";

// اگر normalizeDigits فقط تبدیل رقم است، بهتره یک normalizePhone هم داشته باشی
import {
  validatePhone,
  normalizeDigits /* normalizePhone */,
} from "../../../utils/phone";
import { signupStart } from "../../../api/auth";

export default function PhoneNumberScreen({ navigation }) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const { valid, errors } = useMemo(() => validatePhone(value), [value]);
  const showError = touched && errors.length > 0;

  const onSubmit = async () => {
    if (!valid || loading) return; // جلوگیری از دابل‌کلیک
    setMsg("");
    setLoading(true);

    // 1) تبدیل اعداد فارسی/عربی → انگلیسی
    const digitsOnly = normalizeDigits((value || "").trim());

    // 2) اگر تابع نرمال‌سازی کامل داری، استفاده کن:
    // const phone = normalizePhone(digitsOnly);
    const phone = digitsOnly;

    // ✅ DEV BYPASS: بدون هیچ تماس سرور، مستقیم برو Signup
    if (phone === "09999999999") {
      navigation.navigate("ResetPas", { phone, otp_id: null, skipOtp: true });
      setLoading(false);
      return;
    }

    try {
      // فلو معمول: تماس با بک‌اند
      const { otp_id } = await signupStart(phone);

      // اگر فعلاً OTP رو حذف کردی و میخوای مستقیم بری Signup:
      navigation.navigate("Signup", { phone, otp_id, skipOtp: true });

      // اگر خواستی برگردونی به OTP، خط بالا رو کامنت و خط زیر رو آنکامنت کن:
      // navigation.navigate("Otp", { otp_id, phone });
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "خطا در ارسال کد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <LogoWithText
            wrap={styles1.wrap1}
            logoWrap={styles1.logoWrap1}
            logo={styles1.logo1}
            text={styles1.text1}
          />
        </View>

        <View style={styles.inputPos}>
          <PhoneField
            value={value}
            onChange={(v) => {
              if (!touched) setTouched(true);
              setValue(v);
            }}
            showError={showError}
          />
          {showError && <Text style={styles.errorText}>{errors[0]}</Text>}
          {!!msg && <Text style={styles.errorText}>{msg}</Text>}
        </View>

        <View style={styles.buttonPos}>
          <PhoneSubmit
            disabled={!valid || loading}
            onPress={onSubmit}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: "center", marginTop: ms(48) },
  inputPos: { position: "absolute", top: ms(287), left: ms(35), right: ms(35) },
  buttonPos: {
    position: "absolute",
    top: ms(659),
    left: ms(35),
    right: ms(35),
  },
  errorText: {
    marginTop: ms(8),
    alignSelf: "flex-end",
    marginRight: ms(10),
    color: "#FF4D4F",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    lineHeight: ms(16),
  },
});
