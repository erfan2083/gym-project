// src/screens/home/HomeScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";

import { useNavigation, useRoute } from "@react-navigation/native";
import CoachWorkoutsTab from "../../components/home/CoachWorkoutsTab";
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

// ✅ Coach
import CoachHomeTab from "../../components/home/CoachHomeTab";
import CoachAthletePlanScreen from "../../components/home/CoachAthletePlanScreen";
import CoachChatOverlay from "../../components/home/CoachChatOverlay";
import AIChatOverlay from "../../components/home/AIChatOverlay";

// ✅ NEW: Import client API
import { getMyTrainer } from "../../../api/user";

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeTab, setActiveTab] = useState("home"); // "home" | "workout" | "profile"
  const profile = useProfileStore((s) => s.profile);
  const role = profile?.role; // "coach" یا "client"


  // ✅ شناسه کاربر فعلی
  const currentUserId = useMemo(() => {
    const id = profile?.id || profile?._id || profile?.userId || profile?.user_id || null;
   console.log("🔍 currentUserId:", id, "from profile:", profile);
  return id;
  }, [profile]);

  const [clientChatVisible, setClientChatVisible] = useState(false);
  const [aiChatVisible, setAiChatVisible] = useState(false);

  // ✅ اطلاعات مربی کاربر (برای چت) - NOW PROPERLY LOADED
  const [userTrainerInfo, setUserTrainerInfo] = useState(null);
  const [trainerLoading, setTrainerLoading] = useState(false);

  const coachDisplayName = useMemo(() => {
    const n = profile?.name || profile?.username || "";
    return String(n).trim() || "نام مربی";
  }, [profile?.name, profile?.username]);

  // ============ Client Home pages ============
  const [homePage, setHomePage] = useState("main"); // "main" | "sports" | "sportTrainers" | "topTrainers" | "trainerPublic"
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerPublicBackTo, setTrainerPublicBackTo] = useState("main");

  const openTrainerPublic = (payload, backTo = "main") => {
    setSelectedTrainer(payload);
    setTrainerPublicBackTo(backTo);
    setHomePage("trainerPublic");
  };

  // ============ Coach flow (Workout tab screens) ============
  const [coachWorkoutPage, setCoachWorkoutPage] = useState("list"); // "list" | "athletePlan" | "picker"
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [selectedPlanDay, setSelectedPlanDay] = useState(null);
  const [planPickerContext, setPlanPickerContext] = useState(null); // payload از CoachAthletePlanScreen

  const [plansByAthlete, setPlansByAthlete] = useState({}); // { [athleteId]: { sat:[], sun:[], ... } }

  const selectedAthleteId = useMemo(() => {
    const id = selectedAthlete?.id ?? selectedAthlete?._id ?? null;
    return id ? String(id) : null;
  }, [selectedAthlete]);

  const planByDayForSelected = useMemo(() => {
    if (!selectedAthleteId) return {};
    return plansByAthlete?.[selectedAthleteId] || {};
  }, [plansByAthlete, selectedAthleteId]);

  // ✅ NEW: Load client's trainer on mount (for client role)
  const loadClientTrainer = useCallback(async () => {
    if (role !== "client") return;
    
    try {
      setTrainerLoading(true);
      console.log("📥 Loading client's trainer...");
      
      const data = await getMyTrainer();
      
      if (data?.trainerId) {
        console.log("✅ Client's trainer loaded:", data);
        setUserTrainerInfo({
          id: data.trainerId,
          trainerId: data.trainerId,
          name: data.trainerName || "مربی",
          trainerName: data.trainerName,
          avatarUrl: data.trainerAvatar,
          username: data.trainerUsername,
          planTitle: data.planTitle,
        });
      } else {
        console.log("❌ No active trainer found for client");
        setUserTrainerInfo(null);
      }
    } catch (error) {
      console.error("Error loading client trainer:", error);
      setUserTrainerInfo(null);
    } finally {
      setTrainerLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (role === "client") {
      loadClientTrainer();
    }
  }, [role, loadClientTrainer]);

  // Coach: open athlete plan INSIDE workout tab
  const openCoachAthletePlan = (athlete) => {
    setSelectedAthlete(athlete || null);
    setCoachWorkoutPage("athletePlan");
    setPlanPickerContext(null);
    setActiveTab("workout");
  };

  const onAddExerciseForDay = (dayKey) => {
    setSelectedPlanDay(dayKey);
    setCoachWorkoutPage("picker");
    setActiveTab("workout");
  };

  const onNavigateFromPlanToPicker = (payload) => {
    setPlanPickerContext(payload || null);
    setCoachWorkoutPage("picker");
    setActiveTab("workout");
  };

  // ✅ CoachWorkoutsTab خروجی:
  // payload: { exerciseId, name, media, sets, reps }
  const onAddToAthletePlan = async (payload) => {
    // اگر از CoachAthletePlanScreen آمده‌ایم، callback خودش را صدا بزنیم تا API را هم بزند
    if (planPickerContext?.onAddExercise) {
      await planPickerContext.onAddExercise(payload);
      setPlanPickerContext(null);
      setCoachWorkoutPage("athletePlan");
      return;
    }

    if (!selectedAthleteId || !selectedPlanDay) return;

    const item = {
      planItemId: `pi-${Date.now()}`,
      name: payload?.name || "نام حرکت",
      sets: payload?.sets,
      reps: payload?.reps,
      media: payload?.media || null,
      exerciseId: payload?.exerciseId || null,
    };

    setPlansByAthlete((prev) => {
      const currentAth = prev?.[selectedAthleteId] || {};
      const currentDayList = Array.isArray(currentAth?.[selectedPlanDay])
        ? currentAth[selectedPlanDay]
        : [];
      return {
        ...(prev || {}),
        [selectedAthleteId]: {
          ...currentAth,
          [selectedPlanDay]: [item, ...currentDayList],
        },
      };
    });

    setSelectedPlanDay(null);
    setCoachWorkoutPage("athletePlan");
  };

  const closeCoachAthletePlan = () => {
    setCoachWorkoutPage("list");
    setSelectedAthlete(null);
    setSelectedPlanDay(null);
    setPlanPickerContext(null);
    setActiveTab("home");
  };

  // ============ Chat Overlay (۹۰٪ + فقط هایلایت تب Profile) ============
  const [chatVisible, setChatVisible] = useState(false);
  const [chatAthlete, setChatAthlete] = useState(null);

  // این فقط برای رنگِ BottomTab است، نه تغییر واقعی صفحه
  const [tabHighlight, setTabHighlight] = useState(null); // "home" | "workout" | "profile" | null

  const openCoachChat = () => {
    // پشت صحنه باید همون صفحه‌ی Plan بمونه؛ فقط تب Profile هایلایت بشه
    setChatAthlete(selectedAthlete || null);
    setTabHighlight("profile");
    setChatVisible(true);
  };

  const closeCoachChat = () => {
    setChatVisible(false);
    setTabHighlight(null);
    setChatAthlete(null);
  };

  // ✅ باز کردن چت برای کاربر - NOW USES LOADED TRAINER
  const openClientChat = () => {
    console.log("Opening client chat with trainer:", userTrainerInfo);
    setClientChatVisible(true);
  };

  // ✅ باز کردن چت با AI
  const openAIChat = () => {
    console.log("Opening AI chat");
    setAiChatVisible(true);
  };

  const effectiveTab = tabHighlight || activeTab;

  const switchTab = (t) => {
    // اگر چت باز بود و کاربر روی تب‌ها زد، چت بسته شود
    if (chatVisible) closeCoachChat();
    if (clientChatVisible) setClientChatVisible(false);
    if (aiChatVisible) setAiChatVisible(false);
    setTabHighlight(null);
    setActiveTab(t);
  };

  // اگر از بیرون با params وارد HomeScreen شویم
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
      setActiveTab("home");
      setSelectedTrainer(openPayload);
      setHomePage("trainerPublic");
      setTrainerPublicBackTo(params?.backTo || "main");
    }

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

  const renderHomeCoach = () => {
    return (
      <CoachHomeTab
        onSelectAthlete={(athlete) => {
          openCoachAthletePlan(athlete);
        }}
      />
    );
  };

  const renderCoachWorkout = () => {
    if (coachWorkoutPage === "athletePlan") {
      return (
        <CoachAthletePlanScreen
          athlete={selectedAthlete}
          planByDay={planByDayForSelected}
          onPressAddForDay={onAddExerciseForDay}
          onNavigateToWorkouts={onNavigateFromPlanToPicker}
          onBack={closeCoachAthletePlan}
          onOpenChat={openCoachChat} // ✅
        />
      );
    }

    if (coachWorkoutPage === "picker") {
      return (
        <CoachWorkoutsTab
          onAddToPlan={onAddToAthletePlan}
          onPickDone={() => {
            setPlanPickerContext(null);
            setCoachWorkoutPage("athletePlan");
          }}
        />
      );
    }

    return <CoachWorkoutsTab />;
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
      if (role === "coach") return renderCoachWorkout();
      if (role === "client") {
        return (
          <>
            <CoachAthletePlanScreen
              athlete={{
                ...profile,
                name: profile?.name || profile?.username || "برنامه تمرینی من",
              }}
              readOnly
              // ✅ مهم: شناسه کاربر رو پاس بده
              currentUserId={currentUserId}
              // چون تب است، back را بی‌اثر یا برگردان به home tab
              onBack={() => setActiveTab("home")}
              onOpenChat={openClientChat}
              onOpenAIChat={openAIChat}
            />

            {/* ✅ چت کاربر با مربی - NOW WITH LOADED TRAINER */}
            <CoachChatOverlay
              visible={clientChatVisible}
              // ✅ اطلاعات مربی که از API گرفتیم
              athlete={userTrainerInfo}
              onClose={() => setClientChatVisible(false)}
              bottomOffset={ms(120)}
              meSender="athlete" // ✅ کلیدی‌ترین تغییر برای اینکه UI چت در user به‌هم نریزد
            />

            {/* ✅ چت با هوش مصنوعی */}
            <AIChatOverlay
              visible={aiChatVisible}
              onClose={() => setAiChatVisible(false)}
              bottomOffset={ms(120)}
            />
          </>
        );
      }
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

        {/* ✅ Chat Overlay (۹۰٪ + BottomTab دیده می‌ماند) */}
        {role === "coach" && (
          <CoachChatOverlay
            visible={chatVisible}
            athlete={chatAthlete || selectedAthlete}
            onClose={closeCoachChat}
            coachName={coachDisplayName}
            bottomOffset={ms(120)}
          />
        )}

        <View style={styles.bottomBarWrapper}>
          <View style={styles.bottomBar}>
            <Pressable
              style={[
                styles.bottomTabItem,
                effectiveTab === "workout" && styles.bottomTabItemActive,
              ]}
              onPress={() => switchTab("workout")}
            >
              <DumbbellIcon size={40} />
            </Pressable>

            <Pressable
              style={[
                styles.bottomTabItem,
                effectiveTab === "home" && styles.bottomTabItemActive,
              ]}
              onPress={() => switchTab("home")}
            >
              <HomeIcon size={40} />
            </Pressable>

            <Pressable
              style={[
                styles.bottomTabItem,
                effectiveTab === "profile" && styles.bottomTabItemActive,
              ]}
              onPress={() => switchTab("profile")}
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