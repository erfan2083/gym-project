// components/CustomInput.tsx
import React from "react";
import { TextInput, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { ms } from "react-native-size-matters";

type Props = {
  value?: string,
  onChangeText?: (t: string) => void,
  placeholder?: string,
  style?: ViewStyle,
  inputStyle?: TextStyle,
  width?: number,
  height?: number,
  borderRadius?: number,
};

export default function CustomInput({
  value,
  onChangeText,
  placeholder,
  style,
  inputStyle,
  width = ms(320),
  height = ms(63),
  borderRadius = ms(30),
  ...rest
}: Props) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#2C2727"
      selectionColor="#F47A1F"
      textAlign="right"
      style={[styles.input, { width, height, borderRadius }, style, inputStyle]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#F6F4F4",
    paddingHorizontal: ms(16),

    // --- TYPOGRAPHY (exact) ---
    fontFamily: "Vazirmatn_700Bold", // اطمینان از نصب فونت
    fontSize: ms(20), // 20px
    lineHeight: ms(20), // 100% از 20px
    letterSpacing: 0, // 0%
    color: "#2C2727",
    includeFontPadding: false, // برای تطابق دقیق lineHeight در اندروید
    textAlignVertical: "center", // هم‌تراز عمودی بهتر در ارتفاع 63

    // RTL
    writingDirection: "rtl",
  },
});
