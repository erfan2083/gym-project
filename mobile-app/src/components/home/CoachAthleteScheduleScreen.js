// src/screens/CoachAthleteScheduleScreen.js
// ✅ صفحه یکپارچه‌سازی - مدیریت برنامه تمرینی شاگرد
// این صفحه CoachAthletePlanScreen و CoachWorkoutsTab رو به هم وصل می‌کنه

import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, SafeAreaView, StatusBar, Pressable, Text, BackHandler } from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../theme/colors";
import { useFocusEffect } from "@react-navigation/native";

import CoachAthletePlanScreen from "CoachAthletePlanScreen";
import CoachWorkoutsTab from "CoachWorkoutsTab";

/**
 * ✅ Flow کامل:
 * 
 * 1. مربی وارد این صفحه میشه و برنامه هفتگی شاگرد رو می‌بینه (CoachAthletePlanScreen)
 * 2. روی "افزودن تمرین جدید" یک روز (مثلاً شنبه) کلیک می‌کنه
 * 3. handleNavigateToWorkouts فراخوانی میشه:
 *    - callback رو در ref ذخیره می‌کنه
 *    - viewMode رو به "workouts" تغییر میده
 * 4. صفحه CoachWorkoutsTab نمایش داده میشه
 * 5. کاربر تمرین رو انتخاب کرده و ست/تکرار رو وارد می‌کنه
 * 6. روی "افزودن" کلیک می‌کنه → submitAddToPlan
 * 7. onAddToPlan(payload) فراخوانی میشه → handleAddToPlan
 * 8. handleAddToPlan از ref، callback ذخیره شده رو صدا میزنه
 * 9. handleAddExerciseToDay اجرا میشه و API رو صدا میزنه
 * 10. onPickDone فراخوانی میشه → برگشت به صفحه برنامه
 */

export default function CoachAthleteScheduleScreen({ route, navigation }) {
  const athlete = route?.params?.athlete || {};

  // ✅ حالت نمایش: "plan" یا "workouts"
  const [viewMode, setViewMode] = useState("plan");

  // ✅ استفاده از ref برای نگه داشتن callback
  // این ref خیلی مهمه! چون وقتی viewMode تغییر می‌کنه و re-render میشه،
  // callback نباید گم بشه
  const addExerciseCallbackRef = useRef(null);

  // ✅ Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (viewMode === "workouts") {
          setViewMode("plan");
          addExerciseCallbackRef.current = null;
          return true; // Prevent default behavior
        }
        return false; // Let default behavior happen
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [viewMode])
  );

  // ✅ برگشت به صفحه قبل
  const handleBack = () => {
    if (viewMode === "workouts") {
      setViewMode("plan");
      addExerciseCallbackRef.current = null;
    } else {
      navigation.goBack();
    }
  };

  // ✅ باز کردن چت
  const handleOpenChat = () => {
    navigation.navigate("Chat", {
      recipientId: athlete?.id || athlete?.trainee_id || athlete?.userId,
      recipientName: athlete?.name || athlete?.full_name || athlete?.fullName,
    });
  };

  // ✅ وقتی مربی می‌خواهد تمرین به یک روز اضافه کند
  // این تابع از CoachAthletePlanScreen فراخوانی میشه
  const handleNavigateToWorkouts = useCallback((context) => {
    console.log("========================================");
    console.log("handleNavigateToWorkouts called");
    console.log("dayKey:", context.dayKey);
    console.log("traineeId:", context.traineeId);
    console.log("weekStart:", context.weekStart);
    console.log("onAddExercise type:", typeof context.onAddExercise);
    console.log("========================================");
    
    // ✅ ذخیره callback در ref - این قدم خیلی مهمه!
    addExerciseCallbackRef.current = context.onAddExercise;
    
    // ✅ رفتن به صفحه انتخاب تمرین
    setViewMode("workouts");
  }, []);

  // ✅ وقتی تمرین انتخاب شد و کاربر روی "افزودن" زد
  // این تابع از CoachWorkoutsTab فراخوانی میشه
  const handleAddToPlan = useCallback((exercisePayload) => {
    console.log("========================================");
    console.log("handleAddToPlan called");
    console.log("exercisePayload:", exercisePayload);
    console.log("Callback exists in ref:", !!addExerciseCallbackRef.current);
    console.log("========================================");

    // ✅ فراخوانی callback که از CoachAthletePlanScreen اومده
    if (addExerciseCallbackRef.current) {
      console.log("Executing the callback...");
      addExerciseCallbackRef.current(exercisePayload);
    } else {
      console.error("ERROR: No callback found in ref!");
    }
  }, []);

  // ✅ بعد از انتخاب تمرین، برگشت به صفحه برنامه
  const handlePickDone = useCallback(() => {
    console.log("========================================");
    console.log("handlePickDone called");
    console.log("========================================");
    
    setViewMode("plan");
    // ✅ پاک کردن ref
    addExerciseCallbackRef.current = null;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {viewMode === "plan" ? (
          // ✅ صفحه برنامه هفتگی
          <CoachAthletePlanScreen
            athlete={athlete}
            onBack={handleBack}
            onOpenChat={handleOpenChat}
            onNavigateToWorkouts={handleNavigateToWorkouts}
            readOnly={false}
          />
        ) : (
          // ✅ صفحه انتخاب تمرین
          <View style={styles.workoutsContainer}>
            {/* Header با دکمه برگشت */}
            <View style={styles.workoutsHeader}>
              <Pressable onPress={handleBack} hitSlop={10} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={ms(22)} color={COLORS.primary} />
              </Pressable>
              <Text style={styles.workoutsTitle}>انتخاب تمرین</Text>
              <View style={styles.placeholder} />
            </View>
            
            {/* ✅ کامپوننت تمرینات با callback های صحیح */}
            <CoachWorkoutsTab
              onAddToPlan={handleAddToPlan}
              onPickDone={handlePickDone}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: ms(16),
  },
  workoutsContainer: {
    flex: 1,
  },
  workoutsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: ms(12),
  },
  backBtn: {
    padding: ms(4),
  },
  workoutsTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.primary,
  },
  placeholder: {
    width: ms(30),
  },
});