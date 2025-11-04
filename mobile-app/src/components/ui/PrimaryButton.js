// components/PrimaryButton.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { ms } from "react-native-size-matters";

type Props = {
  title: string,
  onPress?: () => void,
  disabled?: boolean,
  style?: ViewStyle,
  width?: number,
  height?: number,
  borderRadius?: number,
  textColor?: string,
};

export default function PrimaryButton({
  title,
  onPress,
  disabled,
  style,
  width = ms(320),
  height = ms(55),
  borderRadius = ms(30),
  textColor = "#2C2727", // در صورت نیاز تغییر بده
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        { width, height, borderRadius },
        disabled ? styles.disabled : styles.enabled,
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  enabled: { backgroundColor: "#FF7A1A" },
  disabled: { backgroundColor: "#B2B2B2" },
  text: {
    // --- TYPOGRAPHY (exact) ---
    fontFamily: "Vazirmatn_700Bold", // یا Vazirmatn_700Bold اگر از expo fonts استفاده می‌کنی
    fontSize: ms(20), // 20px
    lineHeight: ms(20), // 100%
    letterSpacing: 0, // 0%
    includeFontPadding: false, // برای دقت خط-ارتفاع در اندروید
    textAlignVertical: "center",
  },
});
