// src/components/home/CoachChatOverlay.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { COLORS } from "../../theme/colors";

// ✅ API imports
import api from "../../../api/client";
import { getSocket } from "../../../api/socket";

// AsyncStorage
let AsyncStorageModule = null;
try {
  AsyncStorageModule = require("@react-native-async-storage/async-storage").default;
} catch {
  AsyncStorageModule = null;
}

const storageKeyForThread = (oderId) => `coach_chat_thread_${oderId}`;

const getOtherUserId = (athlete) =>
  athlete?.id ?? athlete?._id ?? athlete?.oderId ?? athlete?.user_id ?? athlete?.trainerId ?? null;

const getAthleteName = (athlete) => {
  const full =
    athlete?.name ||
    athlete?.fullName ||
    athlete?.full_name ||
    athlete?.username ||
    "";
  return String(full).trim() || "نام کاربر";
};

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

export default function CoachChatOverlay({
  visible,
  athlete,
  onClose,
  coachName = "نام مربی",
  bottomOffset = ms(120),
  meSender = "coach",
  currentUserId = null,
}) {
  const otherUserId = useMemo(() => getOtherUserId(athlete), [athlete]);
  const athleteName = useMemo(() => getAthleteName(athlete), [athlete]);

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);

  const scrollRef = useRef(null);
  const isMountedRef = useRef(true);
  const socketRef = useRef(null);

  const isUser = meSender === "athlete";

  // ✅ تشخیص صحیح فرستنده
  const mapServerMessage = useCallback((m) => {
    if (!m) return null;
    
    const senderId = Number(m?.sender_id);
    const oderId = Number(otherUserId);
    
    // اگر فرستنده = طرف مقابل، پس پیام از "طرف مقابل" است
    const isFromOther = senderId === oderId;
    
    // تعیین sender بر اساس نقش
    let sender;
    if (meSender === "coach") {
      sender = isFromOther ? "athlete" : "coach";
    } else {
      sender = isFromOther ? "coach" : "athlete";
    }

    return {
      id: String(m?.id || `msg-${Date.now()}-${Math.random()}`),
      serverId: m?.id,
      sender_id: m?.sender_id,
      receiver_id: m?.receiver_id,
      sender: sender,
      text: m?.content || "",
      ts: m?.sent_at ? new Date(m.sent_at).getTime() : Date.now(),
      pending: false,
      failed: false,
    };
  }, [otherUserId, meSender]);

  // ✅ بارگذاری تاریخچه از سرور
  const loadChatHistory = useCallback(async () => {
    if (!otherUserId) {
      console.log("❌ loadChatHistory: No otherUserId");
      return;
    }

    try {
      setLoading(true);
      console.log(`📥 Loading chat history with user ${otherUserId}...`);

      const response = await api.get(`/api/chat/history/${otherUserId}`);
      
      if (!isMountedRef.current) return;

      const serverMessages = response.data || [];
      console.log(`📥 Received ${serverMessages.length} messages`);

      const mappedMessages = serverMessages
        .map(mapServerMessage)
        .filter(Boolean)
        .sort((a, b) => a.ts - b.ts);

      setMessages(mappedMessages);

      // کش کردن
      if (AsyncStorageModule && otherUserId) {
        try {
          await AsyncStorageModule.setItem(
            storageKeyForThread(otherUserId),
            JSON.stringify(mappedMessages)
          );
        } catch (e) {
          console.warn("Cache save failed:", e);
        }
      }
    } catch (err) {
      console.error("❌ Error loading chat history:", err);
      
      if (!isMountedRef.current) return;

      // بارگذاری از کش در صورت خطا
      if (AsyncStorageModule && otherUserId) {
        try {
          const cached = await AsyncStorageModule.getItem(storageKeyForThread(otherUserId));
          if (cached) {
            const cachedMessages = JSON.parse(cached);
            setMessages(cachedMessages);
            console.log("📦 Loaded from cache");
          }
        } catch (e) {
          console.warn("Cache load failed:", e);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [otherUserId, mapServerMessage]);

  // ✅ بارگذاری تاریخچه + سوکت
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!visible || !otherUserId) return;

    let cleanupCalled = false;

    const initialize = async () => {
      // اول تاریخچه را بارگذاری کن
      await loadChatHistory();

      if (cleanupCalled) return;

      // بعد سوکت را راه‌اندازی کن
      try {
        const socket = await getSocket();
        socketRef.current = socket;
        
        if (cleanupCalled || !isMountedRef.current) return;

        const onNewMessage = (m) => {
          if (!isMountedRef.current) return;

          const sid = Number(m?.sender_id);
          const rid = Number(m?.receiver_id);
          const other = Number(otherUserId);

          // فقط پیام‌هایی که مربوط به این چت هستند
          if (sid !== other && rid !== other) return;

          console.log("📨 New message received:", m);

          const msg = mapServerMessage(m);
          if (!msg) return;

          setMessages((prev) => {
            const list = prev || [];
            // جلوگیری از duplicate
            const msgId = String(msg.serverId || msg.id);
            if (list.some((x) => String(x.serverId || x.id) === msgId)) {
              return list;
            }
            return [...list, msg].sort((a, b) => a.ts - b.ts);
          });
        };

        socket.on("chat:new", onNewMessage);

        console.log("✅ Socket listener attached");

        // ذخیره cleanup
        socketRef.current._chatHandler = onNewMessage;
      } catch (error) {
        console.error("❌ Socket setup error:", error);
      }
    };

    initialize();

    return () => {
      cleanupCalled = true;
      isMountedRef.current = false;
      
      // cleanup socket listener
      if (socketRef.current && socketRef.current._chatHandler) {
        socketRef.current.off("chat:new", socketRef.current._chatHandler);
        socketRef.current._chatHandler = null;
      }
    };
  }, [visible, otherUserId, loadChatHistory, mapServerMessage]);

  // اسکرول به پایین
  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ✅ ارسال پیام - اصلاح شده
  const send = async () => {
    const text = String(draft || "").trim();
    if (!text) return;
    if (!otherUserId) {
      console.error("❌ Cannot send: No otherUserId");
      return;
    }

    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    setMessages((prev) => [
      ...(prev || []),
      {
        id: tempId,
        sender: meSender,
        text,
        ts: Date.now(),
        pending: true,
        failed: false,
      },
    ]);
    setDraft("");

    try {
      // ✅ اول سعی کن از سوکت بفرستی
      let socket = socketRef.current;
      
      if (!socket || !socket.connected) {
        console.log("🔌 Socket not connected, getting new connection...");
        socket = await getSocket();
        socketRef.current = socket;
      }

      console.log(`📤 Sending message to ${otherUserId}: "${text}"`);

      // ✅ استفاده از Promise برای مدیریت بهتر
      const sendPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Send timeout"));
        }, 10000);

        socket.emit(
          "chat:send",
          { receiverId: Number(otherUserId), content: text },
          (ack) => {
            clearTimeout(timeout);
            if (ack?.ok && ack?.message) {
              resolve(ack);
            } else {
              reject(new Error(ack?.error || "Send failed"));
            }
          }
        );
      });

      const ack = await sendPromise;
      
      if (!isMountedRef.current) return;

      // موفقیت
      const confirmed = mapServerMessage(ack.message);
      setMessages((prev) =>
        (prev || []).map((x) => (x.id === tempId ? { ...confirmed, pending: false } : x))
      );
      console.log("✅ Message sent successfully");

    } catch (err) {
      console.error("❌ Socket send failed, trying REST API:", err.message);

      // ✅ Fallback به REST API
      try {
        const response = await api.post("/api/chat/send", {
          receiverId: Number(otherUserId),
          content: text,
        });

        if (!isMountedRef.current) return;

        if (response.data?.ok && response.data?.message) {
          const confirmed = mapServerMessage(response.data.message);
          setMessages((prev) =>
            (prev || []).map((x) => (x.id === tempId ? { ...confirmed, pending: false } : x))
          );
          console.log("✅ Message sent via REST API");
        } else {
          throw new Error("REST API failed");
        }
      } catch (restErr) {
        console.error("❌ REST API also failed:", restErr);
        
        if (!isMountedRef.current) return;
        
        setMessages((prev) =>
          (prev || []).map((x) =>
            x.id === tempId ? { ...x, pending: false, failed: true } : x
          )
        );
      }
    }
  };

  // تلاش مجدد
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

  const renderBubble = (m) => {
    const isMe = m?.sender === meSender;
    const isPending = m?.pending;
    const isFailed = m?.failed;

    return (
      <Pressable
        key={String(m?.id)}
        onLongPress={() => {
          if (isFailed) retryMessage(m);
        }}
        style={[
          styles.bubble,
          isMe ? styles.bubbleCoach : styles.bubbleAthlete,
          isPending && styles.bubblePending,
          isFailed && styles.bubbleFailed,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isMe ? styles.bubbleTextCoach : styles.bubbleTextAthlete,
          ]}
          numberOfLines={10}
        >
          {m?.text || (isMe ? coachName : athleteName)}
        </Text>

        <View style={styles.bubbleFooter}>
          <Text
            style={[
              styles.bubbleTime,
              isMe ? styles.bubbleTimeCoach : styles.bubbleTimeAthlete,
            ]}
          >
            {formatTimeFa(m?.ts || Date.now())}
          </Text>

          {isMe && (
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
          <Text style={styles.failedText}>خطا - لمس کنید</Text>
        )}
      </Pressable>
    );
  };

  if (!visible) return null;

  return (
    <View
      style={[
        styles.overlayWrap,
        isUser ? styles.overlayWrapUser : styles.overlayWrapCoach,
        { paddingBottom: bottomOffset },
      ]}
    >
      {/* Backdrop */}
      <Pressable
        style={[
          styles.backdrop,
          isUser ? styles.backdropUser : styles.backdropCoach,
        ]}
        onPress={onClose}
      />

      {/* Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? bottomOffset : 0}
        style={[
          styles.cardWrap,
          isUser ? styles.cardWrapUser : styles.cardWrapCoach,
        ]}
      >
        <View style={[styles.card, isUser ? styles.cardUser : styles.cardCoach]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={ms(22)} color={COLORS.primary} />
            </Pressable>

            <View style={styles.headerLine} />

            <Text style={styles.headerName} numberOfLines={1}>
              {athleteName}
            </Text>

            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user-alt" size={ms(16)} color={COLORS.primary} />
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

            {loading ? (
              <Text style={styles.loadingText}>در حال بارگذاری...</Text>
            ) : messages.length === 0 ? (
              <Text style={styles.emptyText}>هنوز پیامی وجود ندارد</Text>
            ) : (
              (messages || []).map(renderBubble)
            )}

            <View style={{ height: ms(10) }} />
          </ScrollView>

          {/* Input Row */}
          <View style={styles.inputRow}>
            <Pressable onPress={send} hitSlop={10} style={styles.sendBtn}>
              <Ionicons
                name="paper-plane-outline"
                size={ms(22)}
                color={COLORS.primary}
                style={{ transform: [{ rotate: "-20deg" }] }}
              />
            </Pressable>

            <View style={styles.inputPill}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="message"
                placeholderTextColor={COLORS.text2}
                style={styles.input}
                textAlign="left"
                onSubmitEditing={send}
                returnKeyType="send"
              />
            </View>

            <Pressable onPress={() => {}} hitSlop={10} style={styles.micBtn}>
              <Ionicons name="mic" size={ms(20)} color={COLORS.text} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ========= Base (مشترک) =========
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
  },

  cardWrap: { width: "100%" },

  card: {
    flex: 1,
    backgroundColor: COLORS.chatbg,
    overflow: "hidden",
    borderRadius: ms(22),
    paddingHorizontal: ms(18),
    paddingTop: ms(16),
    paddingBottom: ms(12),
  },

  // ========= Coach Variant =========
  overlayWrapCoach: {
    justifyContent: "flex-end",
  },
  backdropCoach: {
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cardWrapCoach: {
    height: "100%",
  },
  cardCoach: {
    marginTop: ms(100),
    marginBottom: ms(-20),
  },

  // ========= User Variant =========
  overlayWrapUser: {
    justifyContent: "flex-end",
  },
  backdropUser: {
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cardWrapUser: {
    height: "90%",
  },
  cardUser: {
    marginTop: ms(10),
    marginBottom: ms(-115),
  },

  // ========= Header =========
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

  // ========= Messages =========
  messagesWrap: {
    paddingTop: ms(18),
    paddingBottom: ms(16),
    gap: ms(14),
  },
  loadingText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text2,
    textAlign: "center",
    marginTop: ms(10),
  },
  emptyText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
    color: COLORS.text2,
    textAlign: "center",
    marginTop: ms(30),
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

  // ========= Bubbles =========
  bubble: {
    maxWidth: "70%",
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
  },
  bubbleCoach: {
    alignSelf: "flex-end",
    backgroundColor: "#FBA768",
  },
  bubbleAthlete: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.55)",
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
  },
  bubbleTextCoach: { color: COLORS.text },
  bubbleTextAthlete: { color: COLORS.text },

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
  bubbleTimeCoach: { color: COLORS.text, textAlign: "left" },
  bubbleTimeAthlete: { color: COLORS.text, textAlign: "left" },

  statusIcon: {
    marginLeft: ms(6),
  },
  failedText: {
    fontFamily: "Vazirmatn_400Regular",
    fontSize: ms(8),
    color: "#ff6b6b",
    marginTop: ms(4),
  },

  // ========= Input =========
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

  micBtn: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(22),
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ms(5),
  },
});