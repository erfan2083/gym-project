// src/screens/auth/SignupScreen.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ms } from "react-native-size-matters";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { signupComplete } from "../../../api/auth";

const FloatLabel = ({ visible, title }) =>
  visible ? <Text style={styles.floatingLabel}>{title}</Text> : null;

export default function SignupScreen({ route, navigation }) {
  const signup_token = route?.params?.signup_token || "";

  const [role, setRole] = useState(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [focusUser, setFocusUser] = useState(false);
  const [focusPass, setFocusPass] = useState(false);
  const [focusRe, setFocusRe] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showRe, setShowRe] = useState(false);

  const passRef = useRef(null);
  const repassRef = useRef(null);

  const valid = useMemo(() => {
    const okRole = role === "coach" || role === "client";
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
        navigation.replace("ProfileForm")
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
            <View style={styles.inputWrap}>
              <CustomInput
                ref={passRef}
                value={pass}
                onChangeText={setPass}
                placeholder={focusPass ? "" : "رمز عبور:"}
                onFocus={() => setFocusPass(true)}
                onBlur={() => setFocusPass(false)}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => repassRef.current?.focus()}
                style={[
                  styles.inputWithIcon,
                  // ✅ خالی و بدون فوکوس: placeholder راست/RTL
                  pass.length === 0 && !focusPass
                    ? { textAlign: "right", writingDirection: "rtl" }
                    : { textAlign: "left", writingDirection: "ltr" }, // ✅ متن LTR
                ]}
              />
              <Pressable
                onPress={() => setShowPass((s) => !s)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={COLORS.text}
                />
              </Pressable>
            </View>
          </View>

          {/* تکرار رمز عبور */}
          <View style={styles.block}>
            <FloatLabel
              visible={focusRe || repass.length > 0}
              title="تکرار رمز عبور:"
            />
            <View style={styles.inputWrap}>
              <CustomInput
                ref={repassRef}
                value={repass}
                onChangeText={setRepass}
                placeholder={focusRe ? "" : "تکرار رمز عبور:"}
                onFocus={() => setFocusRe(true)}
                onBlur={() => setFocusRe(false)}
                secureTextEntry={!showRe}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                style={[
                  styles.inputWithIcon,
                  styles.lastInput,
                  // ✅ خالی و بدون فوکوس: placeholder راست/RTL
                  repass.length === 0 && !focusRe
                    ? { textAlign: "right", writingDirection: "rtl" }
                    : { textAlign: "left", writingDirection: "ltr" }, // ✅ متن LTR
                ]}
              />
              <Pressable
                onPress={() => setShowRe((s) => !s)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showRe ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={COLORS.text}
                />
              </Pressable>
            </View>
          </View>

          {!!msg && (
            <Text style={{ color: COLORS.danger, alignSelf: "flex-end" }}>
              {msg}
            </Text>
          )}
        </View>

        {/* فاصله قبل از دکمه */}
        <View style={styles.footerSpacer} />

        {/* دکمه تایید */}
        <PrimaryButton
          title={loading ? "در حال ثبت‌نام..." : "تایید"}
          onPress={onSubmit}
          disabled={!valid || loading}
          textColor={valid && !loading ? COLORS.onPrimary : COLORS.text}
          style={[
            styles.cta,
            {
              backgroundColor:
                valid && !loading ? COLORS.primary : COLORS.disabled,
            },
            (!valid || loading) && { opacity: 0.9 },
          ]}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    justifyContent: "center",
    gap: ms(38),
    marginTop: ms(36),
    marginBottom: ms(76),
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
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(16),
    lineHeight: ms(16),
  },
  roleTxtActive: { color: COLORS.inputBg },
  roleTxtIdle: { color: COLORS.text },
  form: { marginTop: ms(8) },
  block: { marginBottom: ms(34) },
  floatingLabel: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginBottom: ms(6),
    color: COLORS.label,
    fontFamily: "Vazirmatn_400Regular",
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
  inputWithIcon: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: COLORS.inputBg,
    paddingLeft: ms(56),
    paddingRight: ms(20),
  },
  inputWrap: {
    position: "relative",
    width: ms(320),
    height: ms(55),
  },
  eyeBtn: {
    position: "absolute",
    left: ms(12),
    top: "50%",
    transform: [{ translateY: -14 }],
    height: ms(28),
    width: ms(28),
    alignItems: "center",
    justifyContent: "center",
  },
  lastInput: { marginBottom: ms(12) },
  footerSpacer: { height: ms(64) },
  cta: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
    marginBottom: ms(16),
  },
});
