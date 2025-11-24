// src/screens/profile/ProfileEditScreen.js
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
import * as ImagePicker from "expo-image-picker";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Feather } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import iranLocations from "../../../assets/data/province_city.json";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MultiSelectField from "../../components/ui/MultiSelectField";
import { COLORS } from "../../theme/colors";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  updateTrainerProfile,
  getSpecialties,
  uploadCertificate,
} from "../../../api/trainer";
import { uploadAvatar } from "../../../api/user";
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
const years = Array.from({ length: 80 }, (_, i) => 1404 - i);
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
  certificate: yup.mixed().nullable(),
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
  compactValue = false,
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

  // نمایش به شکل «استان: فارس»
  let displayText = "";

  // اگر مقدار انتخاب نشده باشد → placeholder
  if (!value) {
    displayText = placeholder;
  } else {
    // اگر compactValue فعال باشد → فقط مقدار
    if (compactValue) {
      displayText = selectedLabel;
    } else {
      // حالت معمول قبلی
      const base = (placeholder || "").trim();
      if (!base) {
        displayText = selectedLabel;
      } else if (base.endsWith(":")) {
        displayText = `${base} ${selectedLabel}`;
      } else {
        displayText = `${base} ${selectedLabel}`;
      }
    }
  }

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
          {displayText}
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

// ---------- helper برای تشخیص عکس بودن مدرک ----------
const isImageFile = (file) => {
  if (!file) return false;
  const mime = file.mimeType || file.type || "";
  if (mime.startsWith("image/")) return true;
  const name = (file.name || "").toLowerCase();
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
};

// ---------- صفحه ویرایش ----------
export default function ProfileEditScreen({ navigation }) {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);

  // چیزهایی که الان تو ProfileTab نشون می‌دی:
  const currentName = profile?.name || profile?.username || "";
  const currentUsername = profile?.username || "";
  const currentCity = profile?.city || "";
  const specialtiesRaw = profile?.specialties ?? [];
  const currentDescription = profile?.description || "";
  const currentPhone = profile?.phone || "";
  const currentInstagram = profile?.instagram || "";
  const currentTelegram = profile?.telegram || "";
  const currentAvatarUri = profile?.avatarUri || null;
  const currentCertUrl = profile?.certificateImageUrl || null;

  const [avatarUri, setAvatarUri] = useState(currentAvatarUri);
  const [certificateFile, setCertificateFile] = useState(null);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    // 👇 فیلدها رو با استور پر می‌کنیم
    defaultValues: {
      username: currentUsername,
      name: currentName,

      gender: "", // فعلاً تو استور نداری
      birthDay: "", // فعلاً تو استور نداری
      birthMonth: "",
      birthYear: "",
      specialty: "", // از روی label تو useEffect ست می‌کنیم
      province: "", // فعلاً نگه نداشتی
      city: currentCity,
      description: currentDescription,
      phone: currentPhone,
      instagram: currentInstagram,
      telegram: currentTelegram,
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

  // لود تخصص‌ها + مچ کردن با چیزی که تو ProfileTab نمایش داده می‌شه
  useEffect(() => {
    let isMounted = true;

    const loadSpecialties = async () => {
      try {
        const data = await getSpecialties();
        const items = (data || []).map((s) => ({
          label: s.name,
          value: String(s.id),
        }));

        if (!isMounted) return;

        const opts = [{ label: "حیطه تخصصی:", value: "" }, ...items];
        setSpecialtyOptions(opts);

        // specialty فعلی رو از روی label پیدا می‌کنیم
        const firstSpecialtyLabel =
          Array.isArray(specialtiesRaw) && specialtiesRaw.length > 0
            ? specialtiesRaw[0]
            : typeof specialtiesRaw === "string"
            ? specialtiesRaw.split(/[\n,،]+/)[0]?.trim()
            : "";

        if (firstSpecialtyLabel) {
          const found = opts.find((o) => o.label === firstSpecialtyLabel);
          if (found) {
            setValue("specialty", found.value, { shouldValidate: true });
          }
        }
      } catch (e) {
        console.log("Error loading specialties:", e);
      }
    };

    loadSpecialties();

    return () => {
      isMounted = false;
    };
  }, [specialtiesRaw, setValue]);

  const cityOptions = useMemo(() => {
    if (!selectedProvinceId) return [];
    const arr = CITIES_BY_PROVINCE[selectedProvinceId] || [];
    return arr.map((c) => ({ label: c, value: c }));
  }, [selectedProvinceId]);

  const extractFileFromPickerResult = (result) => {
    if (result?.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return result;
  };

  // -------- آواتار --------
  const openAvatarSheet = () => setAvatarSheetVisible(true);
  const closeAvatarSheet = () => setAvatarSheetVisible(false);

  const pickAvatarFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("دسترسی", "اجازه دسترسی به گالری داده نشد.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets?.[0];
        if (asset?.uri) setAvatarUri(asset.uri);
      }
    } catch (e) {
      console.log("pickAvatarFromLibrary error:", e);
    } finally {
      closeAvatarSheet();
    }
  };

  const pickAvatarFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("دسترسی", "اجازه دسترسی به دوربین داده نشد.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets?.[0];
        if (asset?.uri) setAvatarUri(asset.uri);
      }
    } catch (e) {
      console.log("pickAvatarFromCamera error:", e);
    } finally {
      closeAvatarSheet();
    }
  };

  const clearAvatar = () => {
    setAvatarUri(null);
    closeAvatarSheet();
  };

  // -------- مدرک مربیگری --------
  const pickCertificate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.type === "success" || result.canceled === false) {
        const file = extractFileFromPickerResult(result);
        if (file?.uri) {
          setCertificateFile(file);
          setValue("certificate", file, { shouldValidate: true });
        }
      }
    } catch (e) {
      console.log("Certificate pick error:", e);
    }
  };

  const clearCertificate = () => {
    setCertificateFile(null);
    setValue("certificate", null, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
      try {
    // ۱) مدرک مربیگری: اگر فایل جدید انتخاب شده بود، آپلود؛ وگرنه همونی که قبلاً از سرور داشتیم
    let certUrl = currentCertUrl || null;
    if (certificateFile?.uri) {
      const uploadRes = await uploadCertificate(certificateFile);
      certUrl = uploadRes?.data?.url || null;
    }

    // ۲) آواتار: اگر تغییر کرده، آپلود جدید؛ وگرنه مقدار فعلی
    let avatarUrl = currentAvatarUri || null;
    if (avatarUri && avatarUri !== currentAvatarUri) {
      const avatarFile = {
        uri: avatarUri,
        name: `avatar_${Date.now()}.jpg`,
        type: "image/jpeg",
      };

      const avatarRes = await uploadAvatar(avatarFile);
      avatarUrl = avatarRes?.data?.avatarUrl || null;
    }

    // ۳) بقیه‌ی فیلدها
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
      PROVINCES.find((p) => p.id === data.province)?.name || null;

    // اگر MultiSelectField مقدار آرایه برگردونه، این‌طوری هندل می‌کنیم
    let specialtyIds = [];
    if (Array.isArray(data.specialty)) {
      specialtyIds = data.specialty.map((v) => Number(v)).filter(Boolean);
    } else if (data.specialty) {
      specialtyIds = [Number(data.specialty)];
    }

    const payload = {
      // 👈 این name برای User.full_name
      name: data.name?.trim() || null,

      username: data.username?.trim() || null,
      gender,
      birthDate,
      province: provinceFa,
      city: data.city || null,
      bio: data.description || null,
      contactPhone: data.phone || null,
      telegramUrl: data.telegram || null,
      instagramUrl: data.instagram || null,
      specialtyIds,
      certificateImageUrl: certUrl,
      // avatarUrl اینجا لازم نیست، چون با API جداگانه آپدیت شد
    };

    const res = await updateTrainerProfile(payload);
    console.log("Trainer profile updated =>", res?.data || res);

    // ۴) آپدیت استور لوکال تا ProfileTab هم به‌روز بشه
    setProfile({
      ...profile,
      name: data.name?.trim() || profile?.name || "",
      username: data.username?.trim() || profile?.username || "",
      city: data.city || "",
      avatarUri: avatarUrl || null,
      specialties:
        specialtyIds.length > 0
          ? specialtyIds
              .map(
                (id) =>
                  specialtyOptions.find((o) => o.value === String(id))?.label
              )
              .filter(Boolean)
          : profile?.specialties || [],
      description: data.description || "",
      phone: data.phone || "",
      instagram: data.instagram || "",
      telegram: data.telegram || "",
      certificateImageUrl: certUrl,
    });

    Alert.alert("موفق", "پروفایل شما با موفقیت به‌روزرسانی شد ✅", [
      {
        text: "بازگشت",
        onPress: () => navigation.goBack(),
      },
    ]);
  } catch (e) {
    console.error("Update trainer profile error:", e);
    const msg =
      e?.response?.data?.message ||
      e?.message ||
      "خطا در ویرایش پروفایل. لطفاً دوباره تلاش کنید.";
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
    { label: "روز:", value: "" },
    ...days.map((d) => ({ label: String(d), value: String(d) })),
  ];
  const monthOptions = [
    { label: "ماه:", value: "" },
    ...persianMonths.map((m, i) => ({
      label: m,
      value: String(i + 1),
    })),
  ];
  const yearOptions = [
    { label: "سال:", value: "" },
    ...years.map((y) => ({ label: String(y), value: String(y) })),
  ];

  const isSaveDisabled = !isValid || isSubmitting;

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
        <Text style={styles.title}>ویرایش اطلاعات</Text>

        {/* آواتار (فقط آیکن ادیت) */}
        <Pressable onPress={openAvatarSheet} style={styles.avatarWrapper}>
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
          <View style={styles.avatarPlus}>
            <FontAwesome
              name="edit"
              size={22}
              color={COLORS.white}
              style={{
                transform: [{ translateY: ms(1) }, { translateX: ms(2) }],
              }}
            />
          </View>
        </Pressable>

        {avatarUri && (
          <Pressable onPress={clearAvatar} style={styles.clearAvatarBtn}>
            <Feather name="trash-2" size={14} color={COLORS.danger} />
            <Text style={styles.clearAvatarText}>حذف عکس پروفایل</Text>
          </Pressable>
        )}

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

        {/* نام */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="name"
            defaultValue={currentName}
            render={({ field: { value, onChange } }) => (
              <CustomInput
                borderRadius={ms(15)}
                width={ms(320)}
                height={ms(50)}
                style={{ backgroundColor: COLORS.inputBg2 }}
                value={value}
                onChangeText={onChange}
                placeholder="نام:"
                inputStyle={styles.inputSmall}
              />
            )}
          />
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
                    placeholder="روز:"
                    options={dayOptions}
                    compactValue={true}
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
                    placeholder="ماه:"
                    options={monthOptions}
                    compactValue={true}
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
                    placeholder="سال:"
                    options={yearOptions}
                    compactValue={true}
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
            defaultValue={[]} // ← آرایه خالی
            render={({ field: { value, onChange } }) => (
              <MultiSelectField
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
            {certificateFile ? (
              <>
                {isImageFile(certificateFile) && certificateFile.uri ? (
                  <Image
                    source={{ uri: certificateFile.uri }}
                    style={styles.certificatePreviewImage}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={styles.certificateInfoRow}>
                  {!isImageFile(certificateFile) && (
                    <Feather
                      name="file-text"
                      size={24}
                      color={COLORS.text}
                      style={{ marginLeft: ms(8) }}
                    />
                  )}
                  <Text style={styles.certificateFileName} numberOfLines={1}>
                    {certificateFile.name || "فایل انتخاب شد"}
                  </Text>
                </View>
              </>
            ) : currentCertUrl ? (
              <>
                <Image
                  source={{ uri: currentCertUrl }}
                  style={styles.certificatePreviewImage}
                  resizeMode="cover"
                />
                <View style={styles.certificateInfoRow}>
                  <Feather
                    name="file-text"
                    size={24}
                    color={COLORS.text}
                    style={{ marginLeft: ms(8) }}
                  />
                  <Text style={styles.certificateFileName} numberOfLines={1}>
                    مدرک آپلود شده
                  </Text>
                </View>
              </>
            ) : (
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
          </Pressable>
          {(certificateFile || currentCertUrl) && (
            <Pressable onPress={clearCertificate} style={styles.clearCertBtn}>
              <Feather name="trash-2" size={14} color={COLORS.danger} />
              <Text style={styles.clearCertText}>حذف مدرک</Text>
            </Pressable>
          )}
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
          title={isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
          onPress={handleSubmit(onSubmit)}
          disabled={isSaveDisabled}
          textColor={isSaveDisabled ? "#2C2727" : COLORS.white}
          style={styles.saveButton}
        />

        {/* bottom sheet آواتار */}
        <Modal
          visible={avatarSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={closeAvatarSheet}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeAvatarSheet} />
          <View style={styles.avatarSheetContainer}>
            <View style={styles.avatarSheet}>
              <Text style={styles.avatarSheetTitle}>عکس پروفایل</Text>

              <Pressable
                style={styles.avatarSheetItem}
                onPress={pickAvatarFromCamera}
              >
                <Feather
                  name="camera"
                  size={20}
                  color={COLORS.white}
                  style={{ marginLeft: ms(8) }}
                />
                <Text style={styles.avatarSheetItemText}>
                  گرفتن عکس با دوربین
                </Text>
              </Pressable>

              <Pressable
                style={styles.avatarSheetItem}
                onPress={pickAvatarFromLibrary}
              >
                <Feather
                  name="image"
                  size={20}
                  color={COLORS.white}
                  style={{ marginLeft: ms(8) }}
                />
                <Text style={styles.avatarSheetItemText}>انتخاب از گالری</Text>
              </Pressable>

              {avatarUri && (
                <Pressable
                  style={[styles.avatarSheetItem, { borderTopWidth: 0 }]}
                  onPress={clearAvatar}
                >
                  <Feather
                    name="trash-2"
                    size={20}
                    color={COLORS.danger}
                    style={{ marginLeft: ms(8) }}
                  />
                  <Text
                    style={[
                      styles.avatarSheetItemText,
                      { color: COLORS.danger },
                    ]}
                  >
                    حذف عکس فعلی
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </Modal>
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
    marginBottom: ms(55),
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
  clearAvatarBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: ms(24),
  },
  clearAvatarText: {
    fontSize: ms(12),
    color: COLORS.danger,
    marginRight: ms(4),
    fontFamily: "Vazirmatn_400Regular",
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
    paddingHorizontal: ms(10),
  },
  uploadText: {
    fontSize: ms(12),
    color: COLORS.text2,
    fontFamily: "Vazirmatn_400Regular",
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
  certificatePreviewImage: {
    width: "100%",
    height: ms(70),
    borderRadius: ms(8),
    marginBottom: ms(8),
  },
  certificateInfoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "stretch",
  },
  certificateFileName: {
    flex: 1,
    fontSize: ms(12),
    color: COLORS.white,
    fontFamily: "Vazirmatn_400Regular",
    textAlign: "right",
  },
  clearCertBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: ms(6),
    alignSelf: "flex-end",
  },
  clearCertText: {
    fontSize: ms(12),
    color: COLORS.danger,
    marginRight: ms(4),
    fontFamily: "Vazirmatn_400Regular",
  },
  avatarSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  avatarSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: ms(20),
    paddingTop: ms(12),
    paddingBottom: ms(24),
  },
  avatarSheetTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.white,
    textAlign: "center",
    marginBottom: ms(12),
  },
  avatarSheetItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: ms(10),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  avatarSheetItemText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(13),
    color: COLORS.white,
    textAlign: "right",
  },
});
