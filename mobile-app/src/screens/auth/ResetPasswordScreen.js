// src/screens/auth/ResetPasswordScreen.js
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
import { Ionicons } from "@expo/vector-icons"; // Expo: آماده است
import { COLORS } from "../../theme/colors";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";

const FloatLabel = ({ visible, title }) =>
  visible ? <Text style={styles.floatingLabel}>{title}</Text> : null;

export default function ResetPasswordScreen({ navigation }) {
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
  const [f1, setF1] = useState(false);
  const [f2, setF2] = useState(false);
  const [show1, setShow1] = useState(false); // 👈 نمایش/مخفی فیلد 1
  const [show2, setShow2] = useState(false); // 👈 نمایش/مخفی فیلد 2
  const repassRef = useRef(null);

  const valid = useMemo(
    () => pass.length > 0 && repass.length > 0 && pass === repass,
    [pass, repass]
  );
  const mismatch = useMemo(
    () => pass.length > 0 && repass.length > 0 && pass !== repass,
    [pass, repass]
  );

  const onSubmit = async () => {
    if (!valid) return;
    // await resetPassword({ password: pass });
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* هدر */}
        <View style={styles.header}>
          <LogoWithText
            wrap={styles1.wrap1}
            logoWrap={styles1.logoWrap1}
            logo={styles1.logo1}
            text={styles1.text1}
          />
          <Text style={styles.title}>
            {valid ? "ورود در فیتنس" : "بازیابی رمز عبور"}
          </Text>
        </View>

        {/* فرم */}
        <View style={{ marginTop: ms(25) }}>
          {/* رمز جدید */}
          <View style={styles.block}>
            <FloatLabel
              visible={f1 || pass.length > 0}
              title="رمز عبور جدید:"
            />
            <View style={styles.inputWrap}>
              <CustomInput
                value={pass}
                onChangeText={setPass}
                placeholder={f1 ? "" : ":رمز عبور جدید"}
                onFocus={() => setF1(true)}
                onBlur={() => setF1(false)}
                secureTextEntry={!show1}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => repassRef.current?.focus()}
                style={[
                  styles.input,
                  pass.length === 0 && !f1
                    ? { textAlign: "right", writingDirection: "rtl" }
                    : { textAlign: "left", writingDirection: "ltr" },
                  mismatch && styles.inputError,
                ]}
              />
              <Pressable
                onPress={() => setShow1((s) => !s)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={show1 ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={COLORS.text}
                />
              </Pressable>
            </View>
          </View>

          {/* تکرار رمز جدید */}
          <View style={styles.block}>
            <FloatLabel
              visible={f2 || repass.length > 0}
              title="تکرار رمز عبور جدید:"
            />
            <View style={styles.inputWrap}>
              <CustomInput
                ref={repassRef}
                value={repass}
                onChangeText={setRepass}
                placeholder={f2 ? "" : ":تکرار رمز عبور جدید"}
                onFocus={() => setF2(true)}
                onBlur={() => setF2(false)}
                secureTextEntry={!show2}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                style={[
                  styles.input,
                  repass.length === 0 && !f2
                    ? { textAlign: "right", writingDirection: "rtl" }
                    : { textAlign: "left", writingDirection: "ltr" },
                  mismatch && styles.inputError,
                ]}
              />
              <Pressable
                onPress={() => setShow2((s) => !s)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={show2 ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={COLORS.text}
                />
              </Pressable>
            </View>
          </View>

          {/* خطای عدم تطابق */}
          {mismatch && (
            <Text style={styles.errorText}>رمز ها یکسان نیستند!</Text>
          )}
        </View>

        {/* CTA */}
        <PrimaryButton
          title="تایید"
          onPress={onSubmit}
          disabled={!valid}
          textColor={valid ? COLORS.onPrimary : COLORS.text}
          style={[
            styles.cta,
            { backgroundColor: valid ? COLORS.primary : COLORS.disabled },
          ]}
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
    marginTop: ms(38),
    marginBottom: ms(50),
    lineHeight: ms(20),
  },
  block: { marginBottom: ms(20) },
  floatingLabel: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginBottom: ms(6),
    color: COLORS.primary,
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(17),
    lineHeight: ms(18),
  },
  inputWrap: {
    position: "relative",
    width: ms(320),
    height: ms(55),
  },
  input: {
    width: "100%",
    height: "100%",
    borderRadius: ms(30),
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: COLORS.inputBg,
    paddingRight: ms(16),
    paddingLeft: ms(49),
  },
  eyeBtn: {
    position: "absolute",
    left: ms(19),
    top: "50%",
    transform: [{ translateY: -11 }],
    height: ms(22),
    width: ms(22),
    alignItems: "center",
    justifyContent: "center",
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginTop: ms(6),
    color: COLORS.danger,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    lineHeight: ms(16),
  },
  cta: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
    marginTop: ms(234),
  },
});
