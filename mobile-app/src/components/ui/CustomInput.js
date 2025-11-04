// components/CustomInput.js
import React, { forwardRef } from "react";
import { TextInput, StyleSheet } from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";

const CustomInput = (
  {
    value,
    onChangeText,
    placeholder,
    style,
    inputStyle,
    width = ms(320),
    height = ms(63),
    borderRadius = ms(30),
    placeholderTextColor = COLORS.text,
    selectionColor = COLORS.primary,
    ...rest
  },
  ref
) => {
  return (
    <TextInput
      ref={ref}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      selectionColor={selectionColor}
      textAlign="right"
      style={[styles.input, { width, height, borderRadius }, style, inputStyle]}
      {...rest}
    />
  );
};

export default forwardRef(CustomInput);

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: ms(16),
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(20),
    lineHeight: ms(20),
    letterSpacing: 0,
    color: COLORS.text,
    includeFontPadding: false,
    textAlignVertical: "center",
    writingDirection: "rtl",
  },
});
