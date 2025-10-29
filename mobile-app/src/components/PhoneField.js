// components/PhoneField.js
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ms } from "react-native-size-matters";
import CustomInput from "./ui/CustomInput";
import PhoneLabel from "./PhoneLabel";
import { normalizeDigits } from "../components/phone";

export default function PhoneField({ value, onChange, showError, style }) {
  const [focused, setFocused] = useState(false);
  const cleaned = normalizeDigits(value);
  const showLabel = focused || cleaned.length > 0;

  return (
    <View style={[styles.inputBlock, style]}>
      <PhoneLabel visible={showLabel} />
      <CustomInput
        value={cleaned}
        onChangeText={(t) => onChange(normalizeDigits(t).slice(0, 11))}
        placeholder={focused ? "" : "شماره تلفن:"}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="telephoneNumber"
        autoComplete="tel"
        returnKeyType="done"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // placeholder راست، متن چپ
        style={[
          styles.inputBox,
          cleaned.length === 0
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
