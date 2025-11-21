// src/screens/profile/ProfileFormScreen.js
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ms } from "react-native-size-matters";
import { launchImageLibrary } from "react-native-image-picker";
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

// ---------- داده‌های ایران (استان / شهر) ----------

// از JSON همهٔ استان‌ها و شهرها رو می‌سازیم
const PROVINCES = iranLocations.map((p) => ({
  id: p["province-en"], // id داخلی (انگلیسی)
  name: p["province-fa"], // نمایش فارسی
}));

const CITIES_BY_PROVINCE = iranLocations.reduce((acc, p) => {
  const key = p["province-en"]; // همون id بالا
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
  // فیلد اجباری برای مدرک
  certificate: yup.mixed().required("مدرک مربیگری الزامی است"),
});

// ---------- SelectField سفارشی به جای Picker ----------
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
                .filter((opt) => opt.value !== "") // ← placeholder ها رو حذف می‌کنیم
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
      certificate: null, // ← برای yup
    },
    resolver: yupResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const selectedProvinceId = watch("province");

  const cityOptions = useMemo(() => {
    if (!selectedProvinceId) return [];
    const arr = CITIES_BY_PROVINCE[selectedProvinceId] || [];
    return arr.map((c) => ({ label: c, value: c }));
  }, [selectedProvinceId]);

  const pickAvatar = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.7,
      },
      (res) => {
        if (res.didCancel || res.errorCode) return;
        const uri = res.assets?.[0]?.uri;
        if (uri) setAvatarUri(uri);
      }
    );
  };

  const pickCertificate = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });

    if (result.type === "success") {
      setCertificateFile(result);
      // مقدار دادن به فیلد فرم برای ولیدیشن
      setValue("certificate", result, { shouldValidate: true });
    }
  };

  const onSubmit = (data) => {
    const finalData = {
      ...data,
      avatarUri,
      certificateFile,
    };
    console.log("PROFILE FORM DATA =>", finalData);
  };

  // داده‌های SelectFieldها
  const genderOptions = [
    { label: "جنسیت:", value: "" },
    { label: "زن", value: "female" },
    { label: "مرد", value: "male" },
    { label: "سایر", value: "other" },
  ];

  const specialtyOptions = [
    { label: "حیطه تخصصی:", value: "" },
    { label: "بدنسازی", value: "fitness" },
    { label: "تغذیه", value: "nutrition" },
    { label: "یوگا", value: "yoga" },
    { label: "ورزش‌درمانی", value: "rehab" },
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScrollView
        style={styles.safe}
        contentContainerStyle={styles.container}
        enableOnAndroid
        extraScrollHeight={ms(40)}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.uploadText}>
              {certificateFile ? certificateFile.name : "افزودن مدرک"}
            </Text>
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
                placeholder="شماره تلفن:"
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

        {/* دکمه ذخیره */}
        <PrimaryButton
          title="ذخیره"
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
  },
  label: {
    fontSize: ms(14),
    color: COLORS.white,
    marginBottom: ms(4),
    textAlign: "right",
    fontFamily: "Vazirmatn_400Regular",
  },
  errorText: {
    fontSize: ms(10),
    color: COLORS.danger,
    marginTop: ms(4),
    textAlign: "right",
    fontFamily: "Vazirmatn_400Regular",
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
  birthRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  birthItem: {
    flex: 1,
  },
  birthSeparator: {
    marginHorizontal: ms(4),
    color: COLORS.text,
    fontFamily: "Vazirmatn_400Regular",
  },
  textArea: {
    height: ms(120),
    borderRadius: ms(12),
    paddingTop: ms(12),
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
  },
  uploadPlus: {
    fontSize: ms(32),
    marginBottom: ms(4),
    color: COLORS.text,
    fontFamily: "Vazirmatn_400Regular",
  },
  uploadText: {
    fontSize: ms(12),
    color: COLORS.text2,
    fontFamily: "Vazirmatn_400Regular",
  },
  sectionLabel: {
    marginTop: ms(8),
    marginBottom: ms(8),
  },
  saveButton: {
    marginTop: ms(8),
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
    backgroundColor: COLORS.bg, // پس‌زمینه تیره مثل بقیه صفحه
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: ms(16),
    paddingTop: ms(12),
    paddingBottom: ms(24),
  },

  modalOption: {
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, // خط جداکننده زیر هر آیتم
  },

  modalTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.white, // متن روشن روی بک‌گراند تیره
    textAlign: "center",
    marginBottom: ms(12),
  },

  modalOptionText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(13),
    color: COLORS.white, // اینم روشن
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
    minWidth: ms(50),
    justifyContent: "center",
  },
  birthText: {
    fontSize: ms(12),
    textAlignVertical: "center",
  },
});
