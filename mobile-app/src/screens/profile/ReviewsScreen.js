// src/screens/profile/ReviewsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { ms } from "react-native-size-matters";
import { useRoute } from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import RatingStars from "../../components/ui/RatingStars";

import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

// ✅ API گرفتن نظرات مربی
import { getTrainerReviews } from "../../../api/trainer.js";

export default function ReviewsScreen() {
  const route = useRoute();

  // پارامترهایی که از ProfileTab پاس داده می‌شن
  const {
    rating: ratingFromRoute = 5, // امتیاز کلی که از پروفایل می‌آد
    ratingCount: ratingCountFromRoute = 5, // تعداد نظرات کلی
    name = "نام ثبت نشده",
    username,
    city,
    avatarUri,
    trainerId, // 👈 خیلی مهم برای گرفتن نظرات از API
  } = route.params || {};

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // برای مدیریت "بیشتر / کمتر" هر کامنت
  const [expandedReviews, setExpandedReviews] = useState({}); // { [id یا index]: true/false }

  const toggleExpand = (key) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // گرفتن نظرات واقعی از API
  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      if (!trainerId) {
        console.log("No trainerId provided for ReviewsScreen");
        return;
      }

      try {
        setLoading(true);
        const data = await getTrainerReviews(trainerId);

        if (!isMounted) return;

        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          setReviews([]);
        }
      } catch (e) {
        if (!isMounted) return;
        console.log("Error loading trainer reviews:", e?.message || e);
        setReviews([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [trainerId]);

  // اگر از سرور نظرات اومده باشه، از همونا استفاده می‌کنیم
  const reviewsCount =
    (Array.isArray(reviews) && reviews.length) || ratingCountFromRoute || 0;

  // اگر از خود لیست نظرات بتونیم میانگین حساب کنیم، از اون استفاده می‌کنیم
  let computedAverage = null;

  if (Array.isArray(reviews) && reviews.length > 0) {
    let sum = 0;
    let count = 0;

    reviews.forEach((r) => {
      const s =
        typeof r.score === "number"
          ? r.score
          : typeof r.rating === "number"
          ? r.rating
          : null;

      if (typeof s === "number") {
        sum += s;
        count += 1;
      }
    });

    if (count > 0) {
      computedAverage = sum / count;
    }
  }

  // امتیاز نهایی که نمایش داده می‌شه:
  const averageRating = computedAverage ?? ratingFromRoute;
  const ratingText = averageRating ? averageRating.toFixed(1) : "0.0";

  // برای نمایش "چند امتیاز"
  const totalPointsRounded = Math.round(averageRating * reviewsCount);

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

      {/* ---------- بخش امتیاز کلی ---------- */}
      <View style={styles.ratingSummary}>
        <View style={styles.ratingLeft}>
          <RatingStars rating={averageRating} size={ms(16)} />

          <Text style={styles.ratingMeta}>
            {totalPointsRounded} امتیاز، {reviewsCount} نظر
          </Text>
        </View>

        <Text style={styles.bigRating}>{ratingText}</Text>
      </View>

      {/* تیتر "نظر مشتریان" */}
      <View style={styles.sectionTitleWrapper}>
        <Text style={styles.sectionTitle}>نظر مشتریان</Text>
        <View style={styles.sectionUnderline} />
      </View>

      {/* ---------- کارت‌های نظرات ---------- */}
      {Array.isArray(reviews) && reviews.length > 0 ? (
        reviews.map((r, index) => {
          const customerName =
            r.trainee_name || r.customerName || r.name || "نام مشتری ";
          const rawDate = r.created_at || r.date || r.createdAt || "";
          const date = rawDate ? String(rawDate).slice(0, 10) : "";
          const score =
            typeof r.score === "number"
              ? r.score
              : typeof r.rating === "number"
              ? r.rating
              : 0;
          const comment = r.comment || r.text || "";

          const key = r.id ?? index;
          const isExpanded = !!expandedReviews[key];
          const isLong = comment && comment.length > 90; // هر متنی طولانی‌تر از این، دکمه "بیشتر" می‌گیرد

          return (
            <View key={key} style={styles.reviewCard}>
              <View style={styles.reviewTopRow}>
                <View style={styles.reviewNameDate}>
                  <Text style={styles.reviewName}>{customerName} </Text>
                  {date ? (
                    <Text style={styles.reviewDate}> {date} </Text>
                  ) : null}
                </View>

                <View style={styles.reviewScoreWrapper}>
                  <AntDesign
                    name="star"
                    size={ms(20)}
                    color={COLORS.primary}
                    style={{ marginLeft: ms(4) }}
                  />
                  {typeof score === "number" && score > 0 ? (
                    <Text style={styles.reviewScoreValue}>
                      {score.toFixed(1)}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* متن نظر */}
              <Text
                style={[
                  styles.reviewComment,
                  !comment && styles.reviewCommentPlaceholder,
                ]}
                numberOfLines={isExpanded ? undefined : 2} // 👈 در حالت عادی ۲ خط، اگر بیشتر شد باز می‌کنیم
              >
                {comment || "متن نظر مشتری بعد از ثبت اینجا نمایش داده می‌شود."}
              </Text>

              {/* دکمه "بیشتر / کمتر" فقط اگر متن طولانی باشد */}
              {isLong && (
                <Pressable
                  onPress={() => toggleExpand(key)}
                  hitSlop={8}
                  style={styles.moreLessWrapper}
                >
                  <Text style={styles.moreLessText}>
                    {isExpanded ? "کمتر" : "بیشتر"}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })
      ) : (
        // اگر هنوز نظری ثبت نشده
        <Text
          style={{
            fontFamily: "Vazirmatn_400Regular",
            fontSize: ms(12),
            color: COLORS.text2,
            textAlign: "center",
            marginTop: ms(12),
          }}
        >
          هنوز نظری برای این مربی ثبت نشده است.
        </Text>
      )}
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
    transform: [{ translateY: ms(-8) }],
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
    marginBottom: ms(5),
    textAlign: "right",
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  locationText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white,
  },

  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ms(20),
    gap: ms(70),
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

  sectionTitleWrapper: {
    alignItems: "center",
    marginBottom: ms(16),
  },
  sectionTitle: {
    transform: [{ translateX: ms(90) }],
    fontFamily: "Vazirmatn_400Regular",
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

  reviewCard: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(16),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    gap: ms(8),
    marginBottom: ms(20),
    minHeight: ms(91), // 👈 حداقل ارتفاع، ولی در صورت "بیشتر" بزرگ می‌شود
    justifyContent: "space-between",
  },
  reviewTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ms(4),
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
    marginRight: ms(10),
  },
  reviewScoreWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewScoreValue: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(18),
    color: COLORS.primary,
    marginLeft: ms(7),
    transform: [{ translateY: ms(2) }],
  },
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

  // دکمه "بیشتر / کمتر"
  moreLessWrapper: {
    alignSelf: "flex-start", // سمت چپ کارت (چون RTL است)
    marginTop: ms(4),
  },
  moreLessText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.primary,
  },

  reviewLabelBottom: {
    alignSelf: "flex-end",
    marginTop: ms(4),
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.text2,
  },
});
