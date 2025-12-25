// src/screens/home/HomeScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";

import { useNavigation, useRoute } from "@react-navigation/native";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import HomeIcon from "../../components/ui/Homeicon";
import DumbbellIcon from "../../components/ui/Dumbbell";
import ProfileTab from "../../components/home/ProfileTab";
import HomeTab from "../../components/home/HomeTab";
import { useProfileStore } from "../../store/profileStore";
import TopTrainersScreen from "../../components/home/TopTrainersScreen";
import TrainerPublicProfile from "../../components/home/TrainerPublicProfile";

import SportsCategoriesScreen from "../../components/home/SportsCategoriesScreen";
import SportTrainersScreen from "../../components/home/SportTrainersScreen";

// ✅ NEW
import CoachHomeTab from "../../components/home/CoachHomeTab";

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeTab, setActiveTab] = useState("home"); // "home" | "workout" | "profile"
  const role = useProfileStore((s) => s.profile?.role);

  const [homePage, setHomePage] = useState("main"); // "main" | "sports" | "sportTrainers" | "topTrainers" | "trainerPublic"
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // مسیر برگشت از پروفایل مربی (main / topTrainers / sportTrainers)
  const [trainerPublicBackTo, setTrainerPublicBackTo] = useState("main");

  // تابع واحد برای باز کردن پروفایل مربی داخل HomeScreen (برای حفظ bottom bar)
  const openTrainerPublic = (payload, backTo = "main") => {
    setSelectedTrainer(payload);
    setTrainerPublicBackTo(backTo);
    setHomePage("trainerPublic");
  };

  // اگر از بیرون با params وارد HomeScreen شویم (برای ریدایرکت از TrainerPublicProfile مستقل)
  useEffect(() => {
    const params = route?.params || {};

    const initialTab = params?.initialTab;
    if (initialTab && ["home", "workout", "profile"].includes(initialTab)) {
      setActiveTab(initialTab);
      setHomePage("main");
      setSelectedSport(null);
      setSelectedTrainer(null);
    }

    const openPayload = params?.openTrainerPublic;
    if (openPayload?.trainerId) {
      // همیشه داخل تب home باز شود تا bottom tab فعال و درست باشد
      setActiveTab("home");
      setSelectedTrainer(openPayload);
      setHomePage("trainerPublic");
      setTrainerPublicBackTo(params?.backTo || "main");
    }

    // پاک کردن params برای جلوگیری از اجرای تکراری
    if (
      params?.initialTab !== undefined ||
      params?.openTrainerPublic !== undefined ||
      params?.backTo !== undefined
    ) {
      navigation?.setParams?.({
        initialTab: undefined,
        openTrainerPublic: undefined,
        backTo: undefined,
      });
    }
  }, [route?.params, navigation]);

  // اگر از home خارج شدیم، زیرصفحات home را ریست کن
  useEffect(() => {
    if (activeTab !== "home" && homePage !== "main") {
      setHomePage("main");
      setSelectedSport(null);
      setSelectedTrainer(null);
    }
  }, [activeTab, homePage]);

  const renderHomeClient = () => {
    if (homePage === "sports") {
      return (
        <SportsCategoriesScreen
          onBack={() => setHomePage("main")}
          onSelectSport={(sport) => {
            setSelectedSport(sport);
            setHomePage("sportTrainers");
          }}
        />
      );
    }

    if (homePage === "sportTrainers") {
      return (
        <SportTrainersScreen
          sport={selectedSport}
          onBack={() => setHomePage("sports")}
          onSelectTrainer={(payload) =>
            openTrainerPublic(payload, "sportTrainers")
          }
        />
      );
    }

    if (homePage === "trainerPublic") {
      return (
        <TrainerPublicProfile
          trainerId={selectedTrainer?.trainerId}
          trainerData={selectedTrainer?.trainerData}
          withinHomeShell
          onBack={() => {
            setHomePage(trainerPublicBackTo || "main");
            setSelectedTrainer(null);
          }}
        />
      );
    }

    if (homePage === "topTrainers") {
      return (
        <TopTrainersScreen
          onBack={() => setHomePage("main")}
          onSelectTrainer={(payload) =>
            openTrainerPublic(payload, "topTrainers")
          }
        />
      );
    }

    return (
      <HomeTab
        onPressProfile={() => setActiveTab("profile")}
        onPressAllTrainers={() => setHomePage("topTrainers")}
        onPressAllCategories={() => setHomePage("sports")}
        onSelectSport={(sport) => {
          setSelectedSport(sport);
          setHomePage("sportTrainers");
        }}
        onSelectTrainer={(payload) => openTrainerPublic(payload, "main")}
      />
    );
  };

  // ✅ NEW: coach home renderer
  const renderHomeCoach = () => {
    // فعلاً فقط UI صفحه Home مربی طبق فیگما
    // برای آینده اگر صفحه‌های تو در تو خواستی، همین‌جا مشابه renderHomeClient گسترش می‌دهیم
    return (
      <CoachHomeTab
        onSelectAthlete={(athlete) => {
          // فعلاً هیچ navigation جدیدی نمی‌زنیم تا مطابق درخواستت UI-only باشد
          // بعداً می‌توانی اینجا مثلاً بروی صفحه AthleteProfile داخل همین HomeScreen
          console.log("Selected athlete:", athlete?.id);
        }}
      />
    );
  };

  const renderContent = () => {
    if (activeTab === "home") {
      if (role === "client") return renderHomeClient();
      if (role === "coach") return renderHomeCoach();

      return (
        <View style={styles.centerContent}>
          <Text style={styles.contentText}>صفحه هوم</Text>
        </View>
      );
    }

    if (activeTab === "workout") {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.contentText}>صفحه تمرین‌ها</Text>
        </View>
      );
    }

    if (activeTab === "profile") {
      if (role === "coach") return <ProfileTab />;

      return (
        <View style={styles.centerContent}>
          <Text style={styles.contentText}>پروفایل کاربر</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>{renderContent()}</View>

        <View style={styles.bottomBarWrapper}>
          <View style={styles.bottomBar}>
            <Pressable
              style={[
                styles.bottomTabItem,
                activeTab === "workout" && styles.bottomTabItemActive,
              ]}
              onPress={() => setActiveTab("workout")}
            >
              <DumbbellIcon size={40} />
            </Pressable>

            <Pressable
              style={[
                styles.bottomTabItem,
                activeTab === "home" && styles.bottomTabItemActive,
              ]}
              onPress={() => setActiveTab("home")}
            >
              <HomeIcon size={40} />
            </Pressable>

            <Pressable
              style={[
                styles.bottomTabItem,
                activeTab === "profile" && styles.bottomTabItemActive,
              ]}
              onPress={() => setActiveTab("profile")}
            >
              <FontAwesome5
                name="user-alt"
                size={ms(30)}
                color={COLORS.primary}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    paddingHorizontal: ms(30),
    paddingTop: ms(24),
    paddingBottom: ms(24),
  },
  content: { flex: 1 },

  centerContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  contentText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(18),
    color: COLORS.white,
  },

  bottomBarWrapper: { justifyContent: "flex-end" },
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
  bottomTabItemActive: { backgroundColor: COLORS.white },
});
