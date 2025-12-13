// src/components/ui/TopTrainerCard.js
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import RatingStars from "./RatingStars";

export default function TopTrainerCard({ t, onPress, style }) {
  const name = t?.name ?? "نام مربی";
  const city = t?.city ?? "شهر";
  const rating =
    typeof t?.rating === "number" ? t.rating : Number(t?.rating || 0);

  return (
    <Pressable
      style={[styles.card, style]}
      onPress={() => onPress?.(t)}
      hitSlop={6}
    >
      <View style={styles.avatarCircle}>
        <FontAwesome5 name="user-alt" size={ms(20)} color={COLORS.primary} />
      </View>

      {/* ✅ متن‌ها جدا از آواتار و Start/Right */}
      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.ratingRow}>
          <RatingStars rating={rating} size={ms(12)} />
        </View>

        <View style={styles.cityRow}>
          <Ionicons
            name="location-sharp"
            size={ms(14)}
            color={COLORS.text3}
            style={{ marginLeft: ms(2) }}
          />
          <Text style={styles.city} numberOfLines={1}>
            {city}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: ms(14),
    paddingHorizontal: ms(10),
    paddingVertical: ms(10),
    minHeight: ms(120),

    // آواتار همچنان وسط، اما اطلاعات جدا کنترل می‌شوند
    alignItems: "center",
  },

  avatarCircle: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ms(8),
  },

  // ✅ ستون اطلاعات: راست‌چین و از شروع
  infoCol: {
    alignSelf: "stretch",
    alignItems: "flex-end",
    paddingHorizontal: ms(2),
  },

  name: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(10.5),
    color: COLORS.text3,
    textAlign: "right",
    alignSelf: "stretch",
    marginBottom: ms(6),
  },

  ratingRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignSelf: "stretch",
    marginBottom: ms(6),
  },

  cityRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "stretch",
  },

  city: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(10.5),
    color: COLORS.text3,
    textAlign: "right",
  },
});
