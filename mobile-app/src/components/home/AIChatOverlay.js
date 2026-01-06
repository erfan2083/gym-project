// src/components/home/AIChatOverlay.js
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
  ActivityIndicator,
  StyleSheet as RNStyleSheet,
} from "react-native";
import { ms } from "react-native-size-matters";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "../../theme/colors";

import api from "../../../api/client";

const formatTimeFa = (ts) => {
  try {
    return new Date(ts).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "ساعت";
  }
};

const formatDateFa = (ts) => {
  try {
    return new Date(ts).toLocaleDateString("fa-IR");
  } catch {
    return "تاریخ";
  }
};

export default function AIChatOverlay({
  visible,
  onClose,
  bottomOffset = ms(120),
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const isMountedRef = useRef(true);

  // Reset state when overlay opens
  useEffect(() => {
    if (visible) {
      isMountedRef.current = true;
      setMessages([]);
      setChatStarted(false);
      setDraft("");
      setError(null);
    } else {
      isMountedRef.current = false;
    }
  }, [visible]);

  // Auto-scroll
  useEffect(() => {
    if (!visible) return;
    if (messages.length > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  }, [visible, messages.length]);

  // Start AI chat - send workout program
  const startChat = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log("🤖 Starting AI chat...");

      const { data } = await api.post("/api/ai-chat/start");

      if (!isMountedRef.current) return;

      if (data?.success && data?.message) {
        console.log("✅ AI chat started successfully");

        // Add AI's first message
        setMessages([
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.message,
            ts: Date.now(),
          },
        ]);

        setChatStarted(true);
      } else {
        throw new Error(data?.message || "خطا در دریافت پاسخ");
      }
    } catch (e) {
      console.error("❌ Start AI chat error:", e);
      if (!isMountedRef.current) return;

      const errorMsg =
        e.response?.data?.message ||
        e.message ||
        "خطا در برقراری ارتباط با هوش مصنوعی";

      setError(errorMsg);

      // Show error as a message
      setMessages([
        {
          id: `error-${Date.now()}`,
          sender: "system",
          text: errorMsg,
          ts: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    const text = String(draft || "").trim();
    if (!text || loading) return;

    const tempId = `temp-${Date.now()}`;

    // Add user message (optimistic)
    const userMessage = {
      id: tempId,
      sender: "user",
      text,
      ts: Date.now(),
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");

    // Prepare conversation history
    const conversationHistory = messages.map((m) => ({
      sender: m.sender === "user" ? "user" : "ai",
      text: m.text,
    }));

    setLoading(true);

    try {
      console.log("📤 Sending message to AI:", text);

      const { data } = await api.post("/api/ai-chat/message", {
        message: text,
        conversationHistory,
      });

      if (!isMountedRef.current) return;

      if (data?.success && data?.message) {
        console.log("✅ AI response received");

        // Update user message to confirmed
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false } : m))
        );

        // Add AI response
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.message,
            ts: Date.now(),
          },
        ]);
      } else {
        throw new Error(data?.message || "خطا در دریافت پاسخ");
      }
    } catch (e) {
      console.error("❌ Send AI message error:", e);
      if (!isMountedRef.current) return;

      const errorMsg =
        e.response?.data?.message ||
        e.message ||
        "خطا در ارسال پیام";

      // Mark user message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m
        )
      );

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "system",
          text: errorMsg,
          ts: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Retry failed message
  const retryMessage = (failedMsg) => {
    if (!failedMsg?.text) return;
    setMessages((prev) => prev.filter((x) => x.id !== failedMsg.id));
    setDraft(failedMsg.text);
  };

  const renderDatePill = () => {
    const label = messages?.length
      ? `${formatDateFa(messages[0].ts)} - ${formatTimeFa(messages[0].ts)}`
      : "تاریخ و ساعت";
    return (
      <View style={styles.datePill}>
        <Text style={styles.datePillText}>{label}</Text>
      </View>
    );
  };

  const renderBubble = (m, index) => {
    const isUser = m?.sender === "user";
    const isAI = m?.sender === "ai";
    const isSystem = m?.sender === "system";
    const isPending = m?.pending;
    const isFailed = m?.failed;
    const isError = m?.isError;

    let uniqueKey = `msg-${m.id}-${index}`;

    return (
      <Pressable
        key={uniqueKey}
        onLongPress={() => {
          if (isFailed) retryMessage(m);
        }}
        style={[
          styles.bubble,
          isUser && styles.bubbleUser,
          isAI && styles.bubbleAI,
          isSystem && styles.bubbleSystem,
          isPending && styles.bubblePending,
          isFailed && styles.bubbleFailed,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser && styles.bubbleTextUser,
            isAI && styles.bubbleTextAI,
            isSystem && styles.bubbleTextSystem,
          ]}
        >
          {m?.text || "پیام"}
        </Text>

        <View style={styles.bubbleFooter}>
          <Text
            style={[
              styles.bubbleTime,
              isUser && styles.bubbleTimeUser,
              isAI && styles.bubbleTimeAI,
            ]}
          >
            {formatTimeFa(m?.ts || Date.now())}
          </Text>

          {isUser && (
            <View style={styles.statusIcon}>
              {isPending ? (
                <Ionicons name="time-outline" size={ms(10)} color={COLORS.text2} />
              ) : isFailed ? (
                <Ionicons name="alert-circle" size={ms(10)} color="#ff6b6b" />
              ) : (
                <Ionicons name="checkmark-done" size={ms(10)} color={COLORS.primary} />
              )}
            </View>
          )}
        </View>

        {isFailed && (
          <Text style={styles.failedText}>خطا - لمس کنید برای ارسال مجدد</Text>
        )}
      </Pressable>
    );
  };

  if (!visible) return null;

  return (
    <View
      style={[
        styles.overlayWrap,
        { paddingBottom: bottomOffset },
      ]}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? bottomOffset : 0}
        style={styles.cardWrap}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={ms(22)} color={COLORS.primary} />
            </Pressable>

            <View style={styles.headerLine} />

            <Text style={styles.headerName} numberOfLines={1}>
              مربی هوش مصنوعی
            </Text>

            <View style={styles.avatarCircle}>
              <MaterialIcons name="smart-toy" size={ms(18)} color={COLORS.primary} />
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesWrap}
            keyboardShouldPersistTaps="handled"
          >
            {renderDatePill()}

            {!chatStarted && messages.length === 0 ? (
              <View style={styles.startChatWrap}>
                <MaterialIcons
                  name="smart-toy"
                  size={ms(64)}
                  color={COLORS.primary}
                />
                <Text style={styles.startChatTitle}>
                  چت با مربی هوش مصنوعی
                </Text>
                <Text style={styles.startChatDesc}>
                  برای شروع، روی دکمه زیر کلیک کنید تا برنامه تمرینی شما برای هوش
                  مصنوعی ارسال شود و نظر حرفه‌ای دریافت کنید.
                </Text>

                <Pressable
                  onPress={startChat}
                  disabled={loading}
                  style={[styles.startButton, loading && styles.startButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.text} />
                  ) : (
                    <>
                      <Ionicons name="play-circle" size={ms(24)} color={COLORS.text} />
                      <Text style={styles.startButtonText}>شروع گفتگو</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              (messages || []).map((m, index) => renderBubble(m, index))
            )}

            <View style={{ height: ms(10) }} />
          </ScrollView>

          {/* Input Row - Only show after chat started */}
          {chatStarted && (
            <View style={styles.inputRow}>
              <Pressable
                onPress={sendMessage}
                hitSlop={10}
                style={styles.sendBtn}
                disabled={loading || !draft.trim()}
              >
                <Ionicons
                  name="paper-plane-outline"
                  size={ms(22)}
                  color={loading || !draft.trim() ? COLORS.text2 : COLORS.primary}
                  style={{ transform: [{ rotate: "-20deg" }] }}
                />
              </Pressable>

              <View style={styles.inputPill}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="پیام خود را بنویسید..."
                  placeholderTextColor={COLORS.text2}
                  style={styles.input}
                  textAlign="right"
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                  editable={!loading}
                />
              </View>

              <View style={styles.aiIconWrap}>
                <MaterialIcons name="smart-toy" size={ms(20)} color={COLORS.primary} />
              </View>
            </View>
          )}
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
    marginTop: ms(10),
    marginBottom: ms(-115),
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: ms(34),
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerLine: {
    flex: 1,
    height: ms(1),
    backgroundColor: COLORS.primary,
    opacity: 0.9,
    marginHorizontal: ms(10),
  },
  headerName: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.primary,
    marginRight: ms(10),
  },
  avatarCircle: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(20),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
  },

  // Start Chat Screen
  startChatWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: ms(16),
    paddingHorizontal: ms(20),
  },
  startChatTitle: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(16),
    color: COLORS.primary,
    textAlign: "center",
  },
  startChatDesc: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(12),
    color: COLORS.white2,
    textAlign: "center",
    lineHeight: ms(20),
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(24),
    paddingVertical: ms(12),
    borderRadius: ms(24),
    marginTop: ms(10),
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.text,
  },

  // Messages
  messagesWrap: {
    paddingTop: ms(18),
    paddingBottom: ms(16),
    gap: ms(14),
  },

  datePill: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    paddingVertical: ms(6),
  },
  datePillText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(10),
    color: COLORS.white2,
    opacity: 0.9,
  },

  // Bubbles
  bubble: {
    maxWidth: "75%",
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#FBA768",
  },
  bubbleAI: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  bubbleSystem: {
    alignSelf: "center",
    backgroundColor: "rgba(255,107,107,0.3)",
  },
  bubblePending: {
    opacity: 0.6,
  },
  bubbleFailed: {
    backgroundColor: "rgba(255,107,107,0.4)",
    borderWidth: 1,
    borderColor: "#ff6b6b",
  },

  bubbleText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    lineHeight: ms(20),
  },
  bubbleTextUser: { color: COLORS.text },
  bubbleTextAI: { color: COLORS.text },
  bubbleTextSystem: { color: "#ff6b6b", textAlign: "center" },

  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: ms(6),
  },
  bubbleTime: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(9),
    opacity: 0.85,
  },
  bubbleTimeUser: { color: COLORS.text, textAlign: "left" },
  bubbleTimeAI: { color: COLORS.text, textAlign: "left" },

  statusIcon: {
    marginLeft: ms(6),
  },
  failedText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(8),
    color: "#ff6b6b",
    marginTop: ms(4),
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    paddingTop: ms(10),
  },
  sendBtn: { width: ms(28), alignItems: "center" },

  inputPill: {
    flex: 1,
    height: ms(46),
    borderRadius: ms(22),
    backgroundColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: ms(14),
    justifyContent: "center",
    marginBottom: ms(5),
  },
  input: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(15),
    color: COLORS.text,
    paddingVertical: 0,
  },

  aiIconWrap: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(22),
    backgroundColor: COLORS.inputBg2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ms(5),
  },
});