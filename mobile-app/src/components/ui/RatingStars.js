// src/components/ui/RatingStars.js
import React from "react";
import { View } from "react-native";
import { ms } from "react-native-size-matters";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../theme/colors";

const MAX_STARS = 5;

export default function RatingStars({ rating = 0, size = ms(16), style }) {
  // امتیاز را بین 0 و 5 نگه می‌داریم
  const clamped = Math.max(0, Math.min(rating, MAX_STARS));
  const baseFull = Math.floor(clamped);
  const fraction = clamped - baseFull;

  let fullStars = baseFull;
  let hasHalf = false;

  // <0.2 → 0 ، 0.2 تا <0.7 → نیمه ، >=0.7 → +1 ستاره
  if (fraction >= 0.2 && fraction < 0.7) {
    hasHalf = true;
  } else if (fraction >= 0.7) {
    fullStars = Math.min(baseFull + 1, MAX_STARS);
  }

  const emptyStars = MAX_STARS - fullStars - (hasHalf ? 1 : 0);

  return (
    <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>
      {Array.from({ length: fullStars }).map((_, idx) => (
        <AntDesign
          key={`full-${idx}`}
          name="star"
          size={size}
          color={COLORS.primary}
        />
      ))}

      {hasHalf && (
        <Ionicons
          key="half"
          name="star-half"
          size={size}
          color={COLORS.primary}
        />
      )}

      {Array.from({ length: emptyStars }).map((_, idx) => (
        <AntDesign
          key={`empty-${idx}`}
          name="staro"
          size={size}
          color={COLORS.primary}
        />
      ))}
    </View>
  );
}
