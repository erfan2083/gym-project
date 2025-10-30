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
// توجه: مسیر import زیر را دقیقاً طبق پروژه خودت نگه دار
import { validatePhone, normalizeDigits } from "../../../utils/phone";
import { signupStart } from "../../../api/auth";

export default function PhoneNumberScreen({ navigation }) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const { valid, errors } = useMemo(() => validatePhone(value), [value]);
  const showError = touched && errors.length > 0;


  const onSubmit = async () => {
    if (!valid) return;
    const phone = normalizeDigits(value);

    try{
      const { otp_id } = await signupStart(phone);
      navigation.navigate("Otp", { otp_id }); // ← رفتن به OTP با پارامتر
    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
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
        {/* لوگو */}
        <View style={styles.header}>
          <LogoWithText
            wrap={styles1.wrap1}
            logoWrap={styles1.logoWrap1}
            logo={styles1.logo1}
            text={styles1.text1}
          />
        </View>

        {/* فیلد شماره */}
        <View style={styles.inputPos}>
          <PhoneField
            value={value}
            onChange={(v) => {
              if (!touched) setTouched(true);
              setValue(v);
            }}
            showError={showError}
          />
          {showError && <Text style={styles.errorText}>{errors[0]}</Text>}
        </View>

        {/* دکمه تأیید */}
        <View style={styles.buttonPos}>
          <PhoneSubmit disabled={!valid} onPress={onSubmit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: "center", marginTop: ms(48) },
  inputPos: { position: "absolute", top: ms(287), left: ms(35) },
  buttonPos: { position: "absolute", top: ms(659), left: ms(35) },
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
