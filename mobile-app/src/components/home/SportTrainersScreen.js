// src/components/home/SportTrainersScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../../theme/colors";
import RatingStars from "../ui/RatingStars";

// تلاش برای گرفتن API در صورت وجود (بدون کرش اگر نبود)
const safeGetTrainerApi = () => {
  try {
    return require("../../../api/trainer");
  } catch {
    return {};
  }
};

const FALLBACK_TRAINERS = [
  { id: "t1", name: "نام مربی", rating: 4.5, city: "شهر" },
  { id: "t2", name: "نام مربی", rating: 4.0, city: "شهر" },
  { id: "t3", name: "نام مربی", rating: 5.0, city: "شهر" },
  { id: "t4", name: "نام مربی", rating: 4.6, city: "شهر" },
  { id: "t5", name: "نام مربی", rating: 4.2, city: "شهر" },
];

function TrainerRowCard({ t, onPress }) {
  const name = t?.name ?? "نام مربی";
  const city = t?.city ?? "شهر";
  const rating =
    typeof t?.rating === "number" ? t.rating : Number(t?.rating || 0);
  const avatarUri = t?.avatarUrl || t?.avatar_url || t?.avatar || null;

  return (
    <Pressable style={styles.rowCard} onPress={() => onPress?.(t)} hitSlop={8}>
      {/* چپ: ستاره‌ها */}
      <View style={styles.leftStars}>
        <RatingStars rating={rating} size={ms(16)} />
      </View>

      {/* وسط: نام + شهر */}
      <View style={styles.midInfo}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.cityRow}>
          <Text style={styles.city} numberOfLines={1}>
            {city}
          </Text>
          <Ionicons name="location-sharp" size={ms(14)} color={COLORS.text2} />
        </View>
      </View>

      {/* راست: آواتار */}
      <View style={styles.avatarOuter}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View>
            <FontAwesome5
              name="user-alt"
              size={ms(18)}
              color={COLORS.primary}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function SportTrainersScreen({ sport, onBack }) {
  const navigation = useNavigation();
  const api = useMemo(() => safeGetTrainerApi(), []);

  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // اگر sport نداریم، فقط فال‌بک
      if (!sport) {
        setTrainers(FALLBACK_TRAINERS);
        return;
      }

      // اگر API برای مربیان رشته وجود داشت استفاده می‌کنیم
      const fn =
        api?.getTrainersBySport ||
        api?.getTrainersByCategory ||
        api?.getSportTrainers;

      if (typeof fn !== "function") {
        setTrainers(FALLBACK_TRAINERS);
        return;
      }

      try {
        setLoading(true);

        // بعضی APIها با id کار می‌کنند بعضی با title؛ هر دو را می‌فرستیم
        const list = await fn(sport.id, sport.title);

        if (!mounted) return;

        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map((item, idx) => ({
            id: item?.id ?? String(idx),
            name: item?.name || item?.full_name || item?.username || "مربی",
            avatarUrl: item?.avatarUrl || item?.avatar_url || null,
            city: item?.city || "شهر",
            rating: Number(item?.rating) || 0,
          }));
          setTrainers(normalized);
        } else {
          setTrainers(FALLBACK_TRAINERS);
        }
      } catch (e) {
        console.log("getTrainersBySport error:", e?.message || e);
        setTrainers(FALLBACK_TRAINERS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [api, sport]);

  const title = sport?.title
    ? `مربیان رشته ورزشی ${sport.title}`
    : "مربیان رشته ورزشی";

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
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {trainers.map((t, idx) => (
          <TrainerRowCard
            key={t?.id ? String(t.id) : `tr-${idx}`}
            t={t}
            onPress={(trainer) => {
              navigation.navigate("TrainerPublicProfile", {
                trainerId: trainer.id,
                trainerData: trainer,
              });
            }}
          />
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
    fontSize: ms(16),
    color: COLORS.primary,
    textAlign: "center",
  },

  content: {
    paddingBottom: ms(10),
    gap: ms(20),
  },

  rowCard: {
    backgroundColor: COLORS.white,
    borderRadius: ms(18),
    minHeight: ms(100),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: ms(10),
    shadowOffset: { width: 0, height: ms(4) },
    elevation: 2,
  },

  avatarOuter: {
    width: ms(70),
    height: ms(70),
    borderRadius: ms(90),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },

  midInfo: { flex: 1, alignItems: "flex-end", paddingHorizontal: ms(14) },
  name: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.text2,
    textAlign: "right",
    marginBottom: ms(6),
  },
  cityRow: { flexDirection: "row-reverse", alignItems: "center", gap: ms(4) },
  city: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(15),
    color: COLORS.text2,
    textAlign: "right",
  },

  leftStars: {
    minWidth: ms(86),
    alignItems: "flex-start0",
    marginBottom: ms(30),
  },

  hint: {
    marginTop: ms(6),
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.text2,
    textAlign: "center",
    opacity: 0.7,
  },
});
