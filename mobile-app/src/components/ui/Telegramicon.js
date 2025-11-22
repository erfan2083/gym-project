import React from "react";
import { Image, StyleSheet } from "react-native";

const TelegramIcon = ({ size = 24, style }) => {
  return (
    <Image
      source={require("../../../assets/icons/tele.png")}
      style={[styles.icon, { width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({});

export default TelegramIcon;
