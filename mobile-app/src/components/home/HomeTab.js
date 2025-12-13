// src/components/home/HomeTab.js
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from "react-native";
import { ms } from "react-native-size-matters";
import { COLORS } from "../../theme/colors";
import { useProfileStore } from "../../store/profileStore";
import TopTrainerCard from "../ui/TopTrainerCard"; //

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import HomeDumbbell from "../ui/HomeDumbbell";
import Yogaicon from "../ui/Yogaicon";

// ایمپورت API
import { getTopTrainers } from "../../../api/trainer"; //

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SIDE_PADDING = ms(30);
const CONTENT_WIDTH = SCREEN_WIDTH - SIDE_PADDING * 2;

const HERO_CARD_WIDTH = CONTENT_WIDTH;
const HERO_CARD_HEIGHT = ms(112);
const TRAINER_GAP = ms(10);
const TRAINER_CARD_WIDTH = (CONTENT_WIDTH - TRAINER_GAP * 2) / 3;

// اسلایدهای بالای صفحه
const HERO_SLIDES = [
  {
    id: "s1",
    title: "شروع سلامتی",
    subtitle: "از یک برنامه تمرینی اصولی",
    image: require("../../../assets/icons/image4.png"),
  },
  {
    id: "s2",
    title: "برنامه غذایی",
    subtitle: "متناسب با هدف شما",
    image: require("../../../assets/icons/image4.png"),
  },
  {
    id: "s3",
    title: "بهترین مربی‌ها",
    subtitle: "همراه شما تا نتیجه",
    image: require("../../../assets/icons/image4.png"),
  },
];

// داده فال‌بک (اگر اینترنت نبود یا لیست خالی بود)
const TOP_TRAINERS_FALLBACK = [
  { id: "t1", name: "نام مربی", rating: 4.5, city: "تهران" },
  { id: "t2", name: "نام مربی", rating: 4.0, city: "شیراز" },
  { id: "t3", name: "نام مربی", rating: 5.0, city: "مشهد" },
];

// دسته‌بندی‌ها
const CATEGORIES = [
  { id: "c0", title: "", icon: null },
  { id: "c00", title: "", icon: null },
  {
    id: "c1",
    title: "بدنسازی",
    icon: () => <HomeDumbbell size={38} />,
  },
  {
    id: "c2",
    title: "یوگا",
    icon: () => <Yogaicon size={45} />,
  },
  {
    id: "c3",
    title: "فیتنس",
    icon: (size) => (
      <MaterialCommunityIcons
        name="heart-pulse"
        size={size}
        color={COLORS.lighgreen}
      />
    ),
  },
];

export default function HomeTab({
  onPressProfile,
  onPressAllTrainers,
  onPressAllCategories,
  onPressTrainer,
}) {
  const profile = useProfileStore((state) => state.profile);

  const displayName = useMemo(() => {
    const n = profile?.name || profile?.username || "";
    return n.trim() || "نام کاربر";
  }, [profile?.name, profile?.username]);

  // ---------------------------
  // Search
  // ---------------------------
  const [query, setQuery] = useState("");

  // ---------------------------
  // Top Trainers Data
  // ---------------------------
  const [topTrainers, setTopTrainers] = useState([]);
  const [topLoading, setTopLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setTopLoading(true);
        // فراخوانی API
        const list = await getTopTrainers(3);

        if (!mounted) return;

        // اگر API دیتا داد، آن را ست می‌کنیم
        if (Array.isArray(list) && list.length > 0) {
          // اینجا یک نگاشت (Map) انجام می‌دهیم تا اگر بک‌اند full_name داد
          // و کامپوننت name می‌خواست، مشکلی پیش نیاید.
          const normalized = list.map((item) => ({
            id: item.id,
            // بک‌اند full_name می‌دهد، کامپوننت name می‌خواهد
            name: item.name || item.full_name || item.username || "مربی",
            // بک‌اند avatar_url می‌دهد، کامپوننت avatarUrl می‌خواهد
            avatarUrl: item.avatarUrl || item.avatar_url || null,
            city: item.city || "نامشخص",
            rating: Number(item.rating) || 0,
          }));
          setTopTrainers(normalized);
        } else {
          // اگر لیست خالی بود، آرایه خالی ست کن (تا فال‌بک نمایش داده شود)
          setTopTrainers([]);
        }
      } catch (e) {
        console.log("getTopTrainers error:", e?.message || e);
        if (mounted) setTopTrainers([]);
      } finally {
        if (mounted) setTopLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // اگر دیتا هنوز لود نشده یا خالی است، از دیتای پیش‌فرض استفاده کن تا UI زشت نشود
  const trainersToShow = useMemo(() => {
    if (topLoading) return TOP_TRAINERS_FALLBACK;
    if (topTrainers && topTrainers.length > 0) return topTrainers;
    return TOP_TRAINERS_FALLBACK;
  }, [topLoading, topTrainers]);

  // ---------------------------
  // Hero Carousel Logic (Swipe + Snap) - دست نخورده
  // ---------------------------
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [mainScrollEnabled, setMainScrollEnabled] = useState(true);

  const dragX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeHeroIndex;
  }, [activeHeroIndex]);

  const maxIndex = HERO_SLIDES.length - 1;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const lockMainScroll = () => setMainScrollEnabled(false);
  const unlockMainScroll = () => setMainScrollEnabled(true);

  const animateDragTo = (toValue, duration = 180) =>
    new Promise((resolve) => {
      Animated.timing(dragX, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start(() => resolve());
    });

  const snapToIndex = async (nextIndex) => {
    if (isAnimatingRef.current) return;
    const target = clamp(nextIndex, 0, maxIndex);
    if (target === activeIndexRef.current) {
      dragX.setValue(0);
      return;
    }
    isAnimatingRef.current = true;
    const diff = target - activeIndexRef.current;
    if (Math.abs(diff) === 1) {
      const dir = diff > 0 ? -1 : 1;
      await animateDragTo(dir * HERO_CARD_WIDTH, 170);
      setActiveHeroIndex(target);
      activeIndexRef.current = target;
      dragX.setValue(0);
      isAnimatingRef.current = false;
      return;
    }
    setActiveHeroIndex(target);
    activeIndexRef.current = target;
    dragX.setValue(0);
    isAnimatingRef.current = false;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onMoveShouldSetPanResponderCapture: (_, g) => {
        const isHorizontal =
          Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy);
        if (isHorizontal) lockMainScroll();
        return isHorizontal;
      },
      onPanResponderGrant: () => {
        lockMainScroll();
        dragX.stopAnimation();
        dragX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        if (isAnimatingRef.current) return;
        let dx = g.dx;
        if (activeIndexRef.current === 0 && dx > 0) dx *= 0.25;
        if (activeIndexRef.current === maxIndex && dx < 0) dx *= 0.25;
        dx = clamp(dx, -HERO_CARD_WIDTH, HERO_CARD_WIDTH);
        dragX.setValue(dx);
      },
      onPanResponderRelease: async (_, g) => {
        unlockMainScroll();
        if (isAnimatingRef.current) return;
        const dx = g.dx;
        const vx = g.vx;
        const threshold = HERO_CARD_WIDTH * 0.32;
        const fling = 0.55;
        const canGoNext = activeIndexRef.current < maxIndex;
        const canGoPrev = activeIndexRef.current > 0;
        const goNext = (dx < -threshold || vx < -fling) && canGoNext;
        const goPrev = (dx > threshold || vx > fling) && canGoPrev;

        if (goNext) {
          isAnimatingRef.current = true;
          await animateDragTo(-HERO_CARD_WIDTH, 170);
          const next = activeIndexRef.current + 1;
          setActiveHeroIndex(next);
          activeIndexRef.current = next;
          dragX.setValue(0);
          isAnimatingRef.current = false;
          return;
        }
        if (goPrev) {
          isAnimatingRef.current = true;
          await animateDragTo(HERO_CARD_WIDTH, 170);
          const prev = activeIndexRef.current - 1;
          setActiveHeroIndex(prev);
          activeIndexRef.current = prev;
          dragX.setValue(0);
          isAnimatingRef.current = false;
          return;
        }
        isAnimatingRef.current = true;
        await animateDragTo(0, 160);
        dragX.setValue(0);
        isAnimatingRef.current = false;
      },
      onPanResponderTerminate: async () => {
        unlockMainScroll();
        dragX.stopAnimation();
        dragX.setValue(0);
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  const renderHeroSlide = (index) => {
    const slide = HERO_SLIDES[index];
    if (!slide) {
      return (
        <View style={{ width: HERO_CARD_WIDTH, height: HERO_CARD_HEIGHT }} />
      );
    }
    return (
      <View style={styles.heroCard}>
        <View style={styles.heroTextCol}>
          <Text style={styles.heroTitle}>{slide.title}</Text>
          <Text style={styles.heroSubtitle}>{slide.subtitle}</Text>
        </View>
        <View style={styles.heroIconCol}>
          {slide.image ? (
            <Image
              source={slide.image}
              style={styles.heroImage}
              resizeMode="contain"
            />
          ) : (
            <FontAwesome5
              name="dumbbell"
              size={ms(46)}
              color={COLORS.text}
              style={{ opacity: 0.9 }}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      scrollEnabled={mainScrollEnabled}
    >
      {/* ---------- هدر بالا ---------- */}
      <View style={styles.topHeaderRow}>
        <Pressable onPress={onPressProfile} hitSlop={8}>
          <View style={styles.userIconCircle}>
            <FontAwesome5
              name="user-alt"
              size={ms(16)}
              color={COLORS.primary}
            />
          </View>
        </Pressable>
        <Text style={styles.userName}>{displayName}</Text>
      </View>

      {/* ---------- Search ---------- */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={ms(18)}
          color={COLORS.text2}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="جستجو در فیتنس"
          placeholderTextColor={COLORS.text2}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* ---------- Hero Carousel ---------- */}
      <View style={styles.heroSection}>
        <View style={styles.heroViewport} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.heroTrack,
              { transform: [{ translateX: dragX }] },
            ]}
          >
            <View style={styles.heroSlide}>
              {renderHeroSlide(activeHeroIndex - 1)}
            </View>
            <View style={styles.heroSlide}>
              {renderHeroSlide(activeHeroIndex)}
            </View>
            <View style={styles.heroSlide}>
              {renderHeroSlide(activeHeroIndex + 1)}
            </View>
          </Animated.View>
        </View>

        <View style={styles.heroDotsRow}>
          {HERO_SLIDES.map((_, idx) => (
            <Pressable key={idx} onPress={() => snapToIndex(idx)} hitSlop={10}>
              <View
                style={[
                  styles.heroDot,
                  idx === activeHeroIndex && styles.heroDotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* ---------- بهترین مربی‌ها (Updated Section) ---------- */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderText}>بهترین مربی ها</Text>
        <View style={styles.sectionHeaderLine} />
      </View>

      <View style={styles.trainersRow}>
        {trainersToShow.map((t, index) => (
          <TopTrainerCard
            // اگر id نداشت از ایندکس استفاده کن تا ارور نده
            key={t?.id ? String(t.id) : `top-${index}`}
            t={t}
            onPress={(trainer) => {
              if (typeof onPressTrainer === "function") {
                onPressTrainer(trainer);
              } else {
                console.log("Trainer clicked:", trainer?.id);
              }
            }}
            // محاسبه عرض کارت برای اینکه دقیقاً 3 تا جا بشه
            style={{ width: TRAINER_CARD_WIDTH }}
          />
        ))}
      </View>

      <Pressable
        style={styles.seeAllBtn}
        onPress={onPressAllTrainers}
        hitSlop={8}
      >
        <Text style={styles.seeAllBtnText}>مشاهده تمام مربی ها</Text>
      </Pressable>

      {/* ---------- دسته بندی رشته های ورزشی ---------- */}
      <View style={[styles.sectionHeaderRow, { marginTop: ms(18) }]}>
        <Text style={styles.sectionHeaderText}>دسته بندی رشته های ورزشی</Text>
        <View style={styles.sectionHeaderLine} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {CATEGORIES.map((c) => (
          <Pressable key={c.id} style={styles.categoryCard} hitSlop={6}>
            <View style={styles.categoryIconWrap}>
              {typeof c.icon === "function" ? c.icon(ms(28)) : null}
            </View>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {c.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.seeAllBtn, { marginTop: ms(12) }]}
        onPress={onPressAllCategories}
        hitSlop={8}
      >
        <Text style={styles.seeAllBtnText}>مشاهده تمام رشته های ورزشی</Text>
      </Pressable>

      <View style={{ height: ms(12) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: ms(24) },

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
    fontSize: ms(12),
    color: COLORS.text,
    paddingVertical: 0,
  },

  heroSection: { marginVertical: ms(16), alignItems: "center" },
  heroViewport: {
    width: HERO_CARD_WIDTH,
    height: HERO_CARD_HEIGHT,
    borderRadius: ms(16),
    overflow: "hidden",
    alignSelf: "center",
  },
  heroTrack: {
    position: "absolute",
    top: 0,
    left: -HERO_CARD_WIDTH,
    width: HERO_CARD_WIDTH * 3,
    height: HERO_CARD_HEIGHT,
    flexDirection: "row",
  },
  heroSlide: { width: HERO_CARD_WIDTH, height: HERO_CARD_HEIGHT },
  heroCard: {
    width: HERO_CARD_WIDTH,
    height: HERO_CARD_HEIGHT,
    borderRadius: ms(16),
    backgroundColor: COLORS.white,
    paddingHorizontal: ms(16),
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTextCol: {
    flex: 1,
    alignItems: "flex-end",
    paddingLeft: ms(10),
  },
  heroTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.primary,
    textAlign: "right",
  },
  heroSubtitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
    textAlign: "right",
    marginTop: ms(4),
  },
  heroIconCol: {
    width: ms(92),
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  heroDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: ms(10),
  },
  heroDot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(3.5),
    backgroundColor: "transparent",
    borderWidth: ms(1.2),
    borderColor: COLORS.lighgreen,
    marginHorizontal: ms(3),
  },
  heroDotActive: { backgroundColor: COLORS.lighgreen },
  heroImage: {
    width: ms(97),
    height: ms(97),
    transform: [{ translateX: ms(15) }, { translateY: ms(-3) }],
  },

  sectionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: ms(10),
    marginBottom: ms(19),
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

  trainersRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  seeAllBtn: {
    alignSelf: "center",
    marginTop: ms(12),
    backgroundColor: COLORS.primary,
    borderRadius: ms(10),
    paddingHorizontal: ms(14),
    paddingVertical: ms(9),
  },
  seeAllBtnText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.white,
  },

  categoriesRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: ms(12),
    paddingVertical: ms(6),
  },
  categoryCard: {
    width: ms(74),
    height: ms(90),
    borderRadius: ms(12),
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: ms(6),
  },
  categoryIconWrap: {
    marginBottom: ms(10),
    height: ms(35),
    justifyContent: "center",
  },
  categoryTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(10),
    color: COLORS.text2,
    textAlign: "center",
  },
});