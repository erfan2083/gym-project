// src/components/home/CoachWorkoutsTab.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Alert,
  StyleSheet as RNStyleSheet,
} from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { COLORS } from "../../theme/colors";

/* ---------------- Mock Data (temporary) ---------------- */
const DEFAULT_EXERCISES = [
  { id: "d1", name: "نام حرکت", media: null },
  { id: "d2", name: "نام حرکت", media: null },
  { id: "d3", name: "نام حرکت", media: null },
];

// expo-image-picker (اگر موجود نبود کرش نکن)
const safeGetImagePicker = () => {
  try {
    // eslint-disable-next-line global-require
    return require("expo-image-picker");
  } catch {
    return null;
  }
};

export default function CoachWorkoutsTab() {
  const [activeTab, setActiveTab] = useState("default"); // default | my
  const [query, setQuery] = useState("");

  // تمرینات من (اول خالی)
  const [myExercises, setMyExercises] = useState([]);

  // =========================
  // Modal 1 (Group 287): افزودن به برنامه (sets/reps)
  // =========================
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addDraft, setAddDraft] = useState({
    id: null,
    name: "",
    media: null, // { uri, type, fileName }
    sets: "",
    reps: "",
  });

  // =========================
  // Modal 2 (Group 290): ساخت/انتخاب تمرین + آپلود مدیا
  // =========================
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createMedia, setCreateMedia] = useState(null); // { uri, type, fileName }

  const listToShow = useMemo(() => {
    const source = activeTab === "my" ? myExercises : DEFAULT_EXERCISES;
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return source;
    return source.filter((x) =>
      String(x?.name || "")
        .toLowerCase()
        .includes(q)
    );
  }, [activeTab, query, myExercises]);

  const normalizeDigits = (t) => String(t || "").replace(/[^\d]/g, "");

  // ✅ مودال‌ها فقط از دکمه افزودن بالا اجرا می‌شن
  const openHeaderAddFlow = () => {
    const draft = {
      id: `new-${Date.now()}`,
      name: "",
      media: null,
      sets: "",
      reps: "",
    };
    setAddDraft(draft);
    setAddModalVisible(true);
  };

  // ❗️افزودن روی کارت‌ها مربوط به مرحله بعدی است (اضافه به کاربر)
  // (فعلاً فقط پیام می‌دهیم تا مودال‌های این مرحله اشتباهی باز نشوند)
  const handleCardAddLater = () => {
    Alert.alert(
      "افزودن به کاربر",
      "این دکمه مربوط به مرحله بعدی است (اضافه کردن تمرین به کاربر)."
    );
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setAddDraft({ id: null, name: "", media: null, sets: "", reps: "" });
  };

  const openCreateModalFromAddModal = () => {
    setCreateName(addDraft?.name || "");
    setCreateDesc("");
    setCreateMedia(addDraft?.media || null);
    setCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
  };

  const pickMedia = async (kind) => {
    const ImagePicker = safeGetImagePicker();
    if (!ImagePicker) {
      Alert.alert(
        "آپلود فایل",
        "برای آپلود واقعی، پکیج expo-image-picker باید نصب باشد. فعلاً یک فایل نمونه ست می‌شود."
      );
      setCreateMedia({
        uri: "mock://file",
        type: kind === "video" ? "video" : "image",
        fileName: kind === "video" ? "video.mp4" : "image.jpg",
      });
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert("اجازه دسترسی", "دسترسی به گالری داده نشد.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          kind === "video"
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (result?.canceled) return;

      const asset = result?.assets?.[0];
      if (!asset?.uri) return;

      setCreateMedia({
        uri: asset.uri,
        type: kind === "video" ? "video" : "image",
        fileName:
          asset.fileName || (kind === "video" ? "video.mp4" : "image.jpg"),
      });
    } catch (e) {
      Alert.alert("خطا", "مشکل در انتخاب فایل");
      console.log("pickMedia error:", e?.message || e);
    }
  };

  // Modal2 Submit:
  // - برگشت به Modal1 و ست شدن نام/مدیا
  const submitCreate = () => {
    const name = String(createName || "").trim();
    if (!name) {
      Alert.alert("خطا", "نام تمرین را وارد کنید");
      return;
    }
    if (!createMedia?.uri) {
      Alert.alert("خطا", "لطفاً فیلم یا تصویر آموزشی را انتخاب کنید");
      return;
    }

    setAddDraft((p) => ({
      ...p,
      name,
      media: createMedia,
    }));

    closeCreateModal();
  };

  const submitAddToPlan = () => {
    const sets = Number(normalizeDigits(addDraft.sets));
    const reps = Number(normalizeDigits(addDraft.reps));
    const name = String(addDraft?.name || "").trim();

    if (!name) {
      Alert.alert("خطا", "نام حرکت را مشخص کنید");
      return;
    }
    if (!addDraft?.media?.uri) {
      Alert.alert("خطا", "ابتدا تصویر یا فیلم آموزشی را انتخاب کنید");
      return;
    }
    if (!Number.isFinite(sets) || sets <= 0) {
      Alert.alert("خطا", "تعداد ست را وارد کنید");
      return;
    }
    if (!Number.isFinite(reps) || reps <= 0) {
      Alert.alert("خطا", "تعداد تکرار را وارد کنید");
      return;
    }

    // اینجا بعداً به برنامه اضافه می‌کنی
    closeAddModal();
  };

  return (
    <View style={styles.container}>
      {/* ================= Header ================= */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.headerAddWrap}
          onPress={openHeaderAddFlow}
          hitSlop={10}
        >
          <Ionicons
            name="add-circle-outline"
            size={ms(22)}
            color={COLORS.primary}
          />
          <Text style={styles.headerAddText}>افزودن</Text>
        </Pressable>

        <View style={styles.headerLine} />
        <Text style={styles.headerTitle}>تمرینات</Text>
      </View>

      {/* ================= Search ================= */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={ms(18)}
          color={COLORS.text2}
          style={{ marginLeft: ms(8) }}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="جستجو در تمرینات"
          placeholderTextColor={COLORS.text2}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* ================= Tabs ================= */}
      <View style={styles.tabsRow}>
        <Pressable
          style={styles.tabBtn}
          onPress={() => setActiveTab("my")}
          hitSlop={10}
        >
          <Text
            style={[styles.tabText, activeTab === "my" && styles.tabTextActive]}
          >
            تمرینات من
          </Text>
          <View
            style={[
              styles.tabUnderline,
              activeTab === "my" && styles.tabUnderlineActive,
            ]}
          />
        </Pressable>

        <Pressable
          style={styles.tabBtn}
          onPress={() => setActiveTab("default")}
          hitSlop={10}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "default" && styles.tabTextActive,
            ]}
          >
            تمرینات پیش‌فرض
          </Text>
          <View
            style={[
              styles.tabUnderline,
              activeTab === "default" && styles.tabUnderlineActive,
            ]}
          />
        </Pressable>
      </View>

      {/* =======================================================
          ✅ List Scroll ONLY (search/tab ثابت می‌مانند)
         ======================================================= */}
      <View style={styles.listArea}>
        <ScrollView
          style={styles.listScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {listToShow.map((item) => (
            <View key={String(item.id)} style={styles.exerciseCard}>
              <Pressable
                style={styles.cardAddBtn}
                onPress={handleCardAddLater} // ✅ دیگر مودال‌ها را باز نمی‌کند
                hitSlop={10}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={ms(18)}
                  color={COLORS.primary}
                />
                <Text style={styles.cardAddText}>افزودن</Text>
              </Pressable>

              <Text style={styles.exerciseName}>{item.name}</Text>

              <Pressable style={styles.videoChip} hitSlop={10}>
                <Text style={styles.videoChipText}>فیلم</Text>
              </Pressable>
            </View>
          ))}

          {listToShow.length === 0 && (
            <Text style={styles.emptyText}>هنوز تمرینی اضافه نشده</Text>
          )}

          <View style={{ height: ms(6) }} />
        </ScrollView>
      </View>

      {/* ================= Modal 1 (Group 287) ================= */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable
            style={RNStyleSheet.absoluteFill}
            onPress={closeAddModal}
          />
          <View style={styles.modalCard287}>
            <Pressable style={styles.modalClose} onPress={closeAddModal}>
              <Feather name="x" size={ms(18)} color={COLORS.text} />
            </Pressable>

            {/* Media Box -> opens Modal 2 */}
            <Pressable
              style={styles.mediaBox287}
              onPress={openCreateModalFromAddModal}
            >
              <Text style={styles.mediaBoxText287}>
                {addDraft?.media?.fileName
                  ? addDraft.media.fileName
                  : "تصویر یا فیلم آموزشی"}
              </Text>
            </Pressable>

            <Text style={styles.nameText287}>
              {String(addDraft?.name || "").trim() || "نام حرکت"}
            </Text>

            <View style={styles.fieldRow287}>
              <View style={styles.fieldItem287}>
                <Text style={styles.fieldLabel287}>تعداد ست</Text>
                <TextInput
                  value={addDraft.sets}
                  onChangeText={(t) =>
                    setAddDraft((p) => ({ ...p, sets: normalizeDigits(t) }))
                  }
                  placeholder="......"
                  placeholderTextColor={COLORS.text2}
                  keyboardType="numeric"
                  style={styles.dotsInput287}
                  textAlign="center"
                />
              </View>

              <View style={styles.fieldItem287}>
                <Text style={styles.fieldLabel287}>تعداد تکرار</Text>
                <TextInput
                  value={addDraft.reps}
                  onChangeText={(t) =>
                    setAddDraft((p) => ({ ...p, reps: normalizeDigits(t) }))
                  }
                  placeholder="......"
                  placeholderTextColor={COLORS.text2}
                  keyboardType="numeric"
                  style={styles.dotsInput287}
                  textAlign="center"
                />
              </View>
            </View>

            <Pressable style={styles.primaryBtn} onPress={submitAddToPlan}>
              <Text style={styles.primaryBtnText}>افزودن</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= Modal 2 (Group 290) ================= */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable
            style={RNStyleSheet.absoluteFill}
            onPress={closeCreateModal}
          />
          <View style={styles.modalCard290}>
            <Pressable style={styles.modalClose} onPress={closeCreateModal}>
              <Feather name="x" size={ms(18)} color={COLORS.text} />
            </Pressable>

            <Text style={styles.title290}>تمرین جدید</Text>

            <View style={styles.pill290}>
              <TextInput
                value={createName}
                onChangeText={setCreateName}
                placeholder="نام تمرین جدید:"
                placeholderTextColor={COLORS.primary}
                style={styles.pillInput290}
                textAlign="right"
              />
            </View>

            <View style={styles.uploadWrap290}>
              <Pressable
                style={styles.uploadBox290}
                onPress={() => {
                  Alert.alert("انتخاب فایل", "چه چیزی می‌خواهید آپلود کنید؟", [
                    { text: "تصویر", onPress: () => pickMedia("image") },
                    { text: "ویدیو", onPress: () => pickMedia("video") },
                    { text: "لغو", style: "cancel" },
                  ]);
                }}
              >
                <Text style={styles.uploadText290}>فیلم آموزشی</Text>
                <View style={styles.plusCircle290}>
                  <Ionicons name="add" size={ms(18)} color={COLORS.primary} />
                </View>
              </Pressable>

              {!!createMedia?.fileName && (
                <Text style={styles.selectedFile290} numberOfLines={1}>
                  {createMedia.fileName}
                </Text>
              )}
            </View>

            <View style={styles.pill291}>
              <TextInput
                value={createDesc}
                onChangeText={setCreateDesc}
                placeholder="توضیحات بیشتر:"
                placeholderTextColor={COLORS.primary}
                style={styles.pillInput291}
                textAlign="right"
              />
            </View>

            <Pressable style={styles.primaryBtn} onPress={submitCreate}>
              <Text style={styles.primaryBtnText}>افزودن</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ======================= Styles ======================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: ms(28),
    marginBottom: ms(16),
  },
  headerAddWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
  },
  headerAddText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.primary,
  },
  headerLine: {
    flex: 1,
    height: ms(1),
    backgroundColor: COLORS.primary,
    marginHorizontal: ms(12),
    opacity: 0.9,
  },
  headerTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
  },

  /* Search */
  searchBar: {
    height: ms(50),
    borderRadius: ms(22),
    backgroundColor: COLORS.inputBg2,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: ms(14),
    marginBottom: ms(16),
  },
  searchInput: {
    flex: 1,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text,
    paddingVertical: 0,
  },

  /* Tabs */
  tabsRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: ms(10),
  },
  tabBtn: { flex: 1, alignItems: "center" },
  tabText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.white2,
    opacity: 0.75,
  },
  tabTextActive: { color: COLORS.white2, opacity: 1 },
  tabUnderline: {
    marginTop: ms(10),
    height: ms(2),
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: ms(2),
  },
  tabUnderlineActive: { backgroundColor: COLORS.primary },

  /* ✅ List area separated */
  listArea: {
    flex: 1,
    marginTop: ms(6),
  },
  listScroll: { flex: 1 },
  listContainer: {
    gap: ms(16),
    paddingTop: ms(10),
    paddingBottom: ms(24),
  },

  exerciseCard: {
    backgroundColor: COLORS.white,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    paddingVertical: ms(11),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: ms(10),
    shadowOffset: { width: 0, height: ms(4) },
    elevation: 2,
  },
  cardAddBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: ms(5),
  },
  cardAddText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(15),
    color: COLORS.primary,
  },
  exerciseName: {
    transform: [{ translateX: ms(17) }],
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(15),
    color: COLORS.primary,
  },
  videoChip: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(12),
    paddingHorizontal: ms(16),
    paddingVertical: ms(16),
    minWidth: ms(58),
    alignItems: "center",
    justifyContent: "center",
  },
  videoChipText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(15),
    color: COLORS.text,
  },
  emptyText: {
    marginTop: ms(14),
    textAlign: "center",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.white2,
    opacity: 0.6,
  },

  /* Backdrop */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    left: ms(14),
    top: ms(14),
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
    zIndex: 10,
  },

  /* Primary button */
  primaryBtn: {
    marginTop: ms(19),
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: ms(22),
    paddingVertical: ms(12),
    paddingHorizontal: ms(34),
    minWidth: ms(111),
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.white,
  },

  modalCard287: {
    width: "78%",
    height: "50%",
    borderRadius: ms(15),
    backgroundColor: COLORS.inputBg,
    paddingTop: ms(18),
    paddingHorizontal: ms(18),
    paddingBottom: ms(18),
  },
  mediaBox287: {
    height: ms(100),
    width: ms(200),
    transform: [{ translateX: ms(30) }, { translateY: ms(20) }],
    borderRadius: ms(16),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBoxText287: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text,
    opacity: 0.85,
  },
  nameText287: {
    marginTop: ms(40),
    alignSelf: "flex-end",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
  },
  fieldRow287: { marginTop: ms(10), gap: ms(10) },
  fieldItem287: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: ms(10),
    marginTop: ms(10),
  },
  fieldLabel287: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
  },
  dotsInput287: {
    width: ms(50),
    height: ms(34),
    borderRadius: ms(4),
    backgroundColor: COLORS.disabled,
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text,
    marginBottom: ms(5),
  },

  modalCard290: {
    width: "78%",
    height: "50%",
    borderRadius: ms(15),
    backgroundColor: COLORS.inputBg,
    paddingTop: ms(18),
    paddingHorizontal: ms(18),
    paddingBottom: ms(18),
  },
  title290: {
    textAlign: "center",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
    marginVertical: ms(12),
  },
  pill290: {
    height: ms(40),
    borderRadius: ms(14),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    paddingHorizontal: ms(14),
    marginBottom: ms(14),
  },
  pill291: {
    height: ms(65),
    borderRadius: ms(14),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "flex-start",
    paddingHorizontal: ms(14),
    marginBottom: ms(5),
  },
  pillInput290: {
    width: "95%",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text,
    paddingVertical: 0,
  },
  pillInput291: {
    width: "95%",
    transform: [{ translateY: ms(13) }, { translateX: ms(10) }],
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text,
    paddingVertical: 0,
  },
  uploadWrap290: { marginBottom: ms(14) },
  uploadBox290: {
    height: ms(100),
    borderRadius: ms(18),
    borderWidth: ms(1.4),
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.45)",
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
    gap: ms(8),
  },
  uploadText290: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.primary,
  },
  plusCircle290: {
    width: ms(45),
    height: ms(45),
    borderRadius: ms(100),
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedFile290: {
    marginTop: ms(8),
    textAlign: "center",
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(11),
    color: COLORS.text2,
  },
});
