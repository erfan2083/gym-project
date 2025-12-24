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
  Alert,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors.js";
import { useNavigation, useRoute } from "@react-navigation/native";
import RatingStars from "../ui/RatingStars.js";
import TelegramIcon from "../ui/Telegramicon.js";
import TamasIcon from "../ui/Tamas.js";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import InstaIcon from "../ui/Instaicon.js";

import {
  getTrainerPlans,
  getTrainerRatingSummary,
  getTrainerProfileById,
} from "../../../api/trainer.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - ms(60);

// ثابت‌ها برای کارت اشتراک و هلال
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

export default function TrainerPublicProfile({
  trainerId: pTrainerId,
  trainerData: pTrainerData,
  onBack,
  withinHomeShell,
}) {
  const route = useRoute();
  const navigation = useNavigation();

  const { trainerId: rTrainerId, trainerData: rTrainerData } =
    route.params || {};
  const trainerId = pTrainerId ?? rTrainerId;
  const trainerData = pTrainerData ?? rTrainerData;

  // embedded واقعی (داخل HomeScreen) یعنی onBack داریم
  const isEmbedded = !!onBack;

  // اگر صفحه اشتباهاً مستقل باز شد، همان لحظه به HomeScreen ریدایرکت کن تا bottom bar فعال باشد
  useEffect(() => {
    if (!isEmbedded && trainerId) {
      try {
        navigation.replace("Home", {
          initialTab: "home",
          openTrainerPublic: { trainerId, trainerData },
          backTo: "main",
        });
      } catch (e) {
        // اگر replace در این navigator نبود، حداقل کرش نکند
        try {
          navigation.navigate("HomeScreen", {
            initialTab: "home",
            openTrainerPublic: { trainerId, trainerData },
            backTo: "main",
          });
        } catch (_) {}
      }
    }
  }, [isEmbedded, trainerId]);

  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);

  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const openBuyModal = (plan) => {
    if (!plan) return;
    setSelectedPlan(plan);
    setBuyModalVisible(true);
  };

  const closeBuyModal = () => {
    setBuyModalVisible(false);
    setSelectedPlan(null);
  };

  const handleBuyPress = () => {
    if (!selectedPlan) return;

    Alert.alert(
      "تایید خرید",
      "آیا از خرید این اشتراک مطمئن هستید؟",
      [
        { text: "لغو", style: "cancel" },
        {
          text: "تایید",
          style: "default",
          onPress: () => {
            Alert.alert("موفق", "خرید با موفقیت انجام شد");
            closeBuyModal();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const subScrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        if (!trainerId) throw new Error("شناسه مربی یافت نشد.");

        const [profileData, ratingData, plansData] = await Promise.all([
          getTrainerProfileById(trainerId).catch(() => null),
          getTrainerRatingSummary(trainerId).catch(() => ({
            avgRating: 0,
            reviewCount: 0,
          })),
          getTrainerPlans(trainerId).catch(() => []),
        ]);

        if (!isMounted) return;

        const baseData = profileData || trainerData || {};

        const mappedProfile = {
          username: baseData.username,
          name: baseData.fullName || baseData.name || "نام مربی",
          city: baseData.city || "",
          avatarUri: baseData.avatarUrl || baseData.avatarUri || null,
          specialties: Array.isArray(baseData.specialties)
            ? baseData.specialties
            : [],
          description: baseData.bio || baseData.description || "",
          phone: baseData.contactPhone || "",
          instagram: baseData.instagramUrl || "",
          telegram: baseData.telegramUrl || "",
          certificateImageUrl: baseData.certificateImageUrl || null,
          userId: trainerId,
          rating:
            typeof ratingData?.avgRating === "number"
              ? ratingData.avgRating
              : Number(baseData.rating) || 0,
          ratingCount: ratingData?.reviewCount ?? 0,
        };

        setProfile(mappedProfile);

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

  const clampSubIndex = (i) =>
    Math.max(0, Math.min(i, Math.max(0, subscriptions.length - 1)));

  const scrollToSubIndex = (i, animated = true) => {
    if (!subscriptions.length) return;
    const idx = clampSubIndex(i);
    requestAnimationFrame(() => {
      subScrollRef.current?.scrollTo({ x: idx * CARD_WIDTH, y: 0, animated });
    });
  };

  const handleSubMomentumEnd = (event) => {
    const x = event.nativeEvent.contentOffset.x || 0;
    const idx = clampSubIndex(Math.round(x / CARD_WIDTH));
    if (idx !== activeSubIndex) setActiveSubIndex(idx);
  };

  const handleDotPress = (idx) => {
    const target = clampSubIndex(idx);
    setActiveSubIndex(target);
    scrollToSubIndex(target, true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error && !profile?.name) {
    return (
      <View style={styles.center}>
        <Text
          style={{ color: COLORS.danger, fontFamily: "Vazirmatn_400Regular" }}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isEmbedded && styles.contentContainerEmbedded,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (onBack ? onBack() : navigation.goBack())}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={ms(18)} color={COLORS.white} />
        </Pressable>

        <View style={styles.starsUnderBack}>
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

        <View style={styles.headerTextCol}>
          <Text style={styles.name}>{name || "نام ثبت نشده"}</Text>

          {!!username ? (
            <Text style={styles.username}>{`@${username}`}</Text>
          ) : null}

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
              trainerId,
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
          <Text style={styles.reviewsButtonText}>نظرات ({ratingCount})</Text>
          <AntDesign
            name="arrowleft"
            size={ms(18)}
            color={COLORS.white}
            style={{ marginLeft: ms(6) }}
          />
        </Pressable>
      </View>

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

      {certificateImageUrl ? (
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
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>توضیحات و سوابق:</Text>
        <View style={[styles.card, styles.descCard]}>
          {description ? (
            <Text style={styles.cardText}>{description}</Text>
          ) : (
            <Text style={styles.placeholderText}>توضیحاتی ثبت نشده است.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>پلن‌ها و اشتراک‌ها:</Text>

        {subscriptions.length > 0 ? (
          <View style={styles.subSectionCardWrapper}>
            <View style={styles.subPagerViewport}>
              <ScrollView
                ref={subScrollRef}
                horizontal
                pagingEnabled
                snapToInterval={CARD_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum
                bounces={false}
                alwaysBounceHorizontal={false}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleSubMomentumEnd}
                scrollEventThrottle={16}
                contentOffset={{ x: activeSubIndex * CARD_WIDTH, y: 0 }}
              >
                {subscriptions.map((sub) => (
                  <View key={sub.id} style={styles.subPagerPage}>
                    <Pressable
                      style={styles.subscriptionCard}
                      onPress={() => openBuyModal(sub)}
                      hitSlop={8}
                    >
                      <View style={styles.subscriptionCircle} />

                      <View style={styles.subscriptionPriceContainer}>
                        <Text style={styles.subscriptionPriceText}>
                          {formatPrice(sub.priceText)}
                        </Text>
                        <Text style={styles.subscriptionPriceUnit}>تومان</Text>
                      </View>

                      <View style={styles.subscriptionInfoBlock}>
                        <Text style={styles.subscriptionName}>{sub.name}</Text>
                        <Text style={styles.subscriptionDuration}>
                          {sub.durationLabel}
                        </Text>
                        <View style={styles.subscriptionDivider} />
                        <Text style={styles.subscriptionMore} numberOfLines={2}>
                          {sub.descriptionShort}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.subDotsRow}>
              {subscriptions.map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleDotPress(idx)}
                  hitSlop={10}
                >
                  <View
                    style={[
                      styles.subDot,
                      idx === activeSubIndex && styles.subDotActive,
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.placeholderText}>
              این مربی هنوز پلنی تعریف نکرده است.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { marginTop: ms(20) }]}>
        <Text style={styles.sectionTitle}>راه های ارتباطی:</Text>
        <View style={styles.contactsRow}>
          <Pressable
            onPress={handleTelegram}
            disabled={!hasTelegram}
            style={[
              styles.contactBtn,
              !hasTelegram && styles.contactBtnDisabled,
            ]}
          >
            <TelegramIcon size={50} />
          </Pressable>

          <Pressable
            onPress={handlePhone}
            disabled={!hasPhone}
            style={[styles.contactBtn, !hasPhone && styles.contactBtnDisabled]}
          >
            <TamasIcon size={45} />
          </Pressable>

          <Pressable
            onPress={handleInstagram}
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

      <Modal
        visible={buyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBuyModal}
      >
        <Pressable style={styles.fullModalBackdrop} onPress={closeBuyModal} />

        <View style={styles.buyModalContent}>
          <View style={styles.buyModalCard}>
            <View style={styles.buyModalHeader}>
              <Text style={styles.buyModalHeaderText}>
                {selectedPlan?.name || "اشتراک"}
              </Text>
            </View>

            <View style={styles.buyModalBody}>
              <View style={styles.buyRow}>
                <Text style={styles.buyLabel}>مدت زمان :</Text>
                <Text style={styles.buyValue}>
                  {selectedPlan?.durationLabel || "—"}
                </Text>
              </View>

              <View style={styles.buyRow}>
                <Text style={styles.buyLabel}>قیمت :</Text>
                <Text style={styles.buyValue}>
                  {formatPrice(selectedPlan?.priceText)} تومان
                </Text>
              </View>

              <View style={styles.buyRow}>
                <Text style={styles.buyLabel}>توضیحات :</Text>
                <Text style={styles.buyValue} numberOfLines={3}>
                  {selectedPlan?.descriptionShort || "توضیحات بیشتر"}
                </Text>
              </View>

              <Pressable
                style={styles.buyBtn}
                onPress={handleBuyPress}
                hitSlop={8}
              >
                <Text style={styles.buyBtnText}>خرید</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  contentContainer: {
    paddingBottom: ms(50),
    paddingHorizontal: ms(30),
    paddingTop: ms(12),
  },
  contentContainerEmbedded: {
    paddingHorizontal: 0,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },

  header: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginBottom: ms(30),
    marginTop: ms(50),
  },
  backButton: {
    position: "absolute",
    left: ms(-6),
    top: ms(-20),
    padding: ms(8),
    zIndex: 10,
  },
  starsUnderBack: {
    position: "absolute",
    left: ms(-1),
    top: ms(33),
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  ratingNumber: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.primary,
    marginRight: ms(6),
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
  avatarImage: { width: "100%", height: "100%", borderRadius: ms(55) },
  headerTextCol: {
    flex: 1,
    flexDirection: "column",
    marginRight: ms(25),
    marginBottom: ms(23),
    gap: ms(8),
  },
  name: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.white,
    marginBottom: ms(4),
    marginLeft: ms(20),
    textAlign: "right",
  },
  username: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white,
    marginBottom: ms(4),
    marginLeft: ms(20),
    textAlign: "right",
  },
  locationRow: { flexDirection: "row-reverse", alignItems: "center" },
  locationText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white,
  },

  ratingAndButtonRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: ms(10),
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

  section: { marginBottom: ms(12) },
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
  descCard: { minHeight: ms(90), justifyContent: "flex-start" },
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

  certificateCard: {
    height: ms(70),
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  certificateThumbWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: ms(12),
    overflow: "hidden",
    alignSelf: "flex-end",
  },
  certificateThumb: { width: "100%", height: "100%" },
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

  subSectionCardWrapper: {
    backgroundColor: "transparent",
    alignItems: "center",
  },
  subPagerViewport: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: ms(24),
    overflow: "hidden",
    alignSelf: "center",
  },
  subPagerPage: { width: CARD_WIDTH, height: CARD_HEIGHT },
  subscriptionCard: {
    width: CARD_WIDTH,
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
    backgroundColor: "transparent",
    borderWidth: ms(1.2),
    borderColor: COLORS.lighgreen,
    marginHorizontal: ms(3),
  },
  subDotActive: { backgroundColor: COLORS.lighgreen },

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
  contactBtnDisabled: { opacity: 0.4 },

  fullModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  fullModalContent: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fullModalImage: { width: "90%", height: "80%" },
  fullModalClose: {
    position: "absolute",
    top: ms(40),
    left: ms(24),
    zIndex: 10,
    padding: ms(8),
  },

  buyModalContent: {
    position: "absolute",
    top: ms(200),
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  buyModalCard: {
    width: "86%",
    height: ms(350),
    borderRadius: ms(14),
    backgroundColor: COLORS.inputBg2,
    overflow: "hidden",
  },
  buyModalHeader: {
    height: ms(80),
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: ms(14),
    borderBottomRightRadius: ms(120),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ms(18),
  },
  buyModalHeaderText: {
    marginTop: ms(14),
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(26),
    color: COLORS.white2,
    textAlign: "center",
  },
  buyModalBody: {
    paddingHorizontal: ms(18),
    paddingVertical: ms(16),
    gap: ms(26),
  },
  buyRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ms(12),
  },
  buyLabel: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.text,
    textAlign: "right",
  },
  buyValue: {
    flex: 1,
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(16),
    color: COLORS.text,
    textAlign: "right",
    lineHeight: ms(18),
  },
  buyBtn: {
    marginTop: ms(18),
    marginBottom: ms(4),
    backgroundColor: COLORS.primary,
    borderRadius: ms(24),
    paddingVertical: ms(12),
    transform: [{ translateX: ms(14) }],
    width: "90%",
    alignItems: "center",
  },
  buyBtnText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(18),
    color: COLORS.formTitle,
  },
});
