// components/PhoneField.js
import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { ms } from "react-native-size-matters";
import CustomInput from "./ui/CustomInput";
import PhoneLabel from "./PhoneLabel";
import { normalizeDigits } from "../../utils/phone";

export default function PhoneField({ value, onChange, showError, style }) {
  const [focused, setFocused] = useState(false);

  // فقط برای منطق لیبل از نسخهٔ نرمال‌شده استفاده می‌کنیم
  const hasAnyDigits = normalizeDigits(value).length > 0;
  const showLabel = focused || hasAnyDigits;

  return (
    <View style={[styles.inputBlock, style]}>
      <PhoneLabel visible={showLabel} />
      <CustomInput
        value={value} // مقدار خام را نمایش بده
        onChangeText={(t) => onChange(t)} // هیچ فیلتر/برش روی تایپ نکن
        placeholder={focused ? "" : "شماره تلفن:"}
        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
        inputMode="numeric"
        textContentType="telephoneNumber"
        autoComplete="tel"
        returnKeyType="done"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.inputBox,
          // placeholder راست، متن واقعی LTR
          !hasAnyDigits && !focused
            ? { textAlign: "right", writingDirection: "rtl" }
            : { textAlign: "left", writingDirection: "ltr" },
          showError && styles.inputError,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputBlock: {
    width: ms(320),
    paddingTop: ms(6),
  },
  inputBox: {
    width: ms(320),
    height: ms(63),
    borderRadius: ms(30),
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: { borderColor: "#FF4D4F" },
});
