// src/components/ui/MultiSelectField.js
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { ms } from "react-native-size-matters";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import { COLORS } from "../../theme/colors";

export default function MultiSelectField({
  value,
  onChange,
  placeholder = "انتخاب کنید",
  options = [],
  containerStyle,
  textStyle,
}) {
  const [visible, setVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState(
    Array.isArray(value) ? value : []
  );

  // همگام‌سازی داخلی با prop بیرونی
  useEffect(() => {
    if (Array.isArray(value)) {
      setTempSelected(value);
    } else {
      setTempSelected([]);
    }
  }, [value]);

  // لیبل‌های انتخاب‌شده
  const selectedItems = useMemo(() => {
    if (!Array.isArray(value) || value.length === 0) return [];
    return options.filter((o) => value.includes(o.value));
  }, [value, options]);

  const handleOpen = () => {
    setTempSelected(Array.isArray(value) ? value : []);
    setVisible(true);
  };

  const handleToggle = (val) => {
    // اگر روی placeholder (value === "") زد، یعنی خالی کن
    if (val === "") {
      setTempSelected([]);
      return;
    }

    setTempSelected((prev) => {
      if (prev.includes(val)) {
        return prev.filter((v) => v !== val);
      }
      return [...prev, val];
    });
  };

  const handleConfirm = () => {
    onChange?.(tempSelected);
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  // متن/چیدمان داخل خود فیلد
  const hasSelection = selectedItems.length > 0;

  return (
    <>
      {/* خود فیلد */}
      <Pressable style={[styles.wrapper, containerStyle]} onPress={handleOpen}>
        {hasSelection ? (
          <View style={styles.chipsContainer}>
            {selectedItems.map((item) => (
              <View key={item.value} style={styles.chip}>
                <Text style={styles.chipText}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.placeholderText, textStyle]} numberOfLines={1}>
            {placeholder}
          </Text>
        )}

        <View style={styles.icon}>
          <Entypo name="triangle-down" size={ms(18)} color={COLORS.text} />
        </View>
      </Pressable>

      {/* مودال انتخاب چندتایی */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{placeholder}</Text>

            <ScrollView style={{ maxHeight: ms(320) }}>
              {options.map((opt) => {
                const isSelected = tempSelected.includes(opt.value);

                // استایلِ خاص برای placeholder (اگر value === "")
                const isPlaceholderItem = opt.value === "";

                return (
                  <Pressable
                    key={opt.value || "placeholder"}
                    style={[
                      styles.optionRow,
                      isPlaceholderItem && styles.placeholderOptionRow,
                    ]}
                    onPress={() => handleToggle(opt.value)}
                  >
                    <View style={styles.optionLabelWrapper}>
                      <Text style={styles.optionText}>{opt.label}</Text>
                      {isPlaceholderItem && (
                        <Text style={styles.optionSubText}>
                          (بدون حیطه تخصصی)
                        </Text>
                      )}
                    </View>

                    {/* چک‌مارک انتخاب */}
                    {!isPlaceholderItem && (
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Feather
                            name="check"
                            size={ms(14)}
                            color={COLORS.white}
                          />
                        )}
                      </View>
                    )}

                    {/* برای placeholder اگر هیچ‌چیز انتخاب نشده باشه، آیکن clear نشون بده */}
                    {isPlaceholderItem && tempSelected.length === 0 && (
                      <Feather
                        name="slash"
                        size={ms(16)}
                        color={COLORS.text2}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* دکمه تایید پایین مودال */}
            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>تایید</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(12),
    minHeight: ms(48),
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    width: ms(320),
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
    left: ms(4),
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  placeholderText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.text2,
    textAlign: "right",
  },
  chipsContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: ms(6),
    paddingRight: ms(4),
    paddingLeft: ms(26), // برای اینکه زیر آیکن نره
  },
  chip: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: ms(20),
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
  },
  chipText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(11),
    color: COLORS.text2,
    textAlign: "right",
  },

  // مودال
  backdrop: {
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
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: ms(16),
    paddingTop: ms(12),
    paddingBottom: ms(24),
  },
  modalTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.white,
    textAlign: "center",
    marginBottom: ms(12),
  },
  optionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: ms(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  placeholderOptionRow: {
    borderBottomColor: COLORS.border,
  },
  optionLabelWrapper: {
    flexDirection: "column",
    alignItems: "flex-end",
    flex: 1,
    marginLeft: ms(8),
  },
  optionText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(13),
    color: COLORS.white,
    textAlign: "right",
  },
  optionSubText: {
    fontFamily: "Vazirmatn_300Light",
    fontSize: ms(11),
    color: COLORS.white,
    marginTop: ms(2),
  },
  checkbox: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  confirmBtn: {
    marginTop: ms(14),
    backgroundColor: COLORS.primary,
    borderRadius: ms(18),
    paddingVertical: ms(10),
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(13),
    color: COLORS.white,
  },
});
