// src/components/ui/TopTrainerCard.js
import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import RatingStars from "./RatingStars";

export default function TopTrainerCard({ t, onPress, style }) {
  // مقادیر پیش‌فرض برای جلوگیری از کرش
  const name = t?.name ?? "نام مربی";
  const city = t?.city ?? "شهر";
  const rating = typeof t?.rating === "number" ? t.rating : Number(t?.rating || 0);
  const avatarUrl = t?.avatarUrl;

  return (
    <Pressable
      style={[styles.card, style]}
      onPress={() => onPress?.(t)}
      hitSlop={6}
    >
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatarImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <FontAwesome5 name="user-alt" size={ms(20)} color={COLORS.primary} />
          </View>
        )}
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.ratingRow}>
          {/* اگر کامپوننت RatingStars دارید که عالی، اگر نه فعلا متن بگذارید */}
           <RatingStars rating={rating} size={ms(12)} />
           {/* <Text style={{fontSize: 10}}>{rating}</Text> */}
        </View>

        <View style={styles.cityRow}>
          <Text style={styles.city} numberOfLines={1}>
            {city}
          </Text>
          <Ionicons
            name="location-sharp"
            size={ms(12)}
            color={COLORS.text3}
            style={{ marginLeft: ms(2) }}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: ms(14),
    padding: ms(10),
    minHeight: ms(120),
    alignItems: "center",
    // اضافه کردن سایه ملایم برای زیبایی بیشتر
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: ms(8),
  },
  avatarImage: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    backgroundColor: COLORS.inputBg2,
  },
  avatarPlaceholder: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCol: {
    width: "100%",
    alignItems: "center", // وسط چین کردن کلی محتوا
  },
  name: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.text, // رنگ اصلی متن
    marginBottom: ms(4),
    textAlign: "center",
  },
  ratingRow: {
    marginBottom: ms(4),
    flexDirection: "row",
    justifyContent: "center",
  },
  cityRow: {
    flexDirection: "row", // چیدمان آیکون و متن
    alignItems: "center",
    justifyContent: "center",
  },
  city: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(10),
    color: COLORS.text3,
  },
});