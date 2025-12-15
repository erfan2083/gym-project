// src/screens/profile/SignatureScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import PrimaryButton from "../../components/ui/PrimaryButton";

export default function SignatureScreen({ navigation }) {
  const handleSign = () => {
    // اینجا در آینده می‌تونی امضا رو ذخیره کنی
    // الان فقط تایید می‌کنیم و می‌ریم داخل اکانت (Home)
    Alert.alert("تایید", "با شرایط و قوانین موافق هستم.", [
      {
        text: "ادامه",
        onPress: () => navigation.replace("Home"),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* کادر بزرگ قوانین */}
        <View style={styles.rulesCard}>
          {/* تیتر بالا راست */}
          <Text style={styles.rulesTitle}>قوانین و مقررات:</Text>

          {/* متن قوانین – فعلاً نمونه، می‌تونی متن واقعی بذاری یا از سرور بگیری */}
          <ScrollView
            style={styles.rulesScroll}
            contentContainerStyle={styles.rulesContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.rulesText}></Text>
          </ScrollView>
        </View>

        {/* دکمه امضای آنلاین */}
        <View style={styles.buttonWrap}>
          <PrimaryButton
            title="امضای آنلاین"
            onPress={handleSign}
            textColor={COLORS.white}
            style={styles.signButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: ms(30),
    paddingTop: ms(54),
    paddingBottom: ms(32),
    justifyContent: "space-between",
  },
  rulesCard: {
    flex: 1,
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(16),
    paddingTop: ms(12),
    paddingHorizontal: ms(12),
  },
  rulesTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.text,
    textAlign: "right",
    marginBottom: ms(8),
  },
  rulesScroll: {
    flex: 1,
  },
  rulesContent: {
    paddingBottom: ms(16),
  },
  rulesText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    lineHeight: ms(18),
    color: COLORS.text,
    textAlign: "right",
  },
  buttonWrap: {
    marginTop: ms(24),
  },
  signButton: {
    width: "100%",
    height: ms(55),
    borderRadius: ms(30),
    alignSelf: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginBottom: ms(30),
  },
});
