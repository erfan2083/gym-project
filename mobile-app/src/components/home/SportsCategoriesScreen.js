// src/components/home/SportsCategoriesScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { COLORS } from "../../theme/colors";
import HomeDumbbell from "../ui/HomeDumbbell";
import Yogaicon from "../ui/Yogaicon";

const FALLBACK_SPORTS = [
  { id: "fitness", title: "فیتنس", count: 20, iconType: "fitness" },
  { id: "yoga", title: "یوگا", count: 10, iconType: "yoga" },
  { id: "bodybuilding", title: "بدنسازی", count: 22, iconType: "bodybuilding" },
];

// تلاش برای گرفتن API در صورت وجود (بدون کرش اگر نبود)
const safeGetTrainerApi = () => {
  try {
    return require("../../../api/trainer");
  } catch {
    return {};
  }
};

export default function SportsCategoriesScreen({ onBack, onSelectSport }) {
  const api = useMemo(() => safeGetTrainerApi(), []);

  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // اگر API برای رشته‌ها وجود داشت استفاده می‌کنیم، وگرنه فال‌بک
      const fn =
        api?.getSportsCategories ||
        api?.getSportCategories ||
        api?.getCategories;

      if (typeof fn !== "function") {
        setSports(FALLBACK_SPORTS);
        return;
      }

      try {
        setLoading(true);
        const list = await fn();

        if (!mounted) return;

        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map((x, idx) => ({
            id: x?.id ?? String(idx),
            title: x?.title || x?.name || "رشته",
            count: Number(x?.count || x?.trainerCount || x?.trainer_count || 0),
            iconType: x?.iconType || x?.key || x?.id || "fitness",
          }));
          setSports(normalized);
        } else {
          setSports(FALLBACK_SPORTS);
        }
      } catch (e) {
        console.log("getSportsCategories error:", e?.message || e);
        setSports(FALLBACK_SPORTS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [api]);

  const renderIcon = (iconType) => {
    // مطابق فیگما: آیکون سمت راست داخل یک دایره
    if (iconType === "yoga") return <Yogaicon size={ms(30)} />;
    if (iconType === "bodybuilding") return <HomeDumbbell size={ms(30)} />;
    return (
      <MaterialCommunityIcons
        name="heart-pulse"
        size={ms(28)}
        color={COLORS.lighgreen}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons
            name="chevron-forward"
            size={ms(26)}
            color={COLORS.primary}
          />
        </Pressable>
        <Text style={styles.title}>دسته بندی رشته های ورزشی</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {sports.map((s) => (
          <Pressable
            key={String(s.id)}
            style={styles.rowCard}
            onPress={() => onSelectSport?.(s)}
            hitSlop={8}
          >
            {/* راست: نام رشته + آیکون */}
            <View style={styles.rightGroup}>
              <Text style={styles.sportTitle} numberOfLines={1}>
                {s.title}
              </Text>
              <View>{renderIcon(s.iconType)}</View>
            </View>

            {/* چپ: تعداد مربی */}
            <Text style={styles.countText} numberOfLines={1}>
              تعداد مربی : {s.count}
            </Text>
          </Pressable>
        ))}

        {loading ? (
          <Text style={styles.hint}>در حال دریافت اطلاعات...</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: ms(44),
    alignItems: "center",
    justifyContent: "center",
    marginVertical: ms(16),
  },
  backBtn: {
    position: "absolute",
    right: 0,
    width: ms(44),
    height: ms(44),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
    textAlign: "center",
  },

  content: {
    paddingBottom: ms(10),
    gap: ms(22),
  },

  rowCard: {
    backgroundColor: COLORS.white,
    borderRadius: ms(16),
    height: ms(54),
    paddingHorizontal: ms(14),
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: ms(10),
    shadowOffset: { width: 0, height: ms(4) },
    elevation: 2,
  },

  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    maxWidth: "60%",
  },

  sportTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text2,
    textAlign: "right",
  },

  countText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text2,
    textAlign: "left",
  },

  hint: {
    marginTop: ms(6),
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.text2,
    textAlign: "center",
    opacity: 0.7,
  },
});
