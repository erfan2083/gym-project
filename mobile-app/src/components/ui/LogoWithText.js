// src/components/LogoWithText.js
import React from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { ms } from "react-native-size-matters";

export default function LogoWithText({
  animated = false,
  wrapStyle,
  containerStyle,
  textStyle,
  iconStyle,
  wrap,
  logoWrap,
  logo,
  text,
}) {
  const TextComp = animated ? Animated.Text : Text;
  const ImageComp = animated ? Animated.Image : Image;

  return (
    <View style={[wrap, wrapStyle]}>
      <View style={[logoWrap, containerStyle]}>
        <TextComp style={[text, textStyle]}>فیتنس</TextComp>
        <ImageComp
          source={require("../../../assets/icons/dumbbell.png")}
          style={[logo, iconStyle]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
