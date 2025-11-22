// src/screens/home/HomeScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import { useProfileStore } from "../../store/profileStore";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import HomeIcon from "../../components/ui/Homeicon";

export default function HomeScreen() {
  // تب فعال
  const [activeTab, setActiveTab] = useState("home"); // "home" | "workout" | "profile"

  const profile = useProfileStore((state) => state.profile);

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
    paddingHorizontal: ms(30),
    paddingBottom: ms(32),
  },
  title: {
    fontSize: ms(20),
    color: COLORS.formTitle,
    textAlign: "center",
    paddingTop: ms(28),
    marginVertical: ms(24),
    fontFamily: "Vazirmatn_700Bold",
  },
  avatarWrapper: {
    alignSelf: "center",
    width: ms(120),
    height: ms(120),
    borderRadius: ms(300),
    marginBottom: ms(84),
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: ms(65),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: ms(60),
  },

  // ⬇️ فقط این رو عوض کن
  field: {
    marginBottom: ms(16),
    width: ms(320),
    alignSelf: "center", // کل فیلد میاد وسط
    alignItems: "stretch", // بچه‌ها (اینپوت / SelectField / uploadBox) هم به همون عرض کشیده می‌شن
  },

  label: {
    fontSize: ms(14),
    color: COLORS.white,
    marginBottom: ms(4),
    textAlign: "right",
    fontFamily: "Vazirmatn_400Regular",
  },
  errorText: {
    fontSize: ms(10),
    color: COLORS.danger,
    marginTop: ms(4),
    textAlign: "right",
    fontFamily: "Vazirmatn_400Regular",
  },
  inputSmall: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    lineHeight: ms(12),
  },
  dropdownWrapper: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(12),
    height: ms(48),
    justifyContent: "center",
    paddingHorizontal: ms(16),
  },
  dropdownIcon: {
    position: "absolute",
    left: ms(4),
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  dropdownText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
    textAlign: "right",
  },
  dropdownPlaceholder: {
    color: COLORS.text2,
  },
  birthRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  birthItem: {
    flex: 1,
  },
  birthSeparator: {
    marginHorizontal: ms(4),
    color: COLORS.text,
    fontFamily: "Vazirmatn_400Regular",
  },
  textArea: {
    height: ms(120),
    borderRadius: ms(12),
    paddingTop: ms(12),
  },
  textAreaInput: {
    textAlignVertical: "top",
  },
  uploadBox: {
    height: ms(120),
    borderRadius: ms(12),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadPlus: {
    fontSize: ms(32),
    marginBottom: ms(4),
    color: COLORS.text,
    fontFamily: "Vazirmatn_400Regular",
  },
  uploadText: {
    fontSize: ms(12),
    color: COLORS.text2,
    fontFamily: "Vazirmatn_400Regular",
  },
  sectionLabel: {
    marginTop: ms(8),
    marginBottom: ms(8),
  },
  saveButton: {
    marginTop: ms(8),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    maxHeight: ms(400),
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: ms(16),
    paddingTop: ms(12),
    paddingBottom: ms(24),
  },
  modalOption: {
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.white,
    textAlign: "center",
    marginBottom: ms(12),
  },
  modalOptionText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(13),
    color: COLORS.white,
    textAlign: "right",
  },
  avatarPlus: {
    position: "absolute",
    bottom: ms(-1),
    right: ms(3),
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  birthContainer: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(12),
    height: ms(48),
    paddingHorizontal: ms(16),
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  birthLabel: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
    marginLeft: ms(8),
  },
  birthInlineRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  birthDropdown: {
    backgroundColor: "transparent",
    height: ms(48),
    paddingHorizontal: 0,
    minWidth: ms(50),
    justifyContent: "center",
  },
  birthText: {
    fontSize: ms(12),
    textAlignVertical: "center",
  },
});
