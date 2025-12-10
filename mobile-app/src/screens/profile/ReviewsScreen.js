// src/screens/profile/ReviewsScreen.js
import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { ms } from "react-native-size-matters";
import { useRoute } from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import RatingStars from "../../components/ui/RatingStars";

import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export default function ReviewsScreen() {
  const route = useRoute();
  const {
    rating: ratingFromRoute = 4.5, // فقط fallback
    name = "نام ثبت نشده",
    username,
    city,
    avatarUri,
    reviews: reviewsFromRoute,
  } = route.params || {};

  // اگر از route چیزی نیاید، دمو
  const demoReviews = [
    { id: 1, customerName: "نام مشتری", score: 4.5, date: "1402/10/12" },
    { id: 2, customerName: "نام مشتری", score: 3.0, date: "1402/09/25" },
    { id: 3, customerName: "نام مشتری", score: 5.0, date: "1402/08/03" },
    { id: 4, customerName: "نام مشتری", score: 4.0, date: "1402/07/19" },
  ];

  const reviews =
    Array.isArray(reviewsFromRoute) && reviewsFromRoute.length
      ? reviewsFromRoute
      : demoReviews;

  // محاسبه‌ی مجموع امتیازها و میانگین از روی خود کامنت‌ها
  let totalPoints = 0;
  let ratedCount = 0;

  reviews.forEach((r) => {
    const s =
      typeof r.score === "number"
        ? r.score
        : typeof r.rating === "number"
        ? r.rating
        : null;

    if (typeof s === "number") {
      totalPoints += s;
      ratedCount += 1;
    }
  });

  const reviewsCount = reviews.length; // تعداد کل نظرها (چه امتیاز داشته باشند چه نه)
  const averageRating = ratedCount ? totalPoints / ratedCount : ratingFromRoute;

  const ratingText = averageRating ? averageRating.toFixed(1) : "0.0";
  const totalPointsRounded = Math.round(totalPoints);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: ms(32) }}
    >
      {/* ---------- هدر شبیه ProfileTab + آواتار واقعی ---------- */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome5
                name="user-alt"
                size={ms(42)}
                color={COLORS.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.headerTextCol}>
          <Text style={styles.name}>{name}</Text>

          <Text style={styles.username}>
            {username ? `@${username}` : "@ID ثبت نشده"}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={ms(18)}
              color={COLORS.inputBg2}
              style={{ marginLeft: ms(4) }}
            />
            <Text style={styles.locationText}>{city || "شهر ثبت نشده"}</Text>
          </View>
        </View>
      </View>

      {/* ---------- بخش امتیاز کلی مثل فیگما ---------- */}
      <View style={styles.ratingSummary}>
        {/* ستاره‌ها و متن زیرش سمت چپ */}
        <View style={styles.ratingLeft}>
          {/* ستاره‌ها براساس میانگین واقعی */}
          <RatingStars rating={averageRating} size={ms(16)} />

          {/* مجموع کل امتیازها و تعداد نظرها */}
          <Text style={styles.ratingMeta}>
            {totalPointsRounded} امتیاز، {reviewsCount} نظر
          </Text>
        </View>

        {/* عدد بزرگ سمت راست: میانگین ریتینگ */}
        <Text style={styles.bigRating}>{ratingText}</Text>
      </View>

      {/* تیتر "نظر مشتریان" با خط زیر 85% عرض صفحه */}
      <View style={styles.sectionTitleWrapper}>
        <Text style={styles.sectionTitle}>نظر مشتریان</Text>
        <View style={styles.sectionUnderline} />
      </View>

      {/* ---------- کارت‌های نظرات ---------- */}
      {reviews.map((r, index) => {
        const customerName = r.customerName || r.name || "نام مشتری";
        const date = r.date || r.createdAt || "";
        const score =
          typeof r.score === "number"
            ? r.score
            : typeof r.rating === "number"
            ? r.rating
            : 0;
        const comment = r.comment || r.text || "";

        return (
          <View key={r.id ?? index} style={styles.reviewCard}>
            {/* ردیف بالا: نام مشتری - تاریخ / امتیاز */}
            <View style={styles.reviewTopRow}>
              <View style={styles.reviewNameDate}>
                <Text style={styles.reviewName}>{customerName}</Text>
                {date ? <Text style={styles.reviewDate}> - {date}</Text> : null}
              </View>

              {/* امتیاز این نظر (ستاره + عدد کوچک) */}
              <View style={styles.reviewScoreWrapper}>
                <AntDesign
                  name="star"
                  size={ms(16)}
                  color={COLORS.primary}
                  style={{ marginLeft: ms(4) }}
                />
                <Text style={styles.reviewScoreLabel}>امتیاز</Text>
                {score ? (
                  <Text style={styles.reviewScoreValue}>
                    {score.toFixed(1)}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* متن نظر یا placeholder اگر هنوز نظری ثبت نشده */}
            <Text
              style={[
                styles.reviewComment,
                !comment && styles.reviewCommentPlaceholder,
              ]}
              numberOfLines={2}
            >
              {comment || "متن نظر مشتری بعد از ثبت اینجا نمایش داده می‌شود."}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: ms(16),
    paddingTop: ms(32),
  },

  // --- هدر (کپی از پروفایل) ---
  header: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginBottom: ms(20),
    marginTop: ms(25),
    marginHorizontal: ms(10),
  },
  avatarWrapper: {
    width: ms(110),
    height: ms(110),
    borderRadius: ms(55),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: ms(8),
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: ms(55),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: ms(55),
  },
  headerTextCol: {
    flex: 1,
    flexDirection: "column",
    marginRight: ms(25),
    marginBottom: ms(20),
    gap: ms(6),
  },
  name: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.white,
    marginVertical: ms(10),
    textAlign: "right",
  },
  username: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white,
    marginRight: ms(10),
    marginBottom: ms(10),
    textAlign: "right",
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: ms(10),
  },
  locationText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white,
  },

  // --- خلاصه امتیاز ---
  ratingSummary: {
    flexDirection: "row", // چپ به راست: ستاره‌ها چپ، عدد راست
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ms(20),
  },
  ratingLeft: {
    alignItems: "flex-start",
    marginRight: ms(20),
  },
  ratingMeta: {
    marginTop: ms(4),
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.white,
  },
  bigRating: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(36),
    color: COLORS.primary,
  },

  // --- عنوان "نظر مشتریان" ---
  sectionTitleWrapper: {
    alignItems: "center",
    marginBottom: ms(16),
  },
  sectionTitle: {
    transform: [{ translateX: ms(90) }],

    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.primary,
    marginBottom: ms(4),
  },
  sectionUnderline: {
    width: "93%",
    height: ms(1),
    backgroundColor: COLORS.primary,
    marginBottom: ms(20),
  },

  // --- کارت‌های نظر ---
  reviewCard: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(16),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    gap: ms(25),
    marginBottom: ms(20),
    Height: ms(91),
    justifyContent: "space-between",
  },
  reviewTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ms(8),
  },
  reviewNameDate: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  reviewName: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text,
  },
  reviewDate: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.text2,
  },

  // بلوک امتیاز سمت چپ کارت
  reviewScoreWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewScoreLabel: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.text,
    marginRight: ms(2),
  },
  reviewScoreValue: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.primary,
    marginLeft: ms(4),
  },

  // متن نظر / placeholder
  reviewComment: {
    marginTop: ms(4),
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.text,
    lineHeight: ms(17),
    textAlign: "right",
  },
  reviewCommentPlaceholder: {
    color: COLORS.text2,
    fontStyle: "italic",
  },

  // متن "نظر" در گوشه راست پایین کارت
  reviewLabelBottom: {
    alignSelf: "flex-end",
    marginTop: ms(4),
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.text2,
  },
});
