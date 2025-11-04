// src/styles/styles1.js
import { StyleSheet } from "react-native";
import { ms } from "react-native-size-matters";

export const styles1 = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  logoWrap: {
    flexDirection: "row-reverse",
    width: ms(209),
    height: ms(75),
    position: "relative",
    marginLeft: ms(75),
    alignItems: "flex-end",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: ms(6),
  },
  logo: {
    width: ms(56.6666),
    height: ms(56.6666),
    position: "absolute",
    right: ms(179),
  },
  text: {
    color: "#FF7517",
    fontSize: ms(47.7),
    fontFamily: "Vazirmatn_700Bold",
    lineHeight: ms(47.7),
    letterSpacing: 0,
  },
  wrap1: { alignItems: "center", justifyContent: "center" },
  logoWrap1: {
    flexDirection: "row-reverse",
    width: ms(121),
    height: ms(43),
    position: "relative",
    alignItems: "flex-end",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: ms(6),
  },
  logo1: {
    width: ms(43),
    height: ms(43),
    // position: "absolute",
    // right: ms(147),
  },
  text1: {
    color: "#FF7517",
    fontSize: ms(25),
    fontFamily: "Vazirmatn_700Bold",
    // lineHeight: ms(47.7),
    letterSpacing: 0,
  },
});
