// src/screens/auth/OtpScreen.js
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ms } from "react-native-size-matters";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";
import { COLORS } from "../../theme/colors";
import { signupVerify, resetVerify } from "../../../api/auth";

const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toFa = (s) => String(s || "").replace(/\d/g, (d) => FA[+d]);
const normalizeDigits = (t) =>
  String(t || "")
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/\D/g, "");

export default function OtpScreen({ route, navigation }) {
  const otp_id = route?.params?.otp_id || "";
  const purpose = route?.params?.purpose || "signup"; // 'signup' یا 'reset'

  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef(null);
  const length = 5;

  const cells = useMemo(() => {
    const arr = new Array(length).fill("");
    for (let i = 0; i < code.length && i < length; i++) arr[i] = code[i];
    return arr;
  }, [code]);

  const activeIndex = Math.min(code.length, length - 1);
  const isComplete = code.length === length;

  useEffect(() => {
    if (Platform.OS === "android") {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, []);

  const handleChange = (t) => {
    setCode(normalizeDigits(t).slice(0, length));
  };

  const handleSubmit = async () => {
    if (!isComplete || loading) return;
    setMsg("");
    setLoading(true);
    try {
      const fixed = normalizeDigits(code);

      if (purpose === "reset") {
        // جریان فراموشی رمز
        const { reset_token } = await resetVerify(otp_id, fixed);
        setMsg("کد تایید شد ✅");
        // به صفحهٔ تغییر رمز می‌رویم
        navigation.replace("ResetPassword", { reset_token });
      } else {
        // جریان ثبت‌نام (همان رفتار قبلی)
        const { signup_token } = await signupVerify(otp_id, fixed);
        setMsg("کد تایید شد ✅");
        navigation.navigate("Signup", { signup_token });
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "خطا در تایید کد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={24}
        extraHeight={Platform.OS === "android" ? 60 : 0}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", width: "100%" }}>
          <LogoWithText
            wrap={styles1.wrap1}
            logoWrap={styles1.logoWrap1}
            logo={styles1.logo1}
            text={styles1.text1}
          />

          <Text style={styles.label}>کد تایید:</Text>

          <Pressable
            style={styles.row}
            onPress={() => inputRef.current?.focus()}
          >
            {cells.map((d, i) => {
              const active = focused && i === activeIndex;
              return (
                <View
                  key={i}
                  style={[styles.cell, active && styles.cellActive]}
                >
                  <Text style={styles.digit}>{d ? toFa(d) : ""}</Text>
                </View>
              );
            })}
          </Pressable>

          <CustomInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            inputMode="numeric"
            returnKeyType="done"
            maxLength={length}
            style={styles.hiddenInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
            placeholder=""
          />

          {!!msg && <Text style={styles.msg}>{msg}</Text>}
        </View>

        {/* فاصله انتهایی برای بار ژست/کیبورد */}
        <View style={{ height: ms(16) }} />

        <PrimaryButton
          title={loading ? "در حال تایید..." : "تایید"}
          disabled={!isComplete || loading}
          onPress={handleSubmit}
          style={styles.cta}
          textColor={isComplete && !loading ? COLORS.white : COLORS.text}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ms(24),
    paddingTop: ms(72),
    paddingBottom: ms(32),
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
    flexGrow: 1,
  },
  label: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(20),
    lineHeight: ms(20),
    color: COLORS.white,
    marginTop: ms(100),
    marginBottom: ms(30),
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: ms(12),
    marginTop: ms(6),
  },
  cell: {
    width: ms(49.37),
    height: ms(49.37),
    borderRadius: ms(12),
    backgroundColor: COLORS.inputBg,
    borderWidth: ms(2),
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: { borderColor: COLORS.primary },
  digit: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(22),
    lineHeight: ms(22),
    color: COLORS.text,
  },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  cta: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
    marginBottom: ms(70),
  },
  msg: {
    marginTop: ms(16),
    color: COLORS.white,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
  },
});
