// src/screens/auth/ResetPasswordScreen.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";

const ORANGE = "#FF7A1A";
const FloatLabel = ({ visible, title }) =>
  visible ? <Text style={styles.floatingLabel}>{title}</Text> : null;

export default function ResetPasswordScreen({ navigation }) {
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
  const [f1, setF1] = useState(false);
  const [f2, setF2] = useState(false);
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
    // TODO: اگر API دارید اینجا صدا بزنید
    // await resetPassword({ password: pass });
    navigation.replace("Login"); // ← رفتن به صفحه ورود
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
            <CustomInput
              value={pass}
              onChangeText={setPass}
              placeholder={f1 ? "" : ":رمز عبور جدید"}
              onFocus={() => setF1(true)}
              onBlur={() => setF1(false)}
              secureTextEntry
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
          </View>

          {/* تکرار رمز جدید */}
          <View style={styles.block}>
            <FloatLabel
              visible={f2 || repass.length > 0}
              title="تکرار رمز عبور جدید:"
            />
            <CustomInput
              ref={repassRef}
              value={repass}
              onChangeText={setRepass}
              placeholder={f2 ? "" : ":تکرار رمز عبور جدید"}
              onFocus={() => setF2(true)}
              onBlur={() => setF2(false)}
              secureTextEntry
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
          textColor={valid ? "#F6F4F4" : "#2C2727"}
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
    color: ORANGE,
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
  inputError: {
    borderColor: "#FF4D4F",
  },
  errorText: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginTop: ms(6),
    color: "#FF4D4F",
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
