// src/screens/auth/OtpScreen.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
} from "react-native";
import { ms } from "react-native-size-matters";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";

const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toFa = (s) => String(s || "").replace(/\d/g, (d) => FA[+d]);
const normalizeDigits = (t) =>
  String(t || "")
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/\D/g, "");

export default function OtpScreen({ route, navigation }) {
  const otp_id = route?.params?.otp_id || "";
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const length = 5;

  const cells = useMemo(() => {
    const arr = new Array(length).fill("");
    for (let i = 0; i < code.length && i < length; i++) arr[i] = code[i];
    return arr;
  }, [code]);

  const activeIndex = Math.min(code.length, length - 1);
  const isComplete = code.length === length;

  const handleChange = (t) => {
    setCode(normalizeDigits(t).slice(0, length));
  };

  const handleSubmit = async () => {
    if (!isComplete) return;
    try {
      const { signup_token } = await signupVerify(otp_id, code);
      setMsg('Verified');
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2C2727" }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ alignItems: "center", width: "100%" }}>
          <LogoWithText
            wrap={styles1.wrap1}
            logoWrap={styles1.logoWrap1}
            logo={styles1.logo1}
            text={styles1.text1}
          />{" "}
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
        </View>

        <PrimaryButton
          title="تایید"
          disabled={!isComplete}
          onPress={handleSubmit}
          style={styles.cta}
          textColor={isComplete ? "#F6F4F4" : "#2C2727"}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ORANGE = "#FF7A1A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2C2727",
    paddingHorizontal: ms(24),
    paddingTop: ms(72),
    justifyContent: "space-between",
    paddingBottom: ms(32),
  },

  label: {
    fontFamily: "Vazirmatn_700Bold",
    fontWeight: "500",
    fontSize: ms(20),
    lineHeight: ms(20),
    color: "#FFFFFF",
    marginTop: ms(100),
    marginBottom: ms(70),
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
    backgroundColor: "#F6F4F4",
    borderWidth: ms(2),
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: {
    borderColor: ORANGE,
  },
  digit: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(22),
    lineHeight: ms(22),
    color: "#2C2727",
  },

  hiddenInput: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },

  cta: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
    marginBottom: ms(70),
    alignSelf: "center",
  },
});
