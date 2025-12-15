import React from "react";
import { Image, StyleSheet } from "react-native";

const DumbbellIcon = ({ size = 24, style }) => {
  return (
    <Image
      source={require("../../../assets/icons/dd.png")}
      style={[styles.icon, { width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({});

export default DumbbellIcon;
