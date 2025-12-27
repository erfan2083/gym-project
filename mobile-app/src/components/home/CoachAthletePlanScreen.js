// src/components/home/CoachAthletePlanScreen.js
import React, { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import { COLORS } from "../../theme/colors";

// expo-av (اگر موجود نبود کرش نکن)
const safeGetVideo = () => {
  try {
    // eslint-disable-next-line global-require
    return require("expo-av");
  } catch {
    return null;
  }
};

// AsyncStorage (اگر موجود نبود کرش نکن)
const safeGetAsyncStorage = () => {
  try {
    // eslint-disable-next-line global-require
    return require("@react-native-async-storage/async-storage").default;
  } catch {
    return null;
  }
};

const DAYS = [
  { key: "sat", label: "شنبه" },
  { key: "sun", label: "یک شنبه" },
  { key: "mon", label: "دوشنبه" },
  { key: "tue", label: "سه شنبه" },
  { key: "wed", label: "چهارشنبه" },
  { key: "thu", label: "پنج شنبه" },
  { key: "fri", label: "جمعه" },
];

// کلید پایدار برای ذخیره/خواندن برنامه
const getStableKey = (athlete) => {
  const id =
    athlete?.id ?? athlete?._id ?? athlete?.userId ?? athlete?.user_id ?? null;
  if (id) return `id:${String(id)}`;

  const uname = athlete?.username ? String(athlete.username).trim() : "";
  if (uname) return `u:${uname}`;

  const phone = athlete?.phone ? String(athlete.phone).trim() : "";
  if (phone) return `p:${phone}`;

  return null;
};

const planStorageKey = (stableKey) => `athlete_plan_v1_${stableKey}`;

const isEmptyPlan = (p) => {
  if (!p || typeof p !== "object") return true;
  return DAYS.every((d) => !Array.isArray(p?.[d.key]) || p[d.key].length === 0);
};

export default function CoachAthletePlanScreen({
  athlete,
  planByDay,
  onPressAddForDay,
  onAddExercise,
  onBack,
  onOpenChat,
  readOnly = false,
}) {
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
      "";
    return String(sub).trim() || "نام اشتراک";
  }, [athlete]);

  const stableKey = useMemo(() => getStableKey(athlete), [athlete]);
  const AsyncStorage = useMemo(() => safeGetAsyncStorage(), []);

  const [storedPlan, setStoredPlan] = useState(null);

  // ✅ برای کلاینت: اگر planByDay خالی بود، از AsyncStorage بخوان
  useEffect(() => {
    let mounted = true;

    const shouldLoad =
      readOnly &&
      !!stableKey &&
      !!AsyncStorage &&
      (planByDay == null || isEmptyPlan(planByDay));

    if (!shouldLoad) return;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(planStorageKey(stableKey));
        if (!mounted) return;
        const parsed = raw ? JSON.parse(raw) : null;
        setStoredPlan(parsed && typeof parsed === "object" ? parsed : null);
      } catch {
        if (mounted) setStoredPlan(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [readOnly, stableKey, AsyncStorage, planByDay]);

  // ✅ برای مربی: هر وقت planByDay تغییر کرد ذخیره شود تا کلاینت ببیند
  useEffect(() => {
    const shouldSave =
      !readOnly &&
      !!stableKey &&
      !!AsyncStorage &&
      planByDay != null &&
      typeof planByDay === "object";

    if (!shouldSave) return;

    (async () => {
      try {
        await AsyncStorage.setItem(
          planStorageKey(stableKey),
          JSON.stringify(planByDay)
        );
      } catch {
        // ignore
      }
    })();
  }, [readOnly, stableKey, AsyncStorage, planByDay]);

  const effectivePlanByDay = useMemo(() => {
    // اگر کلاینت هستیم و planByDay خالی است، storedPlan را نمایش بده
    if (readOnly) {
      if (planByDay && !isEmptyPlan(planByDay)) return planByDay;
      if (storedPlan && typeof storedPlan === "object") return storedPlan;
      return planByDay ?? {};
    }
    // مربی
    return planByDay ?? {};
  }, [readOnly, planByDay, storedPlan]);

  const handleAddForDay = (dayKey) => {
    if (onPressAddForDay) return onPressAddForDay(dayKey);
    if (onAddExercise) return onAddExercise(dayKey);
  };

  // ---------- Preview Modal (بدون تغییر UI) ----------
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
      {/* Header like Figma */}
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.chatBtn}>
          <Ionicons name="arrow-back" size={ms(22)} color={COLORS.primary} />
        </Pressable>

        <Text style={styles.headerName} numberOfLines={1}>
          {athleteName}
        </Text>

        <View style={styles.avatarCircle}>
          <FontAwesome5 name="user-alt" size={ms(20)} color={COLORS.primary} />
        </View>
      </View>

      {/* ✅ Line + Center Chat Icon */}
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

      {/* Days */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.daysWrap}
      >
        {DAYS.map((d) => {
          const items = effectivePlanByDay?.[d.key] || [];
          const hasItems = items.length > 0;

          return (
            <View key={d.key} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{d.label}</Text>

              {hasItems && (
                <View style={styles.itemsWrap}>
                  {items.map((it, idx) => (
                    <View
                      key={
                        it?.planItemId
                          ? String(it.planItemId)
                          : `${d.key}-${idx}`
                      }
                      style={styles.itemRow}
                    >
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
                  ))}
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
            </View>
          );
        })}
      </ScrollView>

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
});
