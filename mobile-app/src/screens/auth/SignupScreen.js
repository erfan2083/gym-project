import React, { useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { AntDesign } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Shadow } from "react-native-shadow-2";
import CustomInput from "../../components/ui/CustomInput";
import Google from "../../components/Google";

export default function SignupScreen() {
  const [role, setRole] = useState("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pressed, setPressed] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.logoitem}>
        <MaterialCommunityIcons
          style={styles.icon}
          name="dumbbell"
          size={24}
          color="black"
        />
        <Text style={styles.logotext}> فیتنس </Text>
      </View>

      <Text style={styles.subtitle}>عضویت در فیتنس</Text>

      {/* انتخاب نقش */}
      <View style={styles.roleContainer}>
        <Shadow
          distance={role === "user" ? 5 : 1}
          startColor={"rgba(0,0,0,0.07)"}
          offset={role === "user" ? [0, 0] : [0, 5]}
          radius={25}
        >
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "user" && styles.roleButtonActive,
            ]}
            onPress={() => setRole("user")}
          >
            <Text
              style={[
                styles.roleText,
                role === "user" && styles.roleTextActive,
              ]}
            >
              کاربر هستم
            </Text>
          </TouchableOpacity>
        </Shadow>

        <Shadow
          distance={role === "coach" ? 5 : 1}
          startColor={"rgba(0,0,0,0.07)"}
          offset={role === "coach" ? [0, 0] : [0, 5]}
          radius={25}
        >
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "coach" && styles.roleButtonActive,
            ]}
            onPress={() => setRole("coach")}
          >
            <Text
              style={[
                styles.roleText,
                role === "coach" && styles.roleTextActive,
              ]}
            >
              مربی هستم
            </Text>
          </TouchableOpacity>
        </Shadow>
      </View>

      <View style={styles.inputContainer}>
        <CustomInput
          placeholder="نام کاربری:"
          iconName="account-outline"
          value={username}
          onChangeText={setUsername}
        />
        <CustomInput
          placeholder="ایمیل:"
          iconName="email-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <CustomInput
          placeholder="رمز عبور :"
          iconName="lock-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign="right"
        />
      </View>

      <View style={styles.divider} />

      <Google />

      <TouchableWithoutFeedback
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <Animated.View
          style={[
            styles.signupButton,
            {
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowOpacity: pressed ? 0.25 : 0.2,
              shadowOffset: { width: 0, height: pressed ? 6 : 3 },
            },
          ]}
        >
          <Text style={styles.signupText}>عضویت</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff7a00",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: moderateScale(25),
    paddingTop: moderateScale(70),
  },
  logoitem: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  icon: {
    marginRight: moderateScale(8),
    fontSize: moderateScale(34),
    color: "#222",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: moderateScale(5), height: moderateScale(5) },
    textShadowRadius: moderateScale(8),
  },
  logotext: {
    fontSize: moderateScale(34),
    fontWeight: "bold",
    color: "#222",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: moderateScale(3), height: moderateScale(3.5) },
    textShadowRadius: moderateScale(3),
  },
  subtitle: {
    fontSize: moderateScale(22),
    marginBottom: moderateScale(40),
    fontWeight: "bold",
    color: "#222",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: moderateScale(3), height: moderateScale(3.5) },
    textShadowRadius: moderateScale(3),
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(30),
    marginBottom: moderateScale(30),
  },
  roleButton: {
    backgroundColor: "#fff",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    marginHorizontal: moderateScale(5),
  },
  roleButtonActive: { borderWidth: 2, borderColor: "#000" },
  roleText: { fontSize: moderateScale(19), fontWeight: "bold", color: "#000" },
  roleTextActive: { fontWeight: "700" },
  inputContainer: {
    width: "100%",
    gap: moderateScale(25),
    marginVertical: moderateScale(5),
  },
  divider: {
    height: 1.3,
    backgroundColor: "rgba(255,255,255,0.9)",
    width: "80%",
    marginVertical: moderateScale(25),
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(30),
    paddingVertical: moderateScale(12),
    width: "100%",
    marginBottom: moderateScale(18),
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  signupButton: {
    backgroundColor: "#222",
    borderRadius: moderateScale(30),
    paddingVertical: moderateScale(13),
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 4,
  },
  signupText: {
    color: "#ff7a00",
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
});
