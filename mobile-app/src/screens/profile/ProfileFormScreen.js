// src/screens/profile/ProfileFormScreen.js
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ms } from "react-native-size-matters";
import * as DocumentPicker from "expo-document-picker";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Feather } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import iranLocations from "../../../assets/data/province_city.json";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { COLORS } from "../../theme/colors";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  createTrainerProfile,
  getSpecialties,
  uploadCertificate,
} from "../../../api/trainer";
import { useProfileStore } from "../../store/profileStore";

// ---------- داده‌های ایران (استان / شهر) ----------

const PROVINCES = iranLocations.map((p) => ({
  id: p["province-en"],
  name: p["province-fa"],
}));

const CITIES_BY_PROVINCE = iranLocations.reduce((acc, p) => {
  const key = p["province-en"];
  acc[key] = (p.cities || []).map((c) => c["city-fa"]);
  return acc;
}, {});

// ---------- تاریخ تولد ----------

const years = Array.from({ length: 80 }, (_, i) => 1403 - i);
const persianMonths = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);

// ---------- ولیدیشن ----------

const schema = yup.object({
  username: yup.string().required("نام کاربری الزامی است"),
  phone: yup
    .string()
    .nullable()
    .matches(/^[0-9+]*$/, "فقط عدد مجاز است")
    .max(20, "حداکثر ۲۰ کاراکتر"),
  instagram: yup.string().nullable(),
  telegram: yup.string().nullable(),
  certificate: yup.mixed().required("مدرک مربیگری الزامی است"),
});

// ---------- SelectField ----------

function SelectField({
  value,
  onChange,
  placeholder,
  options,
  disabled,
  containerStyle,
  textStyle,
}) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = useMemo(() => {
    const found = options.find((opt) => opt.value === value);
    return found ? found.label : "";
  }, [value, options]);

  const handleOpen = () => {
    if (disabled) return;
    setVisible(true);
  };

  const handleSelect = (val) => {
    onChange(val);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        style={[
          styles.dropdownWrapper,
          containerStyle,
          disabled && { opacity: 0.6 },
        ]}
        onPress={handleOpen}
      >
        <Text
          style={[
            styles.dropdownText,
            textStyle,
            !value && styles.dropdownPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <View style={styles.dropdownIcon}>
          <Entypo name="triangle-down" size={ms(21)} color={COLORS.text} />
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setVisible(false)}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{placeholder}</Text>
            <ScrollView>
              {options
                .filter((opt) => opt.value !== "")
                .map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={styles.modalOption}
                    onPress={() => handleSelect(opt.value)}
                  >
                    <Text style={styles.modalOptionText}>{opt.label}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------- صفحه اصلی ----------

export default function ProfileFormScreen() {
  const [avatarUri, setAvatarUri] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const setProfile = useProfileStore((state) => state.setProfile);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    defaultValues: {
      username: "",
      gender: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      specialty: "",
      province: "",
      city: "",
      description: "",
      phone: "",
      instagram: "",
      telegram: "",
      certificate: null,
    },
    resolver: yupResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const selectedProvinceId = watch("province");

  const [specialtyOptions, setSpecialtyOptions] = useState([
    { label: "حیطه تخصصی:", value: "" },
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadSpecialties = async () => {
      try {
        const data = await getSpecialties();
        const items = (data || []).map((s) => ({
          label: s.name,
          value: String(s.id),
        }));

        if (isMounted) {
          setSpecialtyOptions([{ label: "حیطه تخصصی:", value: "" }, ...items]);
        }
      } catch (e) {
        console.log("Error loading specialties:", e);
      }
    };

    loadSpecialties();

    return () => {
      isMounted = false;
    };
  }, []);

  const cityOptions = useMemo(() => {
    if (!selectedProvinceId) return [];
    const arr = CITIES_BY_PROVINCE[selectedProvinceId] || [];
    return arr.map((c) => ({ label: c, value: c }));
  }, [selectedProvinceId]);

  // آواتار با sheet سیستمی (Camera / Gallery / Files...)
  const pickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.type === "success") {
        setAvatarUri(result.uri);
      }
    } catch (e) {
      console.log("Avatar pick error:", e);
    }
  };

  const pickCertificate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.type === "success") {
        setCertificateFile(result);
        setValue("certificate", result, { shouldValidate: true });
      }
    } catch (e) {
      console.log("Certificate pick error:", e);
    }
  };

  const onSubmit = async (data) => {
    try {
      // ۱) آپلود مدرک (اگر انتخاب شده)
      let certUrl = null;
      if (certificateFile?.uri) {
        const uploadRes = await uploadCertificate(certificateFile);
        certUrl = uploadRes?.data?.url || null;
      }

      // ۲) بقیه دیتا
      const gender =
        !data.gender || data.gender === "other" ? null : data.gender;

      let birthDate = null;
      if (data.birthYear && data.birthMonth && data.birthDay) {
        const y = String(data.birthYear).padStart(4, "0");
        const m = String(data.birthMonth).padStart(2, "0");
        const d = String(data.birthDay).padStart(2, "0");
        birthDate = `${y}-${m}-${d}`;
      }

      const provinceFa =
        PROVINCES.find((p) => p.id === data.province)?.name || "";

      const payload = {
        username: data.username.trim(),
        gender,
        birthDate,
        province: provinceFa || null,
        city: data.city || null,
        bio: data.description || null,
        contactPhone: data.phone || null,
        telegramUrl: data.telegram || null,
        instagramUrl: data.instagram || null,
        specialtyIds: data.specialty ? [Number(data.specialty)] : [],
        certificateImageUrl: certUrl,
      };

      const res = await createTrainerProfile(payload);
      console.log("Trainer profile created =>", res?.data || res);

      // ذخیره در Zustand
      setProfile({
        username: data.username.trim(),
        name: data.username.trim(),
        city: data.city || "",
        avatarUri: avatarUri || null,
        specialties: data.specialty
          ? [
              specialtyOptions.find((s) => s.value === data.specialty)?.label ||
                "",
            ]
          : [],
        description: data.description || "",
        phone: data.phone || "",
        instagram: data.instagram || "",
        telegram: data.telegram || "",
      });

      Alert.alert("موفق", "پروفایل شما با موفقیت ذخیره شد ✅");
    } catch (e) {
      console.error("Create trainer profile error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "خطا در ذخیره پروفایل. لطفاً دوباره تلاش کنید.";
      Alert.alert("خطا", msg);
    }
  };

  const genderOptions = [
    { label: "جنسیت:", value: "" },
    { label: "زن", value: "female" },
    { label: "مرد", value: "male" },
    { label: "سایر", value: "other" },
  ];

  const provinceOptions = [
    { label: "استان:", value: "" },
    ...PROVINCES.map((p) => ({ label: p.name, value: p.id })),
  ];

  const dayOptions = [
    { label: "روز", value: "" },
    ...days.map((d) => ({ label: String(d), value: String(d) })),
  ];
  const monthOptions = [
    { label: "ماه", value: "" },
    ...persianMonths.map((m, i) => ({
      label: m,
      value: String(i + 1),
    })),
  ];

  const yearOptions = [
    { label: "سال", value: "" },
    ...years.map((y) => ({ label: String(y), value: String(y) })),
  ];

  const isSaveDisabled = !isValid || isSubmitting;

  // helper برای تشخیص عکس بودن مدرک
  const isCertificateImage =
    certificateFile &&
    ((certificateFile.mimeType &&
      certificateFile.mimeType.startsWith("image/")) ||
      (certificateFile.name &&
        /\.(jpg|jpeg|png|webp|gif)$/i.test(certificateFile.name)));

  const certificateSizeKB = certificateFile?.size
    ? Math.round(certificateFile.size / 1024)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={0}
        extraScrollHeight={ms(140)}
        extraHeight={Platform.OS === "android" ? ms(100) : 0}
        showsVerticalScrollIndicator={false}
      >
        {/* عنوان */}
        <Text style={styles.title}>اطلاعات اولیه</Text>

        {/* آواتار */}
        <Pressable onPress={pickAvatar} style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome5
                name="user-alt"
                size={65}
                color={COLORS.primary}
                style={{
                  transform: [{ translateY: ms(-5) }, { translateX: ms(1) }],
                }}
              />
            </View>
          )}

          {/* دایره + */}
          <View style={styles.avatarPlus}>
            <FontAwesome
              name="plus"
              size={27}
              color={COLORS.white}
              style={{
                transform: [{ translateY: ms(1) }],
              }}
            />
          </View>
        </Pressable>

        {/* نام کاربری */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="username"
            render={({ field: { value, onChange } }) => (
              <CustomInput
                borderRadius={ms(15)}
                width={ms(320)}
                height={ms(50)}
                style={{ backgroundColor: COLORS.inputBg2 }}
                value={value}
                onChangeText={onChange}
                placeholder="نام کاربری (ID):"
                inputStyle={styles.inputSmall}
              />
            )}
          />
          {errors.username && (
            <Text style={styles.errorText}>{errors.username.message}</Text>
          )}
        </View>

        {/* جنسیت */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="gender"
            render={({ field: { value, onChange } }) => (
              <SelectField
                value={value}
                onChange={onChange}
                placeholder="جنسیت:"
                options={genderOptions}
              />
            )}
          />
        </View>

        {/* تاریخ تولد */}
        <View style={styles.field}>
          <View style={styles.birthContainer}>
            <Text style={styles.birthLabel}>تاریخ تولد:</Text>

            <View style={styles.birthInlineRow}>
              {/* روز */}
              <Controller
                control={control}
                name="birthDay"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    value={value}
                    onChange={onChange}
                    placeholder="روز"
                    options={dayOptions}
                    containerStyle={styles.birthDropdown}
                    textStyle={styles.birthText}
                  />
                )}
              />

              <Text style={styles.birthSeparator}> /</Text>

              {/* ماه */}
              <Controller
                control={control}
                name="birthMonth"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    value={value}
                    onChange={onChange}
                    placeholder="ماه"
                    options={monthOptions}
                    containerStyle={styles.birthDropdown}
                    textStyle={styles.birthText}
                  />
                )}
              />

              <Text style={styles.birthSeparator}>/</Text>

              {/* سال */}
              <Controller
                control={control}
                name="birthYear"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    value={value}
                    onChange={onChange}
                    placeholder="سال   "
                    options={yearOptions}
                    containerStyle={styles.birthDropdown}
                    textStyle={styles.birthText}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* حیطه تخصصی */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="specialty"
            render={({ field: { value, onChange } }) => (
              <SelectField
                value={value}
                onChange={onChange}
                placeholder="حیطه تخصصی:"
                options={specialtyOptions}
              />
            )}
          />
        </View>

        {/* استان */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="province"
            render={({ field: { value, onChange } }) => (
              <SelectField
                value={value}
                onChange={(val) => {
                  onChange(val);
                  setValue("city", "");
                }}
                placeholder="استان:"
                options={provinceOptions}
              />
            )}
          />
        </View>

        {/* شهر */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="city"
            render={({ field: { value, onChange } }) => (
              <SelectField
                value={value}
                onChange={onChange}
                placeholder={
                  selectedProvinceId ? "شهر:" : "ابتدا استان را انتخاب کنید"
                }
                options={
                  selectedProvinceId
                    ? cityOptions
                    : [{ label: "ابتدا استان را انتخاب کنید", value: "" }]
                }
                disabled={!selectedProvinceId}
              />
            )}
          />
        </View>

        {/* توضیحات، افتخارات، سوابق */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <CustomInput
                value={value}
                onChangeText={onChange}
                placeholder="توضیحات، افتخارات، سوابق:"
                multiline
                style={styles.textArea}
                inputStyle={[
                  styles.inputSmall,
                  styles.textAreaInput,
                  { backgroundColor: COLORS.inputBg2 },
                ]}
              />
            )}
          />
        </View>

        {/* مدرک مربیگری */}
        <View style={styles.field}>
          <Text style={styles.label}>مدرک مربیگری:</Text>

          <Pressable style={styles.uploadBox} onPress={pickCertificate}>
            {/* اگر چیزی انتخاب نشده */}
            {!certificateFile && (
              <>
                <Feather
                  name="upload"
                  size={32}
                  color={COLORS.text}
                  style={{
                    transform: [{ translateY: ms(-1) }],
                    marginBottom: ms(13),
                    marginTop: ms(20),
                  }}
                />
                <Text style={styles.uploadText}>افزودن مدرک</Text>
              </>
            )}

            {/* اگر فایل انتخاب شده */}
            {certificateFile && (
              <View style={styles.previewRow}>
                {/* اگر عکس باشد */}
                {(certificateFile.mimeType?.startsWith("image/") ||
                  /\.(jpg|jpeg|png|webp)$/i.test(certificateFile.name)) && (
                  <Image
                    source={{ uri: certificateFile.uri }}
                    style={styles.certificateImage}
                  />
                )}

                {/* اگر عکس نبود → PDF یا دیگر فایل‌ها */}
                {!(
                  certificateFile.mimeType?.startsWith("image/") ||
                  /\.(jpg|jpeg|png|webp)$/i.test(certificateFile.name)
                ) && (
                  <View style={styles.pdfIcon}>
                    <Feather name="file-text" size={28} color={COLORS.text} />
                  </View>
                )}

                {/* متن فایل */}
                <View style={styles.previewTextCol}>
                  <Text
                    style={styles.certificateName}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {certificateFile.name}
                  </Text>

                  <Text style={styles.changeHint}>برای تغییر دوباره بزنید</Text>
                </View>
              </View>
            )}
          </Pressable>

          {errors.certificate && (
            <Text style={styles.errorText}>{errors.certificate.message}</Text>
          )}
        </View>

        {/* راه‌های ارتباطی */}
        <Text style={[styles.label, styles.sectionLabel]}>
          راه‌های ارتباطی:
        </Text>

        {/* شماره تلفن */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <CustomInput
                borderRadius={ms(12)}
                width={ms(320)}
                height={ms(50)}
                style={{ backgroundColor: COLORS.inputBg2 }}
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                placeholder=":شماره تلفن"
                inputStyle={styles.inputSmall}
              />
            )}
          />
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone.message}</Text>
          )}
        </View>

        {/* اینستاگرام */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="instagram"
            render={({ field: { value, onChange } }) => (
              <CustomInput
                borderRadius={ms(12)}
                width={ms(320)}
                height={ms(50)}
                style={{ backgroundColor: COLORS.inputBg2 }}
                value={value}
                onChangeText={onChange}
                placeholder="اینستاگرام:"
                inputStyle={styles.inputSmall}
              />
            )}
          />
        </View>

        {/* تلگرام */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="telegram"
            render={({ field: { value, onChange } }) => (
              <CustomInput
                borderRadius={ms(12)}
                width={ms(320)}
                height={ms(50)}
                style={{ backgroundColor: COLORS.inputBg2 }}
                value={value}
                onChangeText={onChange}
                placeholder="تلگرام:"
                inputStyle={styles.inputSmall}
              />
            )}
          />
        </View>

        <PrimaryButton
          title={isSubmitting ? "در حال ذخیره..." : "ذخیره"}
          onPress={handleSubmit(onSubmit)}
          disabled={isSaveDisabled}
          textColor={isSaveDisabled ? "#2C2727" : COLORS.white}
          style={styles.saveButton}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ---------- استایل‌ها ----------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    paddingHorizontal: ms(30),
    paddingBottom: ms(32),
    alignItems: "center",
  },
  title: {
    fontSize: ms(20),
    color: COLORS.formTitle,
    textAlign: "center",
    paddingTop: ms(28),
    marginVertical: ms(24),
    fontFamily: "Vazirmatn_700Bold",
  },
  avatarWrapper: {
    alignSelf: "center",
    width: ms(120),
    height: ms(120),
    borderRadius: ms(300),
    marginBottom: ms(84),
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: ms(65),
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: ms(60),
  },
  field: {
    marginBottom: ms(16),
    width: "100%",
    alignItems: "center",
  },
  label: {
    fontSize: ms(14),
    color: COLORS.white,
    marginBottom: ms(4),
    textAlign: "right",
    fontFamily: "Vazirmatn_400Regular",
    alignSelf: "flex-end",
  },
  errorText: {
    fontSize: ms(10),
    color: COLORS.danger,
    marginTop: ms(4),
    textAlign: "right",
    fontFamily: "Vazirmatn_400Regular",
    alignSelf: "flex-end",
  },
  inputSmall: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    lineHeight: ms(12),
  },
  dropdownWrapper: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(12),
    height: ms(48),
    justifyContent: "center",
    paddingHorizontal: ms(16),
    width: ms(320),
  },
  dropdownIcon: {
    position: "absolute",
    left: ms(4),
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  dropdownText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
    textAlign: "right",
  },
  dropdownPlaceholder: {
    color: COLORS.text2,
  },
  textArea: {
    height: ms(120),
    borderRadius: ms(12),
    paddingTop: ms(12),
    width: ms(320),
  },
  textAreaInput: {
    textAlignVertical: "top",
  },
  uploadBox: {
    height: ms(120),
    borderRadius: ms(12),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg2,
    justifyContent: "center",
    alignItems: "center",
    width: ms(320),
    paddingHorizontal: ms(12),
  },
  uploadText: {
    fontSize: ms(12),
    color: COLORS.text2,
    fontFamily: "Vazirmatn_400Regular",
  },
  uploadContentRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    width: "100%",
  },
  certificateThumb: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(10),
    marginLeft: ms(12),
  },
  certificateIconWrap: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: ms(12),
  },
  certificateTextCol: {
    flex: 1,
    alignItems: "flex-end",
  },
  certificateName: {
    fontSize: ms(12),
    color: COLORS.white,
    fontFamily: "Vazirmatn_400Regular",
    marginBottom: ms(4),
    textAlign: "right",
  },
  certificateMeta: {
    fontSize: ms(10),
    color: COLORS.text2,
    fontFamily: "Vazirmatn_400Regular",
    marginBottom: ms(2),
    textAlign: "right",
  },
  certificateChangeHint: {
    fontSize: ms(10),
    color: COLORS.primary,
    fontFamily: "Vazirmatn_400Regular",
    textAlign: "right",
  },
  sectionLabel: {
    marginTop: ms(8),
    marginBottom: ms(8),
    alignSelf: "flex-end",
  },
  saveButton: {
    marginTop: ms(8),
    marginBottom: ms(15),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    maxHeight: ms(400),
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: ms(16),
    paddingTop: ms(12),
    paddingBottom: ms(24),
  },
  modalOption: {
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.white,
    textAlign: "center",
    marginBottom: ms(12),
  },
  modalOptionText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(13),
    color: COLORS.white,
    textAlign: "right",
  },
  avatarPlus: {
    position: "absolute",
    bottom: ms(-1),
    right: ms(3),
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  birthContainer: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(12),
    height: ms(48),
    paddingHorizontal: ms(16),
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    width: ms(320),
  },
  birthLabel: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text,
    marginLeft: ms(8),
  },
  birthInlineRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  birthDropdown: {
    backgroundColor: "transparent",
    height: ms(48),
    paddingHorizontal: 0,
    minWidth: ms(55),
    width: "auto",
    justifyContent: "center",
  },
  birthText: {
    fontSize: ms(12),
    textAlignVertical: "center",
  },
  birthSeparator: {
    marginHorizontal: ms(4),
    color: COLORS.text,
    fontFamily: "Vazirmatn_400Regular",
  },
  previewRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    width: "100%",
  },

  certificateImage: {
    width: ms(70),
    height: ms(70),
    borderRadius: ms(10),
    marginLeft: ms(12),
  },

  pdfIcon: {
    width: ms(70),
    height: ms(70),
    borderRadius: ms(10),
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: ms(12),
  },

  previewTextCol: {
    flex: 1,
    alignItems: "flex-end",
  },

  certificateName: {
    fontSize: ms(12),
    color: COLORS.white,
    fontFamily: "Vazirmatn_400Regular",
    marginBottom: ms(4),
    textAlign: "right",
  },

  changeHint: {
    fontSize: ms(10),
    color: COLORS.primary,
    fontFamily: "Vazirmatn_400Regular",
    textAlign: "right",
  },
});
