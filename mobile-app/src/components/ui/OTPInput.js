// components/OtpInput.tsx
import React, { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toFa = (s: string) => s.replace(/\d/g, (d) => FA[+d]);
const toEn = (s: string) =>
  s
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));

type Props = {
  length?: number,
  value: string, // فقط ارقام لاتین 0-9
  onChange: (val: string) => void,
  onSubmit?: (val: string) => void,
  autoFocus?: boolean,
};

export default function OtpInput({
  length = 5,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: Props) {
  const ref = useRef < TextInput > null;
  const [focused, setFocused] = useState(false);

  const handleChange = (t: string) => {
    const next = toEn(t).replace(/\D/g, "").slice(0, length);
    onChange(next);
    if (next.length === length) onSubmit?.(next);
  };

  const cells = useMemo(() => {
    const arr = new Array(length).fill("");
    for (let i = 0; i < value.length && i < length; i++) arr[i] = value[i];
    return arr;
  }, [value, length]);

  const currentIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => ref.current?.focus()} style={styles.wrapper}>
      <View style={styles.row}>
        {cells.map((d, i) => {
          const isActive = focused && i === currentIndex;
          return (
            <View key={i} style={[styles.cell, isActive && styles.cellActive]}>
              <Text style={styles.digit}>{d ? toFa(d) : ""}</Text>
            </View>
          );
        })}
      </View>

      {/* ورودی مخفی که همه ارقام را می‌گیرد */}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        style={styles.hiddenInput}
        caretHidden
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  row: {
    flexDirection: "row-reverse", // از راست به چپ
    justifyContent: "center",
    gap: 12,
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F6F4F4",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: {
    borderColor: "#F47A1F",
  },
  digit: {
    fontFamily: "Vazirmatn",
    fontWeight: "700",
    fontSize: 22,
    lineHeight: 22,
    color: "#2C2727",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    // برای iOS فوکوس بهتر:
    height: 0,
    width: 0,
  },
});
