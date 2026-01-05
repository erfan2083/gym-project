import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet as RNStyleSheet,
} from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../theme/colors";
import { generateGeminiResponse } from "../../../api/gemini";

const DAY_LABELS = {
  sat: "شنبه",
  sun: "یکشنبه",
  mon: "دوشنبه",
  tue: "سه‌شنبه",
  wed: "چهارشنبه",
  thu: "پنج‌شنبه",
  fri: "جمعه",
};

const systemPrompt =
  "شما یک مربی حرفه‌ای بدنسازی هستید. بر اساس برنامه تمرینی به زبان فارسی بازخورد بدهید، نکات ایمنی را رعایت کنید و پاسخ‌ها را کوتاه و کاربردی نگه دارید.";

const initialGreeting = {
  id: "ai-welcome",
  sender: "ai",
  text: "سلام! برای تحلیل برنامه یا پرسیدن سوال روی دکمه شروع بزن تا برنامه هفتگی‌ات را برایم بفرستی.",
  ts: Date.now(),
};

const formatPlanForAi = (planByDay = {}) => {
  const lines = [];
  Object.entries(planByDay || {}).forEach(([key, items = []]) => {
    if (!items.length) return;
    const dayLabel = DAY_LABELS[key] || key;
    lines.push(`${dayLabel}:`);
    items.forEach((it, idx) => {
      const name = it?.name || "تمرین";
      const sets = it?.sets ? `${it.sets} ست` : "ست نامشخص";
      const reps = it?.reps ? `${it.reps} تکرار` : "تکرار نامشخص";
      const notes = it?.notes ? ` - نکات: ${it.notes}` : "";
      lines.push(`  ${idx + 1}. ${name} | ${sets} × ${reps}${notes}`);
    });
    lines.push("");
  });

  if (!lines.length) return "هنوز تمرینی در برنامه ثبت نشده است.";
  return lines.join("\n");
};

export default function AiCoachChatOverlay({
  visible,
  onClose,
  planByDay,
  traineeName = "کاربر",
  trainerName = "مربی",
  weekStart,
  bottomOffset = ms(120),
}) {
  const [messages, setMessages] = useState([initialGreeting]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const scrollRef = useRef(null);

  const history = useMemo(
    () =>
      messages.map((m) => ({
        role: m.sender === "ai" ? "model" : "user",
        content: m.text,
      })),
    [messages]
  );

  useEffect(() => {
    if (visible) {
      setMessages([initialGreeting]);
      setDraft("");
      setSessionStarted(false);
    }
  }, [visible]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendToGemini = async (text) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setLoading(true);

    try {
      const reply = await generateGeminiResponse({
        history: [...history, { role: "user", content: text }],
        systemPrompt,
      });

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply || "پاسخی دریافت نشد. دوباره امتحان کن.",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Gemini error", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "ai",
          text:
            error?.message ===
            "Gemini API key is missing. Set EXPO_PUBLIC_GEMINI_API_KEY."
              ? "کلید دسترسی Gemini تنظیم نشده است."
              : "در ارتباط با هوش مصنوعی خطایی رخ داد. لطفاً دوباره تلاش کن.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    const planText = formatPlanForAi(planByDay);
    const intro = `من ${traineeName} هستم. این برنامه تمرینی من است که مربی (${trainerName}) برایم در هفته شروع ${
      weekStart || "این هفته"
    } نوشته است. لطفاً به عنوان یک مربی حرفه‌ای نظرت را بگو و اگر نکته‌ای برای بهبود داری مطرح کن.\n\n${planText}`;
    setSessionStarted(true);
    sendToGemini(intro);
  };

  const handleSend = () => {
    if (!sessionStarted) {
      handleStart();
      return;
    }
    if (!draft.trim()) return;
    sendToGemini(draft.trim());
  };

  const renderBubble = (m) => {
    const isUser = m.sender === "user";
    return (
      <View
        key={m.id}
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {m.text}
        </Text>
      </View>
    );
  };

  return (
    <View
      pointerEvents={visible ? "auto" : "none"}
      style={[styles.overlayWrap, !visible && { opacity: 0 }]}
    >
      {/* Backdrop */}
      <Pressable
        style={[styles.backdrop, { bottom: bottomOffset }]}
        onPress={onClose}
      />

      {/* Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.cardWrap, { bottom: bottomOffset }]}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.chatBtn}>
              <Ionicons name="arrow-back" size={ms(22)} color={COLORS.primary} />
            </Pressable>

            <View style={styles.headerLine} />

            <Text style={styles.headerName} numberOfLines={1}>
              چت با مربی هوشمند
            </Text>

            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons
                name="robot"
                size={ms(18)}
                color={COLORS.primary}
              />
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesWrap}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m) => renderBubble(m))}
            {loading && (
              <Text style={styles.loadingText}>در حال دریافت پاسخ...</Text>
            )}
            <View style={{ height: ms(10) }} />
          </ScrollView>

          {/* Input Row */}
          <View style={styles.inputRow}>
            <Pressable
              onPress={handleSend}
              hitSlop={10}
              style={[styles.sendBtn, !sessionStarted && styles.startBtn]}
            >
              {sessionStarted ? (
                <Ionicons
                  name="paper-plane-outline"
                  size={ms(22)}
                  color={COLORS.primary}
                  style={{ transform: [{ rotate: "-20deg" }] }}
                />
              ) : (
                <Ionicons name="play" size={ms(22)} color={COLORS.primary} />
              )}
            </Pressable>

            <View style={styles.inputPill}>
              {!sessionStarted && (
                <Pressable onPress={handleStart} style={styles.startIconWrap}>
                  <MaterialCommunityIcons
                    name="lightning-bolt-outline"
                    size={ms(20)}
                    color={COLORS.primary}
                  />
                  <Text style={styles.startText}>شروع</Text>
                </Pressable>
              )}
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={
                  sessionStarted
                    ? "سوالت را بنویس..."
                    : "برای تحلیل برنامه روی شروع بزن"
                }
                placeholderTextColor={COLORS.text2}
                style={[styles.input, !sessionStarted && { color: COLORS.text2 }]}
                textAlign="left"
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={sessionStarted}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...RNStyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cardWrap: {
    width: "100%",
    position: "absolute",
    left: 0,
    right: 0,
    height: "90%",
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.chatbg,
    overflow: "hidden",
    borderRadius: ms(22),
    paddingHorizontal: ms(18),
    paddingTop: ms(16),
    paddingBottom: ms(12),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ms(14),
  },
  chatBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerLine: {
    flex: 1,
    height: ms(1),
    backgroundColor: COLORS.primary,
    marginHorizontal: ms(10),
    opacity: 0.8,
  },
  headerName: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.primary,
    flex: 0,
    minWidth: ms(120),
    textAlign: "center",
  },
  avatarCircle: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  messagesWrap: {
    paddingBottom: ms(12),
    gap: ms(8),
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: ms(12),
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },
  bubbleAi: {
    alignSelf: "flex-start",
    backgroundColor: "#f2f2f2",
  },
  bubbleText: {
    fontFamily: "Vazirmatn_600SemiBold",
    fontSize: ms(13),
    color: COLORS.text,
    lineHeight: ms(18),
  },
  bubbleTextUser: {
    color: "white",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    marginTop: ms(6),
  },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: ms(18),
    paddingHorizontal: ms(12),
    minHeight: ms(44),
  },
  input: {
    flex: 1,
    fontFamily: "Vazirmatn_500Medium",
    fontSize: ms(13),
    color: COLORS.text,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  startBtn: {
    backgroundColor: "rgba(245, 184, 0, 0.15)",
  },
  startIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    paddingRight: ms(10),
  },
  startText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.primary,
  },
  loadingText: {
    fontFamily: "Vazirmatn_500Medium",
    fontSize: ms(12),
    color: COLORS.text2,
    alignSelf: "center",
  },
});
