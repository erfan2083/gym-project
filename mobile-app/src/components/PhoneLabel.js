// components/PhoneLabel.js
import React from "react";
import { Text, StyleSheet } from "react-native";
import { ms } from "react-native-size-matters";

export default function PhoneLabel({ visible }) {
  if (!visible) return null;
  return <Text style={styles.floatingLabel}>شماره تلفن:</Text>;
}

const styles = StyleSheet.create({
  floatingLabel: {
    alignSelf: "flex-end",
    marginRight: ms(10),
    marginBottom: ms(15),
    color: "#FF7A1A",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(20),
    lineHeight: ms(20),
  },
});
