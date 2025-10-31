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

const ORANGE = "#FF7A1A";
const FloatLabel = ({ visible, title }) =>
  visible ? <Text style={styles.floatingLabel}>{title}</Text> : null;

export default function SignupScreen({ navigation }) {
  // 1) ابتدا هیچ نقشی انتخاب نشده است
  const [role, setRole] = useState(null); // "coach" | "athlete" | null

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");

  const [focusUser, setFocusUser] = useState(false);
  const [focusPass, setFocusPass] = useState(false);
  const [focusRe, setFocusRe] = useState(false);

  // refs برای جابجایی فوکوس
  const passRef = useRef(null);
  const repassRef = useRef(null);

  // 2) شرط فعال بودن دکمه: نام کاربری پُر + دو رمز برابر (بدون شرط طول)
  const valid = useMemo(() => {
    const okUser = user.trim().length > 0;
    const okPassPair = pass.length > 0 && repass.length > 0 && pass === repass;
    return okUser && okPassPair;
  }, [user, pass, repass]);

  const onSubmit = () => {
    if (!valid) return;
    // به صفحه بعد برو (route خودت را بگذار)
    navigation.navigate("SignupExtra", { role, user });
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

        {/* سوییچ نقش (در ابتدا هر دو خاکستری) */}
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
              title="نام کاربری:"
            />
            <CustomInput
              value={user}
              onChangeText={setUser}
              placeholder={focusUser ? "" : "نام کاربری:"}
              onFocus={() => setFocusUser(true)}
              onBlur={() => setFocusUser(false)}
              autoCapitalize="none"
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

                { textAlign: "right", writingDirection: "rtl" },
              ]}
            />
          </View>
        </View>

        {/* دکمه تایید (فعال فقط وقتی شرایط بالا برقرار است) */}
        <PrimaryButton
          title="تأیید"
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
    marginBottom: ms(66),
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
  block: { marginBottom: ms(44) },
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
    marginTop: ms(24),
  },
});
