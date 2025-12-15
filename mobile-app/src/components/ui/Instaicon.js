import React from "react";
import { Image, StyleSheet } from "react-native";

const InstaIcon = ({ size = 24, style }) => {
  return (
    <Image
      source={require("../../../assets/icons/insta.png")}
      style={[styles.icon, { width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({});

export default InstaIcon;
