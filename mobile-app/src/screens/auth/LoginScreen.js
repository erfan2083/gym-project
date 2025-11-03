// src/screens/auth/LoginScreen.js
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Pressable,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";

const FloatLabel = ({ visible, title }) =>
  visible ? <Text style={styles.floatingLabel}>{title}</Text> : null;

const normalizeDigits = (t) => {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return String(t || "")
    .replace(/[۰-۹]/g, (c) => String(fa.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(ar.indexOf(c)))
    .replace(/\D/g, "");
};

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [fPhone, setFPhone] = useState(false);
  const [fPass, setFPass] = useState(false);

  // قوانین: 11 رقم و شروع با 09 + پسورد غیرخالی
  const { phoneOk, valid } = useMemo(() => {
    const p = normalizeDigits(phone);
    const ok = p.length === 11 && p.startsWith("09");
    return { phoneOk: ok, valid: ok && pass.length > 0 };
  }, [phone, pass]);

  // انیمیشن نرم (مثل قبل)
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager?.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [valid]);

  const onLogin = () => {
    if (!valid) return;
    console.log("login:", normalizeDigits(phone), pass);
    // navigation.replace("Home");
  };

  const onSignup = () => {
    navigation.navigate("Signup");
  };

  const onForgot = () => {
    navigation.navigate("ForgotPassword", { phone: normalizeDigits(phone) });
  };

  const showSignup = !valid;

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
        {/* هدر */}
        <View style={styles.header}>
          <LogoWithText
            wrap={styles1.wrap1}
            logoWrap={styles1.logoWrap1}
            logo={styles1.logo1}
            text={styles1.text1}
          />
          <Text style={styles.title}>ورود در فیتنس</Text>
        </View>

        {/* فرم */}
        <View style={{ marginTop: ms(8) }}>
          {/* تلفن */}
          <View style={styles.block}>
            <FloatLabel
              visible={fPhone || phone.length > 0}
              title="شماره تلفن:"
            />
            <CustomInput
              value={phone}
              onChangeText={(t) => setPhone(normalizeDigits(t).slice(0, 11))}
              placeholder={fPhone ? "" : "شماره تلفن:"}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              inputMode="numeric"
              onFocus={() => setFPhone(true)}
              onBlur={() => setFPhone(false)}
              style={[
                styles.input,
                styles.inputFirst,
                phone.length === 0 && !fPhone
                  ? { textAlign: "right", writingDirection: "rtl" }
                  : { textAlign: "left", writingDirection: "ltr" },
                !phoneOk && phone.length > 0 ? styles.errorBorder : null,
              ]}
            />
          </View>

          {/* پسورد */}
          <View style={styles.block}>
            <FloatLabel visible={fPass || pass.length > 0} title="رمز عبور:" />
            <CustomInput
              value={pass}
              onChangeText={setPass}
              placeholder={fPass ? "" : ":رمز عبور"}
              secureTextEntry
              onFocus={() => setFPass(true)}
              onBlur={() => setFPass(false)}
              style={[
                styles.input,
                pass.length === 0 && !fPass
                  ? { textAlign: "right", writingDirection: "rtl" }
                  : { textAlign: "left", writingDirection: "ltr" },
              ]}
              returnKeyType="done"
              onSubmitEditing={onLogin}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable onPress={onForgot} hitSlop={8}>
              <Text style={styles.forgot}>
                رمز عبور خود را فراموش کرده اید؟{" "}
              </Text>
            </Pressable>

            {/* دکمه ورود */}
            <View style={styles.loginWrap}>
              <PrimaryButton
                title="ورود"
                onPress={onLogin}
                disabled={!valid}
                textColor={valid ? COLORS.onPrimary : COLORS.text}
                style={[
                  styles.loginBtn,
                  { backgroundColor: valid ? COLORS.primary : COLORS.disabled },
                  !valid ? styles.loginBtnDisabled : null,
                ]}
              />
            </View>
          </View>

          {/* فقط وقتی نامعتبر است، گزینه عضویت را نشان بده */}
          {showSignup && (
            <View style={{ marginTop: ms(60) }}>
              <Text
                style={{
                  alignSelf: "flex-end",
                  marginRight: ms(13),
                  marginBottom: ms(19),
                  color: COLORS.primary,
                  fontFamily: "Vazirmatn_400Regular",
                  fontSize: ms(15),
                  lineHeight: ms(16),
                }}
              >
                حساب کاربری ندارید؟
              </Text>

              <PrimaryButton
                title="عضویت"
                onPress={onSignup}
                textColor={COLORS.text}
                style={[styles.signupBtn, { backgroundColor: COLORS.primary }]}
              />
            </View>
          )}

          {/* فاصلهٔ انتهایی */}
          <View style={{ height: ms(24) }} />
        </View>
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
    marginTop: ms(38),
    marginBottom: ms(50),
  },
  block: { marginBottom: ms(20) },
  floatingLabel: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginBottom: ms(6),
    color: COLORS.primary,
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
  inputFirst: { marginBottom: ms(25) },
  errorBorder: { borderColor: COLORS.danger },
  forgot: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginTop: ms(18),
    marginBottom: ms(38),
    color: COLORS.primary,
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(14),
    lineHeight: ms(16),
  },
  loginBtn: {
    width: "100%",
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
    justifyContent: "center",
  },
  loginBtnDisabled: { backgroundColor: COLORS.disabled },
  signupBtn: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
  },
  loginWrap: {
    marginTop: ms(10),
  },
});
