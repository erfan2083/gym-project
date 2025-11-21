// src/screens/home/HomeScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import HomeIcon from "../../components/ui/Homeicon";

export default function HomeScreen() {
  // تب فعال
  const [activeTab, setActiveTab] = useState("home"); // "home" | "workout" | "profile"

  const renderContent = () => {
    if (activeTab === "home") {
      return <Text style={styles.contentText}>صفحه هوم</Text>;
    }
    if (activeTab === "workout") {
      return <Text style={styles.contentText}>صفحه تمرین‌ها</Text>;
    }
    if (activeTab === "profile") {
      return <Text style={styles.contentText}>صفحه پروفایل</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* محتوای وسط، فقط متن ساده فعلاً */}
        <View style={styles.content}>{renderContent()}</View>

        {/* نوار پایین با ۳ گزینه، همیشه ثابت */}
        <View style={styles.bottomBarWrapper}>
          <View style={styles.bottomBar}>
            {/* تمرین‌ها */}
            <Pressable
              style={[
                styles.bottomTabItem,
                activeTab === "workout" && styles.bottomTabItemActive,
              ]}
              onPress={() => setActiveTab("workout")}
            >
              <FontAwesome5
                name="dumbbell"
                size={ms(20)}
                color={COLORS.primary}
              />
            </Pressable>

            {/* هوم */}
            <Pressable
              style={[
                styles.bottomTabItem,
                activeTab === "home" && styles.bottomTabItemActive,
              ]}
              onPress={() => setActiveTab("home")}
            >
              <HomeIcon size={32} />
            </Pressable>

            {/* پروفایل */}
            <Pressable
              style={[
                styles.bottomTabItem,
                activeTab === "profile" && styles.bottomTabItemActive,
              ]}
              onPress={() => setActiveTab("profile")}
            >
              <FontAwesome5
                name="user-alt"
                size={ms(20)}
                color={COLORS.primary}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- استایل‌ها ----------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: ms(30),
    paddingTop: ms(24),
    paddingBottom: ms(24),
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(18),
    color: COLORS.white,
  },

  bottomBarWrapper: {
    justifyContent: "flex-end",
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(40),
    paddingVertical: ms(10),
    paddingHorizontal: ms(24),
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ms(40),
  },
  bottomTabItem: {
    width: ms(90),
    height: ms(50),
    borderRadius: ms(24),
    alignItems: "center",
    justifyContent: "center",
  },
  bottomTabItemActive: {
    backgroundColor: COLORS.white,
  },
});
