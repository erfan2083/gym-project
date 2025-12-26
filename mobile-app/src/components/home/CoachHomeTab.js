import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { COLORS } from "../../theme/colors";
import { useProfileStore } from "../../store/profileStore";
import MyAthleteRow from "./MyAthleteRow";
import { getMyAthletes } from "../../../api/trainer"; // مسیر را مطابق پروژه‌ات تنظیم کن

export default function CoachHomeTab({ onSelectAthlete }) {
  const profile = useProfileStore((s) => s.profile);

  const displayName = useMemo(() => {
    const n = profile?.name || profile?.username || "";
    return String(n).trim() || "نام مربی";
  }, [profile?.name, profile?.username]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMyAthletes();
        if (!mounted) return;
        setAthletes(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setError("خطا در دریافت ورزشکاران");
        setAthletes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const athletesToShow = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return athletes;

    return athletes.filter((a) =>
      String(a?.name || "").toLowerCase().includes(q)
    );
  }, [query, athletes]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.topHeaderRow}>
        <View style={styles.userIconCircle}>
          <FontAwesome5 name="user-alt" size={ms(16)} color={COLORS.primary} />
        </View>
        <Text style={styles.userName}>{displayName}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={ms(18)}
          color={COLORS.text}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="جستجو در ورزشکاران"
          placeholderTextColor={COLORS.text2}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderText}>ورزشکاران من</Text>
        <View style={styles.sectionHeaderLine} />
      </View>

      {/* States */}
      {loading ? (
        <Text style={{ color: COLORS.text2, textAlign: "right" }}>
          در حال دریافت...
        </Text>
      ) : error ? (
        <Text style={{ color: COLORS.danger, textAlign: "right" }}>{error}</Text>
      ) : athletesToShow.length === 0 ? (
        <Text style={{ color: COLORS.text2, textAlign: "right" }}>
          هنوز ورزشکاری ندارید.
        </Text>
      ) : (
        <View style={styles.listWrap}>
          {athletesToShow.map((a, idx) => (
            <MyAthleteRow
              key={a?.id ? String(a.id) : `ath-${idx}`}
              athlete={a}
              onPress={(athlete) => onSelectAthlete?.(athlete)}
              style={styles.rowSpacing}
            />
          ))}
        </View>
      )}

      <View style={{ height: ms(10) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingVeretical: ms(24) },

  topHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: ms(6),
    marginBottom: ms(20),
  },
  userIconCircle: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(22),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
    marginRight: ms(10),
  },

  searchBar: {
    height: ms(50),
    borderRadius: ms(22),
    backgroundColor: COLORS.inputBg2,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: ms(14),
    marginBottom: ms(18),
  },
  searchIcon: { marginLeft: ms(8) },
  searchInput: {
    flex: 1,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.text,
    paddingVertical: 0,
  },

  sectionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: ms(10),
    marginBottom: ms(18),
  },
  sectionHeaderText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.primary,
    marginLeft: ms(10),
  },
  sectionHeaderLine: {
    flex: 1,
    height: ms(1),
    backgroundColor: COLORS.primary,
  },

  listWrap: { gap: ms(30) },
  rowSpacing: {},
});
