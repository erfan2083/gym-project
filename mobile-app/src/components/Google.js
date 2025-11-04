import React, { useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import { moderateScale } from "react-native-size-matters";

export default function Google() {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableWithoutFeedback
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale: pressed ? 0.97 : 1 }],
            shadowOpacity: pressed ? 0.25 : 0.2,
            shadowOffset: { width: 0, height: pressed ? 6 : 5 },
          },
        ]}
      >
        <View style={styles.inner}>
          <Image source={require("../assets/google.png")} style={styles.icon} />
          <Text style={styles.text}>عضویت با حساب گوگل</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(35),
    paddingVertical: moderateScale(13),
    width: "100%",
    marginBottom: moderateScale(20),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 6,
    elevation: 6,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: moderateScale(28),
    height: moderateScale(28),
    marginRight: moderateScale(12),
    resizeMode: "contain",
  },
  text: {
    fontSize: moderateScale(17),
    color: "#222",
    fontWeight: "700",
  },
});
