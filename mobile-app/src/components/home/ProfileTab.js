// src/components/home/ProfileTab.js
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
  TextInput,
  Dimensions,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import { useProfileStore } from "../../store/profileStore";
import { useNavigation } from "@react-navigation/native";
import RatingStars from "../ui/RatingStars";
import TelegramIcon from "../ui/Telegramicon";
import TamasIcon from "../ui/Tamas";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import InstaIcon from "../ui/Instaicon";
import {
  getMyTrainerProfile,
  getTrainerRatingSummary,
} from "../../../api/trainer.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PAGE_WIDTH = SCREEN_WIDTH; // عرض هر صفحه اسکرول
const CARD_WIDTH = SCREEN_WIDTH - ms(32); // عرض خود کارت با حاشیه دو طرف

// ثابت‌ها برای کارت اشتراک و هلال
const CARD_HEIGHT = ms(130);
const CIRCLE_SIZE = CARD_HEIGHT * 2; // دایره بزرگ برای ساخت هلال
const INFO_MARGIN_LEFT = CARD_HEIGHT * 0.55; // فاصله شروع متن از سمت چپ بعد از هلال

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// ✅ تبدیل اعداد انگلیسی به فارسی
const toPersianDigits = (str) => {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/\d/g, (d) => map[Number(d)]);
};

// ✅ فرمت مبلغ: فقط رقم، سه‌رقم سه‌رقم با ویرگول، و اعداد فارسی
const formatPrice = (value) => {
  if (!value) return "۰";
  const numeric = String(value).replace(/[^\d]/g, "");
  if (!numeric) return "۰";
  const withCommas = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return toPersianDigits(withCommas);
};

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

  const rating = typeof profile?.rating === "number" ? profile.rating : 0;
  const ratingCount = profile?.ratingCount ?? 0;
  const trainerUserId = profile?.trainerUserId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigation = useNavigation();
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);

  // ---------- اشتراک‌ها / اسلایدر ----------
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const subScrollRef = useRef(null);

  // فرم ساخت اشتراک
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [subName, setSubName] = useState("");
  const [subDurationCount, setSubDurationCount] = useState(null);
  const [subPrice, setSubPrice] = useState("");
  const [subDescription, setSubDescription] = useState("");

  // مودال انتخاب تعداد ماه
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyTrainerProfile();
        const ratingAPI = await getTrainerRatingSummary(data.userId);

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
          trainerUserId: data.userId,
          rating:
            typeof ratingAPI.avgRating === "number" ? ratingAPI.avgRating : 3.5,
          ratingCount: ratingAPI.reviewCount ?? 0,
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

  // حیطه تخصصی
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
    navigation.navigate("ProfileEdit");
  };

  // وقتی لیست اشتراک تغییر کند → روی آخرین اشتراک اسکرول می‌کنیم
  useEffect(() => {
    if (!subScrollRef.current) return;

    if (subscriptions.length === 0) {
      subScrollRef.current.scrollTo({ x: 0, animated: false });
      setActiveSubIndex(0);
    } else {
      const targetIndex = subscriptions.length - 1;
      subScrollRef.current.scrollTo({
        x: targetIndex * SCREEN_WIDTH,
        animated: true,
      });
      setActiveSubIndex(targetIndex);
    }
  }, [subscriptions.length]);

  const handleSubScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / PAGE_WIDTH); // ✅ تقسیم بر عرض صفحه
    if (index !== activeSubIndex) {
      setActiveSubIndex(index);
    }
  };

  const handleAddSubscription = () => {
    const trimmedName = subName.trim();
    const trimmedPrice = subPrice.trim();
    const trimmedDesc = subDescription.trim();

    const newSub = {
      id: Date.now().toString(),
      name: trimmedName || "اشتراک جدید",
      durationLabel: subDurationCount ? `${subDurationCount} ماه` : "مدت زمان",
      priceText: trimmedPrice || "0",
      descriptionShort: trimmedDesc || "توضیحات بیشتر",
    };

    setSubscriptions((prev) => [...prev, newSub]);

    setSubName("");
    setSubDurationCount(null);
    setSubPrice("");
    setSubDescription("");

    setSubscriptionModalVisible(false);
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

  const pagesCount = subscriptions.length + 1; // اشتراک‌ها + صفحه ساخت

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* هدر بالا */}
      <View style={styles.header}>
        <Pressable
          style={styles.editButton}
          onPress={handleEditPress}
          hitSlop={8}
        >
          <Feather name="edit-2" size={ms(18)} color={COLORS.white} />
        </Pressable>

        <View style={styles.starsUnderEdit}>
          <Text style={styles.ratingNumber}>
            {rating ? rating.toFixed(1) : "0.0"}
          </Text>
          <RatingStars rating={rating} size={ms(16)} />
        </View>

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
        <View
          style={{
            flexDirection: "column",
            marginRight: ms(25),
            marginBottom: ms(23),
            gap: ms(8),
          }}
        >
          <Text style={styles.name}>{name || "نام ثبت نشده"}</Text>

          <Text style={styles.username}>
            {username ? `@${username}` : "@ID ثبت نشده"}
          </Text>

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
        <Pressable
          onPress={() =>
            navigation.navigate("ReviewsScreen", {
              rating,
              ratingCount,
              name,
              username,
              city,
              avatarUri,
              trainerId: trainerUserId,
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

      {/* مدرک مربیگری */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>مدرک مربیگری:</Text>
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

      {/* اشتراک ها */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>اشتراک ها:</Text>

        <View style={styles.subSectionCardWrapper}>
          <ScrollView
            ref={subScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleSubScroll}
            scrollEventThrottle={16}
          >
            {/* اشتراک‌ها */}
            {subscriptions.map((sub) => (
              <View key={sub.id} style={styles.subscriptionPage}>
                <View style={styles.subscriptionCard}>
                  {/* هلال خاکستری گوشه چپ بالا */}
                  <View style={styles.subscriptionCircle} />

                  {/* بلاک قیمت داخل هلال */}
                  <View style={styles.subscriptionPriceContainer}>
                    <Text style={styles.subscriptionPriceText}>
                      {formatPrice(sub.priceText) /* ✅ فرمت فارسی با ویرگول */}
                    </Text>
                    <Text style={styles.subscriptionPriceUnit}>تومان</Text>
                  </View>

                  {/* اطلاعات برنامه */}
                  <View style={styles.subscriptionInfoBlock}>
                    <Text style={styles.subscriptionName}>{sub.name}</Text>
                    <Text style={styles.subscriptionDuration}>
                      {sub.durationLabel}
                    </Text>
                    <View style={styles.subscriptionDivider} />
                    <Pressable hitSlop={6}>
                      <Text style={styles.subscriptionMore}>
                        {sub.descriptionShort}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {/* صفحه‌ی ساخت اشتراک – سمت راست‌ترین */}
            <View style={styles.subscriptionPage}>
              <Pressable
                style={styles.createSubscriptionCard}
                onPress={() => setSubscriptionModalVisible(true)}
              >
                <View style={styles.createPlusCircle}>
                  <AntDesign name="plus" size={ms(22)} color={COLORS.primary} />
                </View>
              </Pressable>
            </View>
          </ScrollView>

          {/* دایره‌های اسلایدر */}
          <View style={styles.subDotsRow}>
            {Array.from({ length: pagesCount }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.subDot,
                  idx === activeSubIndex && styles.subDotActive,
                ]}
              />
            ))}
          </View>
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

      {/* مودال ساخت اشتراک */}
      <Modal
        visible={subscriptionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSubscriptionModalVisible(false)}
      >
        <Pressable
          style={styles.fullModalBackdrop}
          onPress={() => setSubscriptionModalVisible(false)}
        />
        <View style={styles.subModalContent}>
          <View style={styles.subModalCard}>
            <View style={styles.subModalHeader}>
              <Text style={styles.subModalHeaderText}>ساخت اشتراک:</Text>
            </View>

            <View style={styles.subModalBody}>
              {/* نام اشتراک - لیبل داخل فیلد */}
              <View style={styles.subField}>
                <TextInput
                  style={styles.subInput}
                  placeholder="نام اشتراک:"
                  placeholderTextColor={COLORS.text2}
                  value={subName}
                  onChangeText={setSubName}
                  textAlign="right"
                />
              </View>

              {/* مدت زمان - فیلد پِل */}
              <View style={styles.subField}>
                <Pressable
                  style={[styles.subInput, styles.subDurationField]}
                  onPress={() => setMonthPickerVisible(true)}
                >
                  <Text style={styles.subDurationLabel}>مدت زمان:</Text>
                  <View style={styles.subDurationRightSide}>
                    <View style={styles.subDurationUnitBox}>
                      <Text style={styles.subDurationUnitText}>ماه</Text>
                      <AntDesign
                        name="down"
                        size={ms(10)}
                        color={COLORS.text}
                        style={{ marginRight: ms(4) }}
                      />
                    </View>
                    <Text
                      style={[
                        styles.subDurationValueText,
                        !subDurationCount && { color: COLORS.text2 },
                      ]}
                    >
                      {subDurationCount ?? "..."}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* قیمت */}
              <View style={styles.subField}>
                <TextInput
                  style={styles.subInput}
                  placeholder="قیمت:"
                  placeholderTextColor={COLORS.text2}
                  keyboardType="numeric"
                  value={subPrice}
                  onChangeText={setSubPrice}
                  textAlign="right"
                />
              </View>

              {/* توضیحات بیشتر */}
              <View style={styles.subField}>
                <TextInput
                  style={[styles.subInput, styles.subInputMultiline]}
                  placeholder="توضیحات بیشتر:"
                  placeholderTextColor={COLORS.text2}
                  multiline
                  numberOfLines={3}
                  value={subDescription}
                  onChangeText={setSubDescription}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                style={styles.subSubmitButton}
                onPress={handleAddSubscription}
              >
                <Text style={styles.subSubmitButtonText}>افزودن</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال انتخاب تعداد ماه */}
      <Modal
        visible={monthPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <Pressable
          style={styles.fullModalBackdrop}
          onPress={() => setMonthPickerVisible(false)}
        />
        <View style={styles.monthPickerContent}>
          <View style={styles.monthPickerCard}>
            <Text style={styles.monthPickerTitle}>انتخاب مدت (ماه)</Text>
            <View style={styles.monthPickerGrid}>
              {MONTH_OPTIONS.map((m) => (
                <Pressable
                  key={m}
                  style={[
                    styles.monthPickerItem,
                    subDurationCount === m && styles.monthPickerItemActive,
                  ]}
                  onPress={() => {
                    setSubDurationCount(m);
                    setMonthPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthPickerItemText,
                      subDurationCount === m &&
                        styles.monthPickerItemTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال مدرک مربیگری */}
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
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: ms(32),
  },

  header: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginBottom: ms(30),
    marginTop: ms(30),
  },
  editButton: {
    position: "absolute",
    left: ms(-6),
    top: ms(-20),
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
    marginLeft: ms(20),
  },
  username: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white,
    marginBottom: ms(4),
    marginLeft: ms(20),
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
    marginBottom: ms(12),
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
  contactBtnDisabled: {
    opacity: 0.4,
  },

  certificateCard: {
    height: ms(70),
    justifyContent: "center",
  },
  certificateThumbWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: ms(12),
    overflow: "hidden",
    alignSelf: "flex-end",
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
    left: ms(-1),
    top: ms(33),
    flexDirection: "row-reverse",
    alignItems: "center",
  },

  // ---------- اشتراک‌ها / اسلایدر ----------
  subSectionCardWrapper: {
    backgroundColor: "transparent",
    alignItems: "center",
  },

  subscriptionPage: {
    width: PAGE_WIDTH, // ✅ کل عرض گوشی
    alignItems: "center",
  },

  createSubscriptionCard: {
    width: CARD_WIDTH, // ✅ خود کارت کوچک‌تر از صفحه
    height: CARD_HEIGHT,
    borderRadius: ms(24),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
  },

  subscriptionCard: {
    width: CARD_WIDTH, // ✅ خود کارت کوچک‌تر از صفحه
    height: CARD_HEIGHT,
    borderRadius: ms(24),
    backgroundColor: COLORS.lighgreen,
    overflow: "hidden",
    justifyContent: "center",
  },
  subscriptionCircle: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: COLORS.inputBg2,
    left: -CIRCLE_SIZE / 2,
    top: -CIRCLE_SIZE / 2,
  },
  subscriptionPriceContainer: {
    position: "absolute",
    left: ms(20),
    bottom: ms(20),
    alignItems: "flex-start",
  },
  subscriptionPriceText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.text3,
    transform: [{ translateY: ms(-15) }],
  },
  subscriptionPriceUnit: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text3,
    transform: [{ translateY: ms(-12) }, { translateX: ms(40) }],
    marginTop: ms(4),
  },
  subscriptionInfoBlock: {
    marginLeft: INFO_MARGIN_LEFT,
    paddingRight: ms(18),
    paddingVertical: ms(14),
    justifyContent: "space-between",
  },
  subscriptionName: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.text3,
    textAlign: "right",
  },
  subscriptionDuration: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text3,
    textAlign: "right",
    marginTop: ms(4),
  },
  subscriptionDivider: {
    width: "70%",
    transform: [{ translateX: ms(60) }, { translateY: ms(-10) }],
    height: ms(1),
    backgroundColor: COLORS.text3,
    marginTop: ms(12),
    marginBottom: ms(8),
  },
  subscriptionMore: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text3,
    textAlign: "right",
  },

  subDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: ms(10),
  },
  subDot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(3.5),
    backgroundColor: COLORS.primary,
    opacity: 0.3,
    marginHorizontal: ms(3),
  },
  subDotActive: {
    opacity: 1,
  },

  // ---------- مودال ساخت اشتراک ----------
  subModalContent: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  subModalCard: {
    width: "88%",
    height: "70%",
    borderRadius: ms(10),
    backgroundColor: COLORS.inputBg2,
    overflow: "hidden",
  },
  subModalHeader: {
    height: ms(100),
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: ms(10),
    borderBottomRightRadius: ms(130),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ms(20),
  },
  subModalHeaderText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(20),
    color: COLORS.white2,
  },
  subModalBody: {
    paddingHorizontal: ms(20),
    paddingVertical: ms(16),
  },
  subField: {
    marginBottom: ms(10),
  },
  subInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: ms(10),
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
    marginBottom: ms(13),
    textAlign: "right",
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text3,
  },
  subInputMultiline: {
    minHeight: ms(70),
    textAlignVertical: "top",
  },

  subDurationField: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subDurationLabel: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
    marginLeft: ms(10),
  },
  subDurationRightSide: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  subDurationUnitBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(999),
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    marginLeft: ms(8),
  },
  subDurationUnitText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.text,
    marginLeft: ms(4),
  },
  subDurationValueText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
  },

  subSubmitButton: {
    marginTop: ms(18),
    marginBottom: ms(4),
    backgroundColor: COLORS.primary,
    borderRadius: ms(24),
    paddingVertical: ms(18),
    transform: [{ translateX: ms(14) }],
    width: "90%",
    alignItems: "center",
  },
  subSubmitButtonText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.white2,
  },

  // ---------- مودال انتخاب ماه ----------
  monthPickerContent: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  monthPickerCard: {
    width: "70%",
    borderRadius: ms(18),
    backgroundColor: COLORS.inputBg2,
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
  },
  monthPickerTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.text,
    textAlign: "center",
    marginBottom: ms(10),
  },
  monthPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthPickerItem: {
    width: "22%",
    marginBottom: ms(8),
    borderRadius: ms(10),
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: ms(6),
  },
  monthPickerItemActive: {
    backgroundColor: COLORS.primary,
  },
  monthPickerItemText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
  },
  monthPickerItemTextActive: {
    color: COLORS.white,
  },
});
