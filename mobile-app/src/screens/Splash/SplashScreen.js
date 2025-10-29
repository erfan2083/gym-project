// src/screens/Splash/SplashScreen.js
import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing } from "react-native";
import { ms } from "react-native-size-matters";
import LogoWithText from "../../components/ui/LogoWithText";
import { styles1 } from "../../theme/LogoStyle";

export default function SplashScreen({ onFinish }) {
  const stageFade = useRef(new Animated.Value(0)).current;
  const textX = useRef(new Animated.Value(ms(260))).current;
  const iconX = useRef(new Animated.Value(-ms(260))).current;

  useEffect(() => {
    Animated.timing(stageFade, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.timing(textX, {
      toValue: 0,
      duration: 700,
      delay: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(iconX, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    });

    const t = setTimeout(() => onFinish?.(), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: stageFade }]}>
      <LogoWithText
        animated
        textStyle={{ transform: [{ translateX: textX }] }}
        iconStyle={{ transform: [{ translateX: iconX }] }}
        wrap={styles1.wrap}
        logoWrap={styles1.logoWrap}
        logo={styles1.logo}
        text={styles1.text}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2C2727",
    alignItems: "center",
    justifyContent: "center",
  },
});
