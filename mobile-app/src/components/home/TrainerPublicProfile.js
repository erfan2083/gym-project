// src/components/home/TrainerPublicProfile.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import { useNavigation, useRoute } from "@react-navigation/native";
import RatingStars from "../ui/RatingStars";
import TelegramIcon from "../ui/Telegramicon";
import TamasIcon from "../ui/Tamas";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import InstaIcon from "../ui/Instaicon";

// ایمپورت توابع API
import {
  getTrainerPlans,
  getTrainerRatingSummary,
  getTrainerProfileById, // ✅ تابعی که بالا اضافه کردیم
} from "../../../api/trainer.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - ms(60);
const CARD_HEIGHT = ms(130);
const CIRCLE_SIZE = CARD_HEIGHT * 2;
const INFO_MARGIN_LEFT = CARD_HEIGHT * 0.55;

// تبدیل اعداد به فارسی
const toPersianDigits = (str) => {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/\d/g, (d) => map[Number(d)]);
};

// فرمت قیمت
const formatPrice = (value) => {
  if (value === undefined || value === null) return "۰";
  const raw = String(value).replace(/,/g, "").trim();
  const integerPart = raw.includes(".") ? raw.split(".")[0] : raw;
  const digitsOnly = integerPart.replace(/[^\d]/g, "");
  if (!digitsOnly) return "۰";
  const withCommas = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return toPersianDigits(withCommas);
};

// تبدیل دیتای پلن به فرمت کارت
const mapPlanRowToSubscriptionCard = (planRow) => {
  const durationDays = Number(planRow?.duration_in_days || 0);
  const price =
    planRow?.price !== undefined && planRow?.price !== null
      ? String(planRow.price)
      : "0";

  return {
    id: String(planRow?.id ?? Date.now()),
    name: planRow?.title || "اشتراک",
    durationLabel:
      durationDays > 0 ? `${toPersianDigits(durationDays)} روز` : "مدت زمان",
    priceText: price,
    descriptionShort: planRow?.description || "توضیحات بیشتر",
  };
};

export default function TrainerPublicProfile() {
  const route = useRoute();
  const navigation = useNavigation();

  // گرفتن ID مربی از پارامترهای نویگیشن
  const { trainerId, trainerData } = route.params || {};

  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const subScrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        if (!trainerId) throw new Error("شناسه مربی یافت نشد.");

        // 1. دریافت همزمان اطلاعات پروفایل، امتیاز و پلن‌ها
        const [profileData, ratingData, plansData] = await Promise.all([
          getTrainerProfileById(trainerId).catch(() => null), // اگر این فیل شد، نل برگردون
          getTrainerRatingSummary(trainerId).catch(() => ({ avgRating: 0, reviewCount: 0 })),
          getTrainerPlans(trainerId).catch(() => []),
        ]);

        if (!isMounted) return;

        // اگر پروفایل کامل از سرور نیامد، از دیتای پاس داده شده (trainerData) استفاده کن
        const baseData = profileData || trainerData || {};

        const mappedProfile = {
          username: baseData.username,
          name: baseData.fullName || baseData.name || "نام مربی",
          city: baseData.city || "",
          avatarUri: baseData.avatarUrl || baseData.avatarUri || null,
          specialties: Array.isArray(baseData.specialties) ? baseData.specialties : [],
          description: baseData.bio || baseData.description || "",
          phone: baseData.contactPhone || "",
          instagram: baseData.instagramUrl || "",
          telegram: baseData.telegramUrl || "",
          certificateImageUrl: baseData.certificateImageUrl || null,
          userId: trainerId,
          // اولویت با دیتای دقیق API است، اگر نبود دیتای صفحه قبل
          rating: typeof ratingData?.avgRating === "number" 
            ? ratingData.avgRating 
            : (Number(baseData.rating) || 0),
          ratingCount: ratingData?.reviewCount ?? 0,
        };

        setProfile(mappedProfile);

        // مپ کردن پلن‌ها
        if (Array.isArray(plansData)) {
          setSubscriptions(plansData.map(mapPlanRowToSubscriptionCard));
        } else {
          setSubscriptions([]);
        }

      } catch (err) {
        console.error(err);
        if (isMounted) setError("خطا در دریافت اطلاعات مربی");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [trainerId, trainerData]);

  // استخراج متغیرها برای نمایش در UI
  const name = profile?.name || "";
  const username = profile?.username || "";
  const city = profile?.city || "";
  const avatarUri = profile?.avatarUri || null;
  const specialtiesRaw = profile?.specialties ?? [];
  const description = profile?.description || "";
  const phone = profile?.phone || "";
  const instagram = profile?.instagram || "";
  const telegram = profile?.telegram || "";
  const certificateImageUrl = profile?.certificateImageUrl || null;
  const rating = profile?.rating || 0;
  const ratingCount = profile?.ratingCount || 0;

  // پردازش تخصص‌ها
  let specialties = [];
  if (Array.isArray(specialtiesRaw)) {
    specialties = specialtiesRaw.filter(Boolean);
  } else if (typeof specialtiesRaw === "string") {
    specialties = specialtiesRaw
      .split(/[\n,،]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const hasPhone = !!phone;
  const hasInstagram = !!instagram;
  const hasTelegram = !!telegram;

  // هندلر دکمه‌های تماس
  const handleLink = (url) => Linking.openURL(url).catch(() => {});
  const handleInstagram = () => {
    if (!hasInstagram) return;
    let h = instagram.trim().replace("@", "");
    handleLink(h.startsWith("http") ? h : `https://instagram.com/${h}`);
  };
  const handleTelegram = () => {
    if (!hasTelegram) return;
    let h = telegram.trim().replace("@", "");
    handleLink(h.startsWith("http") ? h : `https://t.me/${h}`);
  };
  const handlePhone = () => hasPhone && handleLink(`tel:${phone}`);

  // لاجیک اسلایدر پلن‌ها
  const handleDotPress = (idx) => {
    if (!subscriptions.length) return;
    const target = Math.max(0, Math.min(idx, subscriptions.length - 1));
    setActiveSubIndex(target);
    subScrollRef.current?.scrollTo({ x: target * CARD_WIDTH, animated: true });
  };

  const handleMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / CARD_WIDTH);
    setActiveSubIndex(idx);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* هدر: دکمه بک + آواتار + مشخصات */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={ms(22)} color={COLORS.white} />
        </Pressable>

        <View style={styles.starsRow}>
          <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
          <RatingStars rating={rating} size={ms(16)} />
        </View>

        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome5 name="user-alt" size={ms(42)} color={COLORS.primary} />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{name}</Text>
          {!!username && <Text style={styles.username}>@{username}</Text>}
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={ms(16)} color={COLORS.inputBg2} />
            <Text style={styles.locationText}>{city}</Text>
          </View>
        </View>
      </View>

      {/* دکمه نظرات */}
      <View style={styles.reviewsRow}>
        <Pressable
          onPress={() =>
            navigation.navigate("ReviewsScreen", {
              trainerId,
              rating,
              ratingCount,
              name,
              avatarUri,
            })
          }
          style={styles.reviewsButton}
        >
          <Text style={styles.reviewsButtonText}>نظرات ({ratingCount})</Text>
          <AntDesign name="arrowleft" size={ms(16)} color={COLORS.white} style={{ marginLeft: ms(6) }} />
        </Pressable>
      </View>

      {/* حیطه تخصصی */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>حیطه تخصصی:</Text>
        <View style={styles.card}>
          {specialties.length > 0 ? (
            specialties.map((item, idx) => (
              <View key={idx} style={styles.specialtyRow}>
                <View style={styles.bullet} />
                <Text style={styles.cardText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>تخصصی ثبت نشده است.</Text>
          )}
        </View>
      </View>

      {/* مدرک مربیگری */}
      {certificateImageUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مدرک مربیگری:</Text>
          <View style={[styles.card, styles.certificateCard]}>
            <Pressable
              onPress={() => setCertificateModalVisible(true)}
              style={styles.certificateThumbWrapper}
            >
              <Image
                source={{ uri: certificateImageUrl }}
                style={styles.certificateThumb}
                resizeMode="cover"
              />
              <View style={styles.certificateOverlay}>
                <Feather name="maximize-2" size={ms(18)} color={COLORS.white} style={{ marginLeft: ms(6) }} />
                <Text style={styles.certificateOverlayText}>مشاهده کامل</Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}

      {/* بیوگرافی */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>توضیحات و سوابق:</Text>
        <View style={[styles.card, styles.descCard]}>
          <Text style={description ? styles.cardText : styles.placeholderText}>
            {description || "توضیحاتی ثبت نشده است."}
          </Text>
        </View>
      </View>

      {/* پلن‌ها (اسلایدر) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>پلن‌ها و اشتراک‌ها:</Text>
        {subscriptions.length > 0 ? (
          <View style={styles.subWrapper}>
            <View style={styles.subViewport}>
              <ScrollView
                ref={subScrollRef}
                horizontal
                pagingEnabled
                snapToInterval={CARD_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumEnd}
                contentContainerStyle={{ paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - ms(30) }} // وسط چین کردن اولین کارت
              >
                {subscriptions.map((sub) => (
                  <View key={sub.id} style={styles.subPage}>
                    <View style={styles.subCard}>
                      <View style={styles.subCircle} />
                      <View style={styles.subPriceBox}>
                        <Text style={styles.subPrice}>{formatPrice(sub.priceText)}</Text>
                        <Text style={styles.subUnit}>تومان</Text>
                      </View>
                      <View style={styles.subInfo}>
                        <Text style={styles.subName}>{sub.name}</Text>
                        <Text style={styles.subDuration}>{sub.durationLabel}</Text>
                        <View style={styles.subDivider} />
                        <Text style={styles.subDesc} numberOfLines={2}>
                          {sub.descriptionShort}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* نقطه‌های اسلایدر */}
            <View style={styles.dotsRow}>
              {subscriptions.map((_, idx) => (
                <Pressable key={idx} onPress={() => handleDotPress(idx)} hitSlop={10}>
                  <View style={[styles.dot, idx === activeSubIndex && styles.dotActive]} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.placeholderText}>این مربی هنوز پلنی تعریف نکرده است.</Text>
          </View>
        )}
      </View>

      {/* ارتباط */}
      <View style={[styles.section, { marginTop: ms(20) }]}>
        <Text style={styles.sectionTitle}>راه‌های ارتباطی:</Text>
        <View style={styles.contactsRow}>
          <Pressable onPress={handleTelegram} disabled={!hasTelegram} style={[styles.contactBtn, !hasTelegram && styles.disabledBtn]}>
            <TelegramIcon size={50} />
          </Pressable>
          <Pressable onPress={handlePhone} disabled={!hasPhone} style={[styles.contactBtn, !hasPhone && styles.disabledBtn]}>
            <TamasIcon size={45} />
          </Pressable>
          <Pressable onPress={handleInstagram} disabled={!hasInstagram} style={[styles.contactBtn, !hasInstagram && styles.disabledBtn]}>
            <InstaIcon size={50} />
          </Pressable>
        </View>
      </View>

      {/* مودال مدرک */}
      <Modal visible={certificateModalVisible} transparent animationType="fade" onRequestClose={() => setCertificateModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCertificateModalVisible(false)} />
        <View style={styles.modalContent}>
          <Pressable style={styles.modalClose} onPress={() => setCertificateModalVisible(false)}>
            <Feather name="x" size={ms(24)} color={COLORS.white} />
          </Pressable>
          {certificateImageUrl && (
            <Image source={{ uri: certificateImageUrl }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  contentContainer: { paddingBottom: ms(32) },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },

  // هدر
  header: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginTop: ms(24),
    marginBottom: ms(24),
    paddingHorizontal: ms(20),
  },
  backButton: {
    position: "absolute",
    left: ms(20),
    top: ms(-10),
    padding: ms(8),
    zIndex: 10,
  },
  avatarWrapper: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: ms(16),
  },
  avatarPlaceholder: { width: "100%", height: "100%", borderRadius: ms(50), backgroundColor: COLORS.inputBg2, justifyContent: "center", alignItems: "center" },
  avatarImage: { width: "100%", height: "100%", borderRadius: ms(50) },
  
  headerInfo: { flex: 1, alignItems: "flex-end", justifyContent: "center", marginBottom: ms(10) },
  name: { fontFamily: "Vazirmatn_700Bold", fontSize: ms(16), color: COLORS.white, marginBottom: ms(4) },
  username: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(12), color: COLORS.text2, marginBottom: ms(6) },
  locationRow: { flexDirection: "row-reverse", alignItems: "center", gap: ms(4) },
  locationText: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(12), color: COLORS.white },

  starsRow: { position: "absolute", left: ms(20), top: ms(40), flexDirection: "row-reverse", alignItems: "center", gap: ms(4) },
  ratingNumber: { fontFamily: "Vazirmatn_700Bold", fontSize: ms(14), color: COLORS.primary },

  // دکمه نظرات
  reviewsRow: { alignItems: "center", marginTop: ms(-10), marginBottom: ms(20) },
  reviewsButton: {
    backgroundColor: "#444",
    paddingVertical: ms(8),
    paddingHorizontal: ms(16),
    borderRadius: ms(20),
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  reviewsButtonText: { fontFamily: "Vazirmatn_700Bold", fontSize: ms(12), color: COLORS.white },

  // سکشن‌ها
  section: { marginBottom: ms(16), paddingHorizontal: ms(24) },
  sectionTitle: { fontFamily: "Vazirmatn_700Bold", fontSize: ms(13), color: COLORS.primary, textAlign: "right", marginBottom: ms(10) },
  card: { backgroundColor: COLORS.inputBg2, borderRadius: ms(16), padding: ms(16) },
  cardText: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(12), color: COLORS.text, textAlign: "right", lineHeight: ms(20) },
  placeholderText: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(12), color: COLORS.text2, textAlign: "right" },
  
  specialtyRow: { flexDirection: "row-reverse", alignItems: "center", marginBottom: ms(6) },
  bullet: { width: ms(6), height: ms(6), borderRadius: ms(3), backgroundColor: COLORS.primary, marginLeft: ms(8) },

  descCard: { minHeight: ms(80) },

  // مدرک
  certificateCard: { height: ms(160), padding: 0, overflow: "hidden" },
  certificateThumbWrapper: { width: "100%", height: "100%" },
  certificateThumb: { width: "100%", height: "100%" },
  certificateOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", padding: ms(8), flexDirection: "row-reverse", alignItems: "center" },
  certificateOverlayText: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(12), color: COLORS.white },

  // اسلایدر پلن‌ها
  subWrapper: { alignItems: "center" },
  subViewport: { height: CARD_HEIGHT },
  subPage: { width: CARD_WIDTH, paddingHorizontal: ms(5) },
  subCard: {
    height: "100%",
    borderRadius: ms(24),
    backgroundColor: COLORS.lighgreen,
    overflow: "hidden",
    position: "relative",
  },
  subCircle: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: COLORS.inputBg2,
    left: -CIRCLE_SIZE / 2,
    top: -CIRCLE_SIZE / 2,
  },
  subPriceBox: { position: "absolute", left: ms(20), bottom: ms(20), alignItems: "flex-start" },
  subPrice: { fontFamily: "Vazirmatn_700Bold", fontSize: ms(18), color: COLORS.text3, marginBottom: ms(-4) },
  subUnit: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(12), color: COLORS.text3, alignSelf: "flex-end" },
  
  subInfo: { marginLeft: INFO_MARGIN_LEFT, padding: ms(14), height: "100%", justifyContent: "center" },
  subName: { fontFamily: "Vazirmatn_700Bold", fontSize: ms(14), color: COLORS.text3, textAlign: "right" },
  subDuration: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(12), color: COLORS.text3, textAlign: "right", marginTop: ms(2) },
  subDivider: { height: 1, backgroundColor: COLORS.text3, width: "100%", marginVertical: ms(8), opacity: 0.5 },
  subDesc: { fontFamily: "Vazirmatn_400Regular", fontSize: ms(11), color: COLORS.text3, textAlign: "right" },

  dotsRow: { flexDirection: "row", marginTop: ms(12), gap: ms(6) },
  dot: { width: ms(8), height: ms(8), borderRadius: ms(4), borderWidth: 1, borderColor: COLORS.lighgreen },
  dotActive: { backgroundColor: COLORS.lighgreen },

  // تماس
  contactsRow: { flexDirection: "row-reverse", justifyContent: "center", gap: ms(24), marginTop: ms(8) },
  contactBtn: { width: ms(50), height: ms(50), justifyContent: "center", alignItems: "center" },
  disabledBtn: { opacity: 0.3 },

  // مودال فول اسکرین
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)" },
  modalContent: { position: "absolute", inset: 0, justifyContent: "center", alignItems: "center" },
  modalImage: { width: "100%", height: "80%" },
  modalClose: { position: "absolute", top: ms(40), left: ms(20), padding: ms(10), zIndex: 10 },
});