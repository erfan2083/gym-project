// src/components/home/ProfileTab.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
  Modal,
  ActivityIndicator,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import { useProfileStore } from "../../store/profileStore";
import { useNavigation } from "@react-navigation/native"; // ⬅️ اضافه شد
import RatingStars from "../ui/RatingStars";
import TelegramIcon from "../ui/Telegramicon";
import TamasIcon from "../ui/Tamas";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import InstaIcon from "../ui/Instaicon";
import { getMyTrainerProfile } from "../../../api/trainer.js";

export default function ProfileTab() {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);

  const name = profile?.name || profile?.username || "";
  const username = profile?.username || "";
  const city = profile?.city || "";
  const avatarUri = profile?.avatarUri || null;
  const specialtiesRaw = profile?.specialties ?? [];
  const description = profile?.description || "";
  const phone = profile?.phone || "";
  const instagram = profile?.instagram || "";
  const telegram = profile?.telegram || "";
  const certificateImageUrl = profile?.certificateImageUrl || null;
  const rating = profile?.rating ?? 4.5;
  const ratingCount = profile?.ratingCount ?? 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigation = useNavigation(); // ⬅️ برای ناوبری به فرم ادیت

  const [certificateModalVisible, setCertificateModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyTrainerProfile();

        if (!isMounted) return;

        const mapped = {
          username: data.username,
          name: data.fullName || data.username || "",
          city: data.city || "",
          avatarUri: data.avatarUrl || null,
          specialties: Array.isArray(data.specialties) ? data.specialties : [],
          description: data.bio || "",
          phone: data.contactPhone || "",
          instagram: data.instagramUrl || "",
          telegram: data.telegramUrl || "",
          certificateImageUrl: data.certificateImageUrl || null,
          rating: data.averageRate || 4.5,
          ratingCount: data.reviewCount || 0,
        };

        setProfile(mapped);
      } catch (e) {
        if (!isMounted) return;
        setError(
          e?.response?.data?.message || e.message || "خطا در گرفتن پروفایل مربی"
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [setProfile]);

  // ✅ حیطه تخصصی: هم آرایه، هم رشته‌ی کاما/ویرگول/خط‌جدید جداشده رو ساپورت کن
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

  const handleInstagramPress = () => {
    if (!hasInstagram) return;
    let handle = instagram.trim();
    if (handle.startsWith("@")) handle = handle.slice(1);
    const url = handle.startsWith("http")
      ? handle
      : `https://instagram.com/${handle}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleTelegramPress = () => {
    if (!hasTelegram) return;
    let handle = telegram.trim();
    if (handle.startsWith("@")) handle = handle.slice(1);
    const url = handle.startsWith("http") ? handle : `https://t.me/${handle}`;
    Linking.openURL(url).catch(() => {});
  };

  const handlePhonePress = () => {
    if (!hasPhone) return;
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleEditPress = () => {
    // 👇 اسم روت رو با چیزی که تو ناوبری‌ات برای فرم پروفایل گذاشتی یکی کن
    navigation.navigate("ProfileEdit");
  };

  if (loading && !profile?.username) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error && !profile?.username) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.danger }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* هدر بالا */}
      <View style={styles.header}>
        {/* آیکون ادیت بالا سمت چپ */}
        <Pressable
          style={styles.editButton}
          onPress={handleEditPress}
          hitSlop={8}
        >
          <Feather name="edit-2" size={ms(18)} color={COLORS.white} />
        </Pressable>

        {/* ⭐ امتیاز زیر دکمه ادیت */}
        <View style={styles.starsUnderEdit}>
          <Text style={styles.ratingNumber}>
            {rating ? rating.toFixed(1) : "0.0"}
          </Text>
          <RatingStars rating={rating} size={ms(16)} />
        </View>

        {/* بقیه هدر همان قبلی */}
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View
              className="avatarPlaceholder"
              style={styles.avatarPlaceholder}
            >
              <FontAwesome5
                name="user-alt"
                size={ms(42)}
                color={COLORS.primary}
              />
            </View>
          )}
        </View>
        <View
          style={{
            flexDirection: "column",
            marginRight: ms(25),
            marginBottom: ms(23),
            gap: ms(8),
          }}
        >
          {/* اسم – اگر نباشه: "نام ثبت نشده" */}
          <Text style={styles.name}>{name || "نام ثبت نشده"}</Text>

          {/* آیدی – اگر نباشه: "@ID ثبت نشده" */}
          <Text style={styles.username}>
            {username ? `@${username}` : "@ID ثبت نشده"}
          </Text>

          {/* لوکیشن – اگر نباشه: "شهر ثبت نشده" */}
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={ms(20)}
              color={COLORS.inputBg2}
              style={{ marginLeft: ms(4) }}
            />
            <Text style={styles.locationText}>{city || "شهر ثبت نشده"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.ratingAndButtonRow}>
        {/* فقط دکمه‌ی رفتن به صفحه نظرات */}
        <Pressable
          onPress={() =>
            navigation.navigate("ReviewsScreen", {
              rating,
              ratingCount,
              name,
              username,
              city,
              avatarUri,
            })
          }
          style={styles.reviewsButton}
        >
          <Text style={styles.reviewsButtonText}>نظرات</Text>
          <AntDesign
            name="arrowleft"
            size={ms(18)}
            color={COLORS.white}
            style={{ marginLeft: ms(6) }}
          />
        </Pressable>
      </View>

      {/* حیطه تخصصی */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>حیطه تخصصی:</Text>
        <View style={styles.card}>
          {specialties.length > 0 ? (
            specialties.map((item, idx) => (
              <View key={`${item}-${idx}`} style={styles.specialtyRow}>
                <View style={styles.bullet} />
                <Text style={styles.cardText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>تخصصی ثبت نشده است.</Text>
          )}
        </View>
      </View>

      {/* 🔥 مدرک مربیگری (بین حیطه تخصصی و توضیحات) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>مدرک مربیگری:</Text>

        {/* 👇 ارتفاع این کارت رو با استایل certificateCard ثابت می‌کنیم */}
        <View style={[styles.card, styles.certificateCard]}>
          {certificateImageUrl ? (
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
                <Feather
                  name="maximize-2"
                  size={ms(18)}
                  color={COLORS.white}
                  style={{ marginLeft: ms(6) }}
                />
                <Text style={styles.certificateOverlayText}>
                  مشاهده در اندازه کامل
                </Text>
              </View>
            </Pressable>
          ) : (
            <Text style={styles.placeholderText}>مدرکی ثبت نشده است.</Text>
          )}
        </View>
      </View>

      {/* توضیحات، افتخارات، سوابق */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>توضیحات، افتخارات، سوابق:</Text>
        <View style={[styles.card, styles.descCard]}>
          {description ? (
            <Text style={styles.cardText}>{description}</Text>
          ) : (
            <Text style={styles.placeholderText}>توضیحاتی ثبت نشده است.</Text>
          )}
        </View>
      </View>

      {/* راه های ارتباطی */}
      <View style={[styles.section, { marginTop: ms(20) }]}>
        <Text style={styles.sectionTitle}>راه های ارتباطی:</Text>
        <View style={styles.contactsRow}>
          <Pressable
            onPress={handleTelegramPress}
            disabled={!hasTelegram}
            style={[
              styles.contactBtn,
              !hasTelegram && styles.contactBtnDisabled,
            ]}
          >
            <TelegramIcon size={50} />
          </Pressable>

          <Pressable
            onPress={handlePhonePress}
            disabled={!hasPhone}
            style={[styles.contactBtn, !hasPhone && styles.contactBtnDisabled]}
          >
            <TamasIcon size={45} />
          </Pressable>
          <Pressable
            onPress={handleInstagramPress}
            disabled={!hasInstagram}
            style={[
              styles.contactBtn,
              !hasInstagram && styles.contactBtnDisabled,
            ]}
          >
            <InstaIcon size={50} />
          </Pressable>
        </View>
      </View>

      {/* مودال فول‌اسکرین برای مدرک */}
      <Modal
        visible={certificateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCertificateModalVisible(false)}
      >
        <Pressable
          style={styles.fullModalBackdrop}
          onPress={() => setCertificateModalVisible(false)}
        />
        <View style={styles.fullModalContent}>
          <Pressable
            style={styles.fullModalClose}
            onPress={() => setCertificateModalVisible(false)}
          >
            <Feather name="x" size={ms(22)} color={COLORS.white} />
          </Pressable>
          {certificateImageUrl && (
            <Image
              source={{ uri: certificateImageUrl }}
              style={styles.fullModalImage}
              resizeMode="contain" // ✅ کیفیت اصلی، بدون کراپ
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ---------- استایل‌ها ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginBottom: ms(30),
    marginTop: ms(40),
  },
  editButton: {
    position: "absolute",
    left: ms(-10),
    top: 0,
    padding: ms(8),
    zIndex: 10,
  },
  avatarWrapper: {
    width: ms(110),
    height: ms(110),
    borderRadius: ms(55),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: ms(12),
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
  name: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.white,
    marginBottom: ms(4),
  },
  username: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white,
    marginBottom: ms(4),
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
  section: {
    marginBottom: ms(8),
    flex: 1,
  },
  sectionTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.primary,
    textAlign: "right",
    marginBottom: ms(15),
  },
  card: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(16),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
  },
  descCard: {
    minHeight: ms(90),
    justifyContent: "flex-start",
  },
  cardText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
    textAlign: "right",
    lineHeight: ms(18),
  },
  placeholderText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text2,
    textAlign: "right",
    lineHeight: ms(18),
  },
  specialtyRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: ms(4),
  },
  bullet: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: COLORS.primary,
    marginLeft: ms(8),
  },
  contactsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    marginTop: ms(10),
    marginRight: ms(15),
  },
  contactBtn: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: ms(12),
  },

  // 🔥 استایل‌های مدرک

  certificateCard: {
    height: ms(70), // 🔥 ارتفاع ثابت (هم با متن خالی، هم با عکس)
    justifyContent: "center",
  },

  certificateThumbWrapper: {
    width: "100%",
    height: "100%", // کل ارتفاع کارت رو می‌گیره
    borderRadius: ms(12),
    overflow: "hidden",
    alignSelf: "flex-end", // راست‌چین داخل کارت
  },

  certificateThumb: {
    width: "100%",
    height: "100%",
  },

  certificateOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: ms(5),
    paddingHorizontal: ms(10),
    flexDirection: "row-reverse",
    alignItems: "center",
  },

  certificateOverlayText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.white,
  },

  // مودال فول‌اسکرین
  fullModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  fullModalContent: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fullModalImage: {
    width: "90%",
    height: "80%",
  },
  fullModalClose: {
    position: "absolute",
    top: ms(40),
    left: ms(24),
    zIndex: 10,
    padding: ms(8),
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  contactBtnDisabled: {
    opacity: 0.4,
  },
  ratingAndButtonRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: ms(10),
  },
  ratingNumber: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.primary,
    marginRight: ms(6),
  },
  reviewsButton: {
    backgroundColor: "#444",
    paddingVertical: ms(6),
    paddingHorizontal: ms(10),
    transform: [{ translateY: ms(-33) }],
    borderRadius: ms(20),
    flexDirection: "row-reverse",
    alignItems: "center",
    marginRight: ms(12),
  },
  reviewsButtonText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.white,
  },
  starsUnderEdit: {
    position: "absolute",
    left: ms(-15),
    top: ms(43),
    flexDirection: "row-reverse",
    alignItems: "center",
  },
});
