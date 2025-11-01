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
import { signupComplete } from "../../../api/auth"; // ← از بک‌اند

const FloatLabel = ({ visible, title }) =>
  visible ? <Text style={styles.floatingLabel}>{title}</Text> : null;

export default function SignupScreen({ route, navigation }) {
  // از مرحلهٔ OTP
  const signup_token = route?.params?.signup_token || "";

  const [role, setRole] = useState(null); // "coach" | "athlete" | null
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // فوکوس
  const [focusUser, setFocusUser] = useState(false);
  const [focusPass, setFocusPass] = useState(false);
  const [focusRe, setFocusRe] = useState(false);

  // refs
  const passRef = useRef(null);
  const repassRef = useRef(null);

  const valid = useMemo(() => {
    const okRole = role === "coach" || role === "athlete";
    const okUser = user.trim().length > 0;
    const okPassLen = pass.length >= 6;
    const okPair = okPassLen && repass.length > 0 && pass === repass;
    return okRole && okUser && okPair;
  }, [role, user, pass, repass]);

  const onSubmit = async () => {
    if (!valid || loading) return;
    setMsg("");
    setLoading(true);
    try {
      const { user: created } = await signupComplete({
        signup_token,
        full_name: user.trim(),
        password: pass,
        role,
      });

      if (created?.role === "coach") {
        navigation.replace("TrainerProfileSetup");
      } else {
        navigation.replace("Home");
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
            onPress={() => setRole("athlete")}
            style={[
              styles.roleBtn,
              role === "athlete" ? styles.roleActive : styles.roleIdle,
            ]}
          >
            <Text
              style={[
                styles.roleTxt,
                role === "athlete" ? styles.roleTxtActive : styles.roleTxtIdle,
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
          {/* نام کاربری */}
          <View style={styles.block}>
            <FloatLabel
              visible={focusUser || user.length > 0}
              title="نام و نام خانوادگی:"
            />
            <CustomInput
              value={user}
              onChangeText={setUser}
              placeholder={focusUser ? "" : "نام و نام خانوادگی:"}
              onFocus={() => setFocusUser(true)}
              onBlur={() => setFocusUser(false)}
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
              style={[
                styles.input,
                { textAlign: "right", writingDirection: "rtl" },
              ]}
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
              style={[
                styles.input,
                styles.lastInput,
                { textAlign: "right", writingDirection: "rtl" },
              ]}
            />
          </View>

          {!!msg && (
            <Text style={{ color: "#FF4D4F", alignSelf: "flex-end" }}>
              {msg}
            </Text>
          )}
        </View>

        {/* دکمه تایید */}
        <PrimaryButton
          title={loading ? "در حال ثبت‌نام..." : "تأیید"}
          onPress={onSubmit}
          disabled={!valid || loading}
          textColor={valid && !loading ? COLORS.onPrimary : COLORS.text}
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
  header: { alignItems: "center", marginBottom: ms(16), marginTop: ms(29) },
  title: {
    color: COLORS.primary,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(20),
    marginTop: ms(28),
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: ms(36),
    marginBottom: ms(46),
  },
  roleBtn: {
    width: ms(147),
    height: ms(55),
    borderRadius: ms(24),
    alignItems: "center",
    justifyContent: "center",
  },
  roleActive: { backgroundColor: COLORS.primary },
  roleIdle: { backgroundColor: COLORS.disabled },
  roleTxt: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    lineHeight: ms(16),
  },
  roleTxtActive: { color: COLORS.onPrimary },
  roleTxtIdle: { color: COLORS.text },
  form: { marginTop: ms(8) },
  block: { marginBottom: ms(24) },
  floatingLabel: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginBottom: ms(6),
    color: COLORS.label,
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
    backgroundColor: COLORS.inputBg,
  },
  lastInput: { marginBottom: ms(50) },
  cta: {
    position: "absolute",
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
    top: ms(680),
  },
});
