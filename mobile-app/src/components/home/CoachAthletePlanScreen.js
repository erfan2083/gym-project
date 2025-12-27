// src/components/home/CoachAthletePlanScreen.js
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  Image,
  StyleSheet as RNStyleSheet,
  ActivityIndicator,
} from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "../../theme/colors";

// ✅ API imports
import {
  getWeekScheduleForCoach,
  addScheduleItem,
  deleteScheduleItem,
} from "../../../api/trainer";

// expo-av (اگر موجود نبود کرش نکن)
const safeGetVideo = () => {
  try {
    // eslint-disable-next-line global-require
    return require("expo-av");
  } catch {
    return null;
  }
};

const DAYS = [
  { key: "sat", label: "شنبه", dayOfWeek: 0 },
  { key: "sun", label: "یک شنبه", dayOfWeek: 1 },
  { key: "mon", label: "دوشنبه", dayOfWeek: 2 },
  { key: "tue", label: "سه شنبه", dayOfWeek: 3 },
  { key: "wed", label: "چهارشنبه", dayOfWeek: 4 },
  { key: "thu", label: "پنج شنبه", dayOfWeek: 5 },
  { key: "fri", label: "جمعه", dayOfWeek: 6 },
];

// ✅ محاسبه شروع هفته جاری (شنبه) - فقط یکبار
const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

export default function CoachAthletePlanScreen({
  athlete,
  onPressAddForDay,
  onAddExercise,
  onBack,
  onOpenChat,
  readOnly = false,
  onNavigateToWorkouts,
}) {
  // ✅ State management
  const [planByDay, setPlanByDay] = useState({});
  const [loading, setLoading] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  // ✅ فقط یک هفته ثابت
  const weekStart = useMemo(() => getWeekStart(), []);

  // ✅ ref برای نگه داشتن روز انتخاب شده (بدون re-render)
  const selectedDayRef = useRef(null);

  // ✅ شناسه شاگرد
  const traineeId = useMemo(() => {
    return (
      athlete?.id ||
      athlete?._id ||
      athlete?.userId ||
      athlete?.user_id ||
      athlete?.traineeId ||
      null
    );
  }, [athlete]);

  const athleteName = useMemo(() => {
    const full =
      athlete?.name ||
      athlete?.fullName ||
      athlete?.full_name ||
      athlete?.username ||
      "";
    return String(full).trim() || "نام کاربر";
  }, [athlete]);

  const subscriptionName = useMemo(() => {
    const sub =
      athlete?.subscriptionName ||
      athlete?.subscription_name ||
      athlete?.subscription ||
      athlete?.planTitle ||
      athlete?.plan_title ||
      "";
    return String(sub).trim() || "نام اشتراک";
  }, [athlete]);

  // ✅ ─────────────────────────────────────────────
  // ✅ Fetch weekly schedule from API
  // ✅ ─────────────────────────────────────────────
  const fetchWeekSchedule = useCallback(async () => {
    if (!traineeId) {
      console.warn("No traineeId provided");
      return;
    }

    setLoading(true);

    try {
      const data = await getWeekScheduleForCoach({
        traineeId,
        weekStart,
      });

      const schedule = {};
      DAYS.forEach((d) => {
        schedule[d.key] = [];
      });

      if (Array.isArray(data)) {
        data.forEach((item) => {
          const dayInfo = DAYS.find(
            (d) =>
              d.dayOfWeek === item.day_of_week ||
              d.key === item.day_key ||
              d.key === item.dayKey
          );

          if (dayInfo) {
            schedule[dayInfo.key].push({
              planItemId: item.item_id ?? item.planItemId ?? item.id ?? item._id,
              id: item.workout_id ?? item.workoutId ?? item.id,
              name: item.workout_title ??  item.title ?? item.name ?? "نام حرکت",
              sets: item.sets_count ?? item.sets ?? 0,
              reps: item.reps_count ?? item.reps ?? 0,
              notes: item.notes || "",
              media: (item.workout_video_url ?? item.video_url)
                     ? { uri: item.workout_video_url ?? item.video_url, type: "video" }
                      : null,
              exercise: {
                media: (item.workout_video_url ?? item.video_url)
                       ? { uri: item.workout_video_url ?? item.video_url, type: "video" }
                       : null,
              },
            });
          }
        });
      } else if (typeof data === "object" && data !== null) {
        DAYS.forEach((d) => {
          if (Array.isArray(data[d.key])) {
            schedule[d.key] = data[d.key].map((item) => ({
              planItemId: item.id || item._id,
              id: item.workout_id || item.workoutId,
              name: item.workout_title || item.title || item.name || "نام حرکت",
              sets: item.sets || 0,
              reps: item.reps || 0,
              notes: item.notes || "",
              media: item.video_url
                ? { uri: item.video_url, type: "video" }
                : null,
              exercise: {
                media: item.video_url
                  ? { uri: item.video_url, type: "video" }
                  : null,
              },
            }));
          }
        });
      }

      setPlanByDay(schedule);
    } catch (error) {
      console.error("Error fetching week schedule:", error);
      const emptySchedule = {};
      DAYS.forEach((d) => {
        emptySchedule[d.key] = [];
      });
      setPlanByDay(emptySchedule);
    } finally {
      setLoading(false);
    }
  }, [traineeId, weekStart]);

  // ✅ Load schedule on mount
  useEffect(() => {
    if (!readOnly) {
      fetchWeekSchedule();
    }
  }, [fetchWeekSchedule, readOnly]);

  // ✅ ─────────────────────────────────────────────
  // ✅ Add exercise to schedule - با dayKey پارامتر
  // ✅ ─────────────────────────────────────────────
  const handleAddExerciseToDay = useCallback(
    async (exerciseData, dayKey) => {
      // ✅ اول از پارامتر استفاده کن، بعد از ref
      const targetDay = dayKey || selectedDayRef.current;
      
      console.log("Adding exercise to day:", targetDay, exerciseData);

      if (!traineeId) {
        Alert.alert("خطا", "شناسه شاگرد یافت نشد");
        return;
      }

      if (!targetDay) {
        Alert.alert("خطا", "روز انتخاب نشده است");
        return;
      }

      const dayInfo = DAYS.find((d) => d.key === targetDay);
      if (!dayInfo) {
        Alert.alert("خطا", "روز نامعتبر است");
        return;
      }

      try {
        setLoading(true);

        await addScheduleItem({
          traineeId,
          weekStart,
          dayOfWeek: dayInfo.dayOfWeek,
          workoutId: exerciseData.workoutId || exerciseData.id || exerciseData.exerciseId,
          sets: exerciseData.sets,
          reps: exerciseData.reps,
          notes: exerciseData.notes || "",
        });

        // ✅ بروزرسانی state محلی
        setPlanByDay((prev) => {
          const newPlan = { ...prev };
          const dayItems = [...(newPlan[targetDay] || [])];

          dayItems.push({
            planItemId: `temp-${Date.now()}`,
            id: exerciseData.workoutId || exerciseData.id,
            name: exerciseData.name,
            sets: exerciseData.sets,
            reps: exerciseData.reps,
            notes: exerciseData.notes || "",
            media: exerciseData.media,
          });

          newPlan[targetDay] = dayItems;
          return newPlan;
        });

        // ✅ پاک کردن روز انتخاب شده
        selectedDayRef.current = null;

        // ✅ Refresh برای گرفتن ID واقعی
        setTimeout(() => fetchWeekSchedule(), 300);

        Alert.alert("موفقیت", "تمرین با موفقیت اضافه شد");
      } catch (error) {
        console.error("Error adding schedule item:", error);
        Alert.alert("خطا", "مشکلی در افزودن تمرین رخ داد");
      } finally {
        setLoading(false);
      }
    },
    [traineeId, weekStart, fetchWeekSchedule]
  );

  // ✅ ─────────────────────────────────────────────
  // ✅ Delete exercise from schedule
  // ✅ ─────────────────────────────────────────────
  const handleDeleteItem = useCallback(
    async (dayKey, item) => {
      if (!item?.planItemId) {
        Alert.alert("خطا", "شناسه آیتم یافت نشد");
        return;
      }

      Alert.alert(
        "حذف تمرین",
        `آیا از حذف "${item.name}" مطمئن هستید؟`,
        [
          { text: "لغو", style: "cancel" },
          {
            text: "حذف",
            style: "destructive",
            onPress: async () => {
              try {
                setDeletingItemId(item.planItemId);

                await deleteScheduleItem({ id: item.planItemId });

                setPlanByDay((prev) => {
                  const newPlan = { ...prev };
                  newPlan[dayKey] = (newPlan[dayKey] || []).filter(
                    (it) => it.planItemId !== item.planItemId
                  );
                  return newPlan;
                });
              } catch (error) {
                console.error("Error deleting schedule item:", error);
                Alert.alert("خطا", "مشکلی در حذف تمرین رخ داد");
              } finally {
                setDeletingItemId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  // ✅ Handler for add button
  const handleAddForDay = (dayKey) => {
    console.log("Add for day:", dayKey);
    
    // ✅ ذخیره روز در ref
    selectedDayRef.current = dayKey;

    if (onNavigateToWorkouts) {
      onNavigateToWorkouts({
        dayKey,
        traineeId,
        weekStart,
        // ✅ پاس دادن dayKey به callback
        onAddExercise: (exerciseData) => handleAddExerciseToDay(exerciseData, dayKey),
      });
      return;
    }

    if (onPressAddForDay) return onPressAddForDay(dayKey);
    if (onAddExercise) return onAddExercise(dayKey);
  };

  // ---------- Preview Modal ----------
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const openPreview = (item) => {
    const m = item?.media || item?.exercise?.media || null;
    if (!m?.uri) {
      Alert.alert("پیش‌نمایش", "برای این تمرین رسانه‌ای ثبت نشده است.");
      return;
    }
    setPreviewItem({ ...item, media: m });
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewItem(null);
  };

  const PreviewVideo = safeGetVideo()?.Video;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.chatBtn}>
          <Ionicons name="arrow-back" size={ms(22)} color={COLORS.primary} />
        </Pressable>

        <Text style={styles.headerName} numberOfLines={1}>
          {athleteName}
        </Text>

        <View style={styles.avatarCircle}>
          {athlete?.avatarUrl || athlete?.avatar_url ? (
            <Image
              source={{ uri: athlete.avatarUrl || athlete.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <FontAwesome5 name="user-alt" size={ms(20)} color={COLORS.primary} />
          )}
        </View>
      </View>

      {/* Line + Center Chat Icon */}
      <View style={styles.headerLineWrap}>
        <View style={styles.headerLine} />
        <Pressable
          onPress={onOpenChat}
          hitSlop={10}
          style={styles.centerChatBtn}
        >
          <Entypo name="chat" size={40} color={COLORS.primary} />
        </Pressable>
      </View>

      <Text style={styles.subText} numberOfLines={1}>
        {subscriptionName}
      </Text>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>در حال بارگذاری...</Text>
        </View>
      ) : (
        /* Days */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.daysWrap}
        >
          {DAYS.map((d) => {
            const items = planByDay?.[d.key] || [];
            const hasItems = items.length > 0;

            return (
              <View key={d.key} style={styles.dayCard}>
                <Text style={styles.dayTitle}>{d.label}</Text>

                {hasItems && (
                  <View style={styles.itemsWrap}>
                    {items.map((it, idx) => {
                      const isDeleting = deletingItemId === it?.planItemId;

                      return (
                        <View
                          key={
                            it?.planItemId
                              ? String(it.planItemId)
                              : `${d.key}-${idx}`
                          }
                          style={[
                            styles.itemRow,
                            isDeleting && styles.itemRowDeleting,
                          ]}
                        >
                          {/* ✅ دکمه حذف (فقط برای مربی) */}
                          {!readOnly && (
                            <Pressable
                              style={styles.deleteBtn}
                              hitSlop={10}
                              onPress={() => handleDeleteItem(d.key, it)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <ActivityIndicator size="small" color={COLORS.error} />
                              ) : (
                                <MaterialIcons
                                  name="delete-outline"
                                  size={ms(18)}
                                  color={COLORS.error}
                                />
                              )}
                            </Pressable>
                          )}

                          <Pressable
                            style={styles.filmChip}
                            hitSlop={10}
                            onPress={() => openPreview(it)}
                          >
                            <Text style={styles.filmText}>فیلم</Text>
                          </Pressable>

                          <View style={styles.itemMid}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {it?.name || "نام حرکت"}
                            </Text>

                            <View style={styles.metaRow}>
                              <Text style={styles.metaText}>تعداد ست:</Text>
                              <Text style={styles.metaText}>
                                {String(it?.sets ?? "")}
                              </Text>

                              <Text
                                style={[styles.metaText, { marginRight: ms(12) }]}
                              >
                                تعداد تکرار:
                              </Text>
                              <Text style={styles.metaText}>
                                {String(it?.reps ?? "")}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ✅ فقط مربی */}
                {!readOnly && (
                  <Pressable
                    style={[styles.addRow, !hasItems && styles.addRowCentered]}
                    onPress={() => handleAddForDay(d.key)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={ms(18)}
                      color={COLORS.primary}
                    />
                    <Text style={styles.addText}>افزودن تمرین جدید</Text>
                  </Pressable>
                )}

                {/* Empty state for readOnly */}
                {readOnly && !hasItems && (
                  <Text style={styles.emptyDayText}>تمرینی ثبت نشده</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="fade">
        <View style={styles.previewBackdrop}>
          <Pressable style={RNStyleSheet.absoluteFill} onPress={closePreview} />
          <View style={styles.previewCard}>
            <Pressable style={styles.previewClose} onPress={closePreview}>
              <Feather name="x" size={ms(18)} color={COLORS.text} />
            </Pressable>

            <View style={styles.previewMediaBox}>
              {previewItem?.media?.type === "video" ? (
                PreviewVideo ? (
                  <PreviewVideo
                    source={{ uri: previewItem.media.uri }}
                    style={styles.previewMedia}
                    useNativeControls
                    resizeMode="contain"
                    shouldPlay
                    isLooping
                  />
                ) : (
                  <Text style={styles.previewFallback}>
                    برای پخش ویدیو باید expo-av نصب باشد
                  </Text>
                )
              ) : previewItem?.media?.uri ? (
                <Image
                  source={{ uri: previewItem.media.uri }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.previewFallback}>فایلی انتخاب نشده</Text>
              )}
            </View>

            <Text style={styles.previewTitle} numberOfLines={1}>
              {String(previewItem?.name || "نام حرکت")}
            </Text>

            {previewItem?.notes && (
              <Text style={styles.previewNotes} numberOfLines={3}>
                {previewItem.notes}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: ms(6),
  },
  leftBtn: { width: ms(40), alignItems: "flex-start" },

  avatarCircle: {
    width: ms(58),
    height: ms(58),
    borderRadius: ms(40),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  headerName: {
    flex: 1,
    textAlign: "center",
    transform: [{ translateX: ms(50) }],
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
  },

  headerLineWrap: {
    marginTop: ms(14),
    marginBottom: ms(12),
    justifyContent: "center",
  },
  headerLine: {
    height: ms(1),
    backgroundColor: COLORS.primary,
    opacity: 0.9,
  },
  centerChatBtn: {
    position: "absolute",
    transform: [{ translateY: ms(-35) }, { translateX: ms(-70) }],
    alignSelf: "center",
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },

  subText: {
    textAlign: "right",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
    marginBottom: ms(14),
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: ms(12),
  },
  loadingText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text2,
  },

  daysWrap: { gap: ms(14), paddingBottom: ms(18) },

  dayCard: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(18),
    padding: ms(16),
  },
  dayTitle: {
    textAlign: "right",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.primary,
  },

  addRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: ms(8),
    marginTop: ms(12),
    alignSelf: "flex-start",
  },
  addRowCentered: {
    alignSelf: "center",
    marginTop: ms(18),
    marginBottom: ms(6),
  },
  addText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.primary,
  },

  itemsWrap: { gap: ms(10), marginTop: ms(10) },
  itemRow: {
    backgroundColor: COLORS.white,
    borderRadius: ms(16),
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemRowDeleting: {
    opacity: 0.5,
  },

  // ✅ Delete button
  deleteBtn: {
    padding: ms(6),
    marginLeft: ms(4),
  },

  filmChip: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(12),
    paddingHorizontal: ms(18),
    paddingVertical: ms(14),
    minWidth: ms(60),
    alignItems: "center",
    justifyContent: "center",
  },
  filmText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text,
  },
  itemMid: { flex: 1, marginRight: ms(12), alignItems: "flex-end" },
  itemName: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.primary,
  },
  metaRow: { flexDirection: "row-reverse", flexWrap: "wrap", marginTop: ms(6) },
  metaText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.primary,
    marginRight: ms(6),
  },

  // Empty state
  emptyDayText: {
    textAlign: "center",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.text2,
    marginTop: ms(12),
    opacity: 0.7,
  },

  // Preview modal
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewCard: {
    width: "86%",
    backgroundColor: COLORS.white,
    borderRadius: ms(18),
    padding: ms(14),
  },
  previewClose: {
    position: "absolute",
    left: ms(12),
    top: ms(12),
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
    zIndex: 10,
  },
  previewMediaBox: {
    width: "100%",
    height: ms(220),
    borderRadius: ms(14),
    backgroundColor: COLORS.inputBg2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewMedia: { width: "100%", height: "100%" },
  previewFallback: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.text2,
    textAlign: "center",
    paddingHorizontal: ms(12),
  },
  previewTitle: {
    marginTop: ms(12),
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.primary,
    textAlign: "right",
  },
  previewNotes: {
    marginTop: ms(6),
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(10),
    color: COLORS.text2,
    textAlign: "right",
  },
});