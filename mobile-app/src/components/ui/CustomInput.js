// components/CustomInput.js
import React from "react";
import { TextInput, StyleSheet } from "react-native";
import { ms } from "react-native-size-matters";

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
}) {
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
    fontFamily: " Vazirmatn_400Regular",
    fontSize: ms(20),
    lineHeight: ms(20),
    letterSpacing: 0,
    color: "#2C2727",
    includeFontPadding: false,
    textAlignVertical: "center",
    writingDirection: "rtl",
  },
});
