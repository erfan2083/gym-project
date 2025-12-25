// src/screens/home/TopTrainersScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { ms } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { COLORS } from "../../theme/colors";
import TopTrainerCard from "../ui/TopTrainerCard";

// API
import { getTopTrainers } from "../../../api/trainer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// چون HomeScreen خودش paddingHorizontal = 30 دارد
const CONTENT_WIDTH = SCREEN_WIDTH - ms(30) * 2;
const GAP = ms(18);
const CARD_WIDTH = (CONTENT_WIDTH - GAP) / 2;

const FALLBACK = [
  { id: "t1", name: "نام مربی", rating: 4.5, city: "شهر" },
  { id: "t2", name: "نام مربی", rating: 4.0, city: "شهر" },
  { id: "t3", name: "نام مربی", rating: 5.0, city: "شهر" },
  { id: "t4", name: "نام مربی", rating: 4.6, city: "شهر" },
  { id: "t5", name: "نام مربی", rating: 4.2, city: "شهر" },
  { id: "t6", name: "نام مربی", rating: 4.8, city: "شهر" },
];

export default function TopTrainersScreen({ onBack, onSelectTrainer }) {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        // اگر API limit می‌گیرد، عدد بزرگ‌تر بده تا لیست کامل‌تر بیاید
        const list = await getTopTrainers(50);
        console.log(list);

        if (!mounted) return;

        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map((item) => ({
            id: item.id,
            name: item.name || item.full_name || item.username || "مربی",
            avatarUrl: item.avatarUrl || item.avatar_url || null,
            city: item.city || "شهر",
            rating: Number(item.rating) || 0,
          }));
          setTrainers(normalized);
        } else {
          setTrainers([]);
        }
      } catch (e) {
        console.log("getTopTrainers error:", e?.message || e);
        if (mounted) setTrainers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const listToShow = useMemo(() => {
    if (loading) return FALLBACK;
    if (trainers?.length) return trainers;
    return FALLBACK;
  }, [loading, trainers]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons
            name="chevron-forward"
            size={ms(24)}
            color={COLORS.primary}
          />
        </Pressable>

        <Text style={styles.title}>بهترین مربی ها</Text>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : null}

        <View style={styles.grid}>
          {listToShow.map((t, index) => (
            <TopTrainerCard
              key={t?.id ? String(t.id) : `top-${index}`}
              t={t}
              onPress={(trainer) => {
                navigation.navigate("TrainerPublicProfile", {
                  trainerId: trainer.id,
                  trainerData: trainer,
                });
              }}
              style={{ width: CARD_WIDTH }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    height: ms(44),
    justifyContent: "center",
    alignItems: "center",
    marginVertical: ms(12),
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

  scrollContent: { paddingBottom: ms(8) },
  loadingRow: { paddingVertical: ms(6) },

  grid: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: GAP,
    paddingTop: ms(8),
  },
});
