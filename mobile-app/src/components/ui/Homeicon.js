// HomeIcon.js
import React from "react";
import { Image, StyleSheet } from "react-native";

const HomeIcon = ({ size = 24, style }) => {
  return (
    <Image
      source={require("../../../assets/icons/Group 66.png")}
      style={[styles.icon, { width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({});

export default HomeIcon;
