// components/PhoneSubmit.js
import React from "react";
import { StyleSheet } from "react-native";
import { ms } from "react-native-size-matters";
import PrimaryButton from "./ui/PrimaryButton";

export default function PhoneSubmit({ disabled, onPress, title = "تایید" }) {
  const textColor = disabled ? "#2C2727" : "#F6F4F4";
  return (
    <PrimaryButton
      title={title}
      disabled={disabled}
      onPress={onPress}
      style={styles.absButton}
      textColor={textColor}
    />
  );
}

const styles = StyleSheet.create({
  absButton: {
    width: ms(320),
    height: ms(55),
    borderRadius: ms(30),
  },
});
