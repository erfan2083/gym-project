import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { signupComplete } from "../../../api/auth"; // ← اضافه شد

const ORANGE = "#FF7A1A";
const FloatLabel = ({ visible, title }) =>
  visible ? <Text style={styles.floatingLabel}>{title}</Text> : null;

export default function SignupScreen({ route, navigation }) {
  // از مرحلهٔ OTP می‌آد:
  const signup_token = route?.params?.signup_token || "";

  const [role, setRole] = useState(null); // "coach" | "client" | null
  const [fullName, setFullName] = useState("");
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");

  const [focusName, setFocusName] = useState(false);
  const [focusPass, setFocusPass] = useState(false);
  const [focusRe, setFocusRe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // refs برای جابجایی فوکوس
  const passRef = useRef(null);
  const repassRef = useRef(null);

  const valid = useMemo(() => {
    const okRole = role === "client" || role === "coach";
    const okName = fullName.trim().length > 0;
    const okPassLen = pass.length >= 6;     // می‌تونی شرط رو تغییر بدی
    const okPair = okPassLen && repass.length > 0 && pass === repass;
    return okRole && okName && okPair;
  }, [role, fullName, pass, repass]);

  const onSubmit = async () => {
    if (!valid || loading) return;

    setMsg("");
    setLoading(true);
    try {
      const { user } = await signupComplete({
        signup_token,
        full_name: fullName.trim(),
        password: pass,
        role,
      });

      // هدایت بعد از ثبت‌نام:
      // - اگر مربی: می‌تونی ببریش به ساخت پروفایل مربی
      // - اگر ورزشکار: به صفحهٔ اصلی
      if (user?.role === "coach") {
        navigation.replace("TrainerProfileSetup"); // اگه چنین صفحه‌ای داری
      } else {
        navigation.replace("Home"); // یا route دلخواه
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "خطا در تکمیل ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* لوگو و تیتر */}
        <View style={styles.header}>
          <LogoWithText
            wrap={styles1.wrap1}
            logoWrap={styles1.logoWrap1}
            logo={styles1.logo1}
            text={styles1.text1}
          />
          <Text style={styles.title}>عضویت در فیتنس</Text>
        </View>

        {/* سوییچ نقش */}
        <View style={styles.roleRow}>
          <Pressable
            onPress={() => setRole("client")}
            style={[
              styles.roleBtn,
              role === "client" ? styles.roleActive : styles.roleIdle,
            ]}
          >
            <Text
              style={[
                styles.roleTxt,
                role === "client" ? styles.roleTxtActive : styles.roleTxtIdle,
              ]}
            >
              من ورزشکارم
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRole("coach")}
            style={[
              styles.roleBtn,
              role === "coach" ? styles.roleActive : styles.roleIdle,
            ]}
          >
            <Text
              style={[
                styles.roleTxt,
                role === "coach" ? styles.roleTxtActive : styles.roleTxtIdle,
              ]}
            >
              من مربی‌ام
            </Text>
          </Pressable>
        </View>

        {/* فیلدها */}
        <View style={styles.form}>
          {/* نام و نام خانوادگی */}
          <View style={styles.block}>
            <FloatLabel
              visible={focusName || fullName.length > 0}
              title="نام و نام خانوادگی:"
            />
            <CustomInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={focusName ? "" : "نام و نام خانوادگی:"}
              onFocus={() => setFocusName(true)}
              onBlur={() => setFocusName(false)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
              style={styles.input}
            />
          </View>

          {/* رمز عبور */}
          <View style={styles.block}>
            <FloatLabel
              visible={focusPass || pass.length > 0}
              title="رمز عبور:"
            />
            <CustomInput
              ref={passRef}
              value={pass}
              onChangeText={setPass}
              placeholder={focusPass ? "" : ":رمز عبور"}
              onFocus={() => setFocusPass(true)}
              onBlur={() => setFocusPass(false)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => repassRef.current?.focus()}
              style={[styles.input, { textAlign: "right", writingDirection: "rtl" }]}
            />
          </View>

          {/* تکرار رمز عبور */}
          <View style={styles.block}>
            <FloatLabel
              visible={focusRe || repass.length > 0}
              title="تکرار رمز عبور:"
            />
            <CustomInput
              ref={repassRef}
              value={repass}
              onChangeText={setRepass}
              placeholder={focusRe ? "" : ":تکرار رمز عبور"}
              onFocus={() => setFocusRe(true)}
              onBlur={() => setFocusRe(false)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              style={[styles.input, { textAlign: "right", writingDirection: "rtl" }]}
            />
          </View>

          {!!msg && (
            <Text style={{ color: "#FF4D4F", alignSelf: "flex-end" }}>{msg}</Text>
          )}
        </View>

        <PrimaryButton
          title={loading ? "در حال ثبت‌نام..." : "تأیید"}
          onPress={onSubmit}
          disabled={!valid || loading}
          textColor={valid && !loading ? "#F6F4F4" : "#2C2727"}
          style={styles.cta}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: ms(30),
    paddingTop: ms(48),
    paddingBottom: ms(32),
  },
  header: { alignItems: "center", marginBottom: ms(16) },
  title: {
    color: ORANGE,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(20),
    marginTop: ms(38),
  },

  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: ms(46),
    marginBottom: ms(40),
  },
  roleBtn: {
    width: ms(147),
    height: ms(55),
    borderRadius: ms(24),
    alignItems: "center",
    justifyContent: "center",
  },
  roleActive: { backgroundColor: ORANGE },
  roleIdle: { backgroundColor: "#B2B2B2" },
  roleTxt: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    lineHeight: ms(16),
  },
  roleTxtActive: { color: "#F6F4F4" },
  roleTxtIdle: { color: "#2C2727" },

  form: { marginTop: ms(8) },
  block: { marginBottom: ms(28) }, // کمی فشرده‌تر برای جا دادن پیام
  floatingLabel: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginBottom: ms(6),
    color: ORANGE,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(17),
    lineHeight: ms(18),
  },
  input: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#F6F4F4",
  },
  cta: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
    marginTop: ms(12),
  },
});
