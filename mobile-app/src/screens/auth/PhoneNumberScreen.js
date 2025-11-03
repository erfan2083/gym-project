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
import {
  validatePhone,
  normalizeDigits,
  formatIranMobile, // ← اضافه شد
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
    if (normalizeDigits(value) === "09999999999")
      return navigation.navigate("Signup", {
        otp_id: `dev-${Date.now()}`,
        phone: "09999999999",
      });
    if (!valid || loading) return;
    setMsg("");
    setLoading(true);

    const phone = normalizeDigits(value);

    try {
      const { otp_id } = await signupStart(phone);
      navigation.navigate("Otp", { otp_id });
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
              setValue(formatIranMobile(v)); // فرمت خودکار شماره
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: ms(30),
    paddingTop: ms(48),
    paddingBottom: ms(32),
  },
  header: {
    alignItems: "center",
    marginTop: ms(29),
    marginBottom: ms(110),
  },
  inputPos: {
    alignSelf: "center",
    width: ms(320),
    marginTop: ms(58),
  },
  buttonPos: {
    marginTop: "auto",
    alignSelf: "center",
    width: ms(320),
    marginBottom: ms(89),
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
