// src/components/home/MyAthleteRow.js
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { ms } from "react-native-size-matters";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { COLORS } from "../../theme/colors";

export default function MyAthleteRow({ athlete, onPress, style }) {
  const name = useMemo(() => {
    const full =
      athlete?.name ||
      athlete?.fullName ||
      athlete?.full_name ||
      athlete?.username ||
      "";
    const trimmed = String(full).trim();
    return trimmed || "نام و نام خانوادگی کاربر";
  }, [athlete]);

  const avatarUri =
    athlete?.avatarUrl || athlete?.avatar_url || athlete?.avatar || null;

  return (
    <Pressable
      style={[styles.card, style]}
      onPress={() => onPress?.(athlete)}
      hitSlop={8}
    >
      {/* Avatar (Right) */}
      <View style={styles.avatarOuter}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <FontAwesome5 name="user-alt" size={ms(18)} color={COLORS.primary} />
        )}
      </View>

      {/* Name (Center/Right aligned like Figma) */}
      <View style={styles.nameWrap}>
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: ms(18),
    minHeight: ms(64),
    paddingHorizontal: ms(14),
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: ms(5),

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: ms(10),
    shadowOffset: { width: 0, height: ms(4) },
    elevation: 2,
  },

  avatarOuter: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginLeft: ms(12),
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },

  nameWrap: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  nameText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.primary,
    textAlign: "right",
  },
});
