// src/components/home/CoachChatOverlay.js
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
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { COLORS } from "../../theme/colors";

// ✅ این دو مسیر را اگر لازم بود مطابق پروژه‌ات اصلاح کن:
import api from "../../../api/client";
import { getSocket } from "../../../api/socket";

// AsyncStorage (اگر موجود نبود کرش نکن)
const safeGetAsyncStorage = () => {
  try {
    // eslint-disable-next-line global-require
    return require("@react-native-async-storage/async-storage");
  } catch {
    return null;
  }
};

const storageKeyForThread = (threadId) => `coach_chat_thread_${threadId}`;

const getThreadId = (athlete) => {
  // برای اینکه هم coach هم client همیشه به یک thread برسند
  const id =
    athlete?.id ?? athlete?._id ?? athlete?.userId ?? athlete?.user_id ?? null;
  if (id) return String(id);

  const uname = athlete?.username ? String(athlete.username).trim() : "";
  if (uname) return `u:${uname}`;

  const phone = athlete?.phone ? String(athlete.phone).trim() : "";
  if (phone) return `p:${phone}`;

  return null;
};

const getOtherUserId = (athlete) =>
  athlete?.id ?? athlete?._id ?? athlete?.userId ?? athlete?.user_id ?? null;

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

  // ✅ فقط کنترلِ اینکه چت روی BottomTab/کیبورد به‌هم نریزد
  bottomOffset = ms(120),

  // ✅ برای حالت client: meSender="athlete"
  // برای حالت coach: meSender="coach" (پیش‌فرض)
  meSender = "coach",
}) {
  const threadId = useMemo(() => getThreadId(athlete), [athlete]);
  const otherUserId = useMemo(() => getOtherUserId(athlete), [athlete]);
  const athleteName = useMemo(() => getAthleteName(athlete), [athlete]);

  const AsyncStorage = safeGetAsyncStorage();

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);

  const scrollRef = useRef(null);

  const isUser = meSender === "athlete"; // ✅ نقش UI فقط با همین

  // ---- helpers: map server message -> UI message ----
  const mapServerMessage = (m) => {
    const sid = Number(m?.sender_id);
    const other = Number(otherUserId);

    return {
      id: String(m?.id),
      serverId: m?.id,
      sender_id: m?.sender_id,
      receiver_id: m?.receiver_id,
      sender: sid === other ? "athlete" : meSender,
      text: m?.content || "",
      ts: m?.sent_at ? new Date(m.sent_at).getTime() : Date.now(),
    };
  };

  const canUseStorage = Boolean(AsyncStorage?.default || AsyncStorage);

  // 1) Load cached messages on open, then fetch history from server
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!visible) return;

      // Reset if no thread
      if (!threadId) {
        setMessages([]);
        return;
      }

      // (A) Load local cache first (fast)
      if (canUseStorage) {
        try {
          const storage = AsyncStorage.default || AsyncStorage;
          const raw = await storage.getItem(storageKeyForThread(threadId));
          if (!mounted) return;
          const parsed = raw ? JSON.parse(raw) : [];
          setMessages(Array.isArray(parsed) ? parsed : []);
        } catch {
          if (!mounted) return;
          setMessages([]);
        }
      }

      // (B) Fetch server history
      if (!otherUserId) return;
      try {
        setLoading(true);
        const { data } = await api.get(
          `/api/chat/history/${otherUserId}?limit=80`
        );

        if (!mounted) return;

        const arr = Array.isArray(data) ? data : [];
        const mapped = arr.map(mapServerMessage);

        setMessages(mapped);
      } catch (e) {
        // اگر history شکست خورد، همان cache لوکال نمایش داده می‌شود
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, threadId, otherUserId, meSender]);

  // 2) Save to local storage whenever messages change (while visible)
  useEffect(() => {
    const save = async () => {
      if (!visible) return;
      if (!threadId) return;
      if (!canUseStorage) return;

      try {
        const storage = AsyncStorage.default || AsyncStorage;
        await storage.setItem(
          storageKeyForThread(threadId),
          JSON.stringify(messages || [])
        );
      } catch {
        // ignore
      }
    };
    save();
  }, [messages, visible, threadId, canUseStorage, AsyncStorage]);

  // 3) Auto-scroll
  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    });
  }, [visible, messages?.length]);

  // 4) Socket listener for new messages
  useEffect(() => {
    let socket;
    let cleanup = null;

    if (!visible) return;
    if (!otherUserId) return;

    (async () => {
      try {
        socket = await getSocket();

        const onNew = (m) => {
          const sid = Number(m?.sender_id);
          const rid = Number(m?.receiver_id);
          const other = Number(otherUserId);

          // فقط پیام‌هایی که بین من و otherUserId هستند
          if (![sid, rid].includes(other)) return;

          const msg = mapServerMessage(m);

          setMessages((prev) => {
            const list = prev || [];
            // جلوگیری از duplicate
            if (
              list.some(
                (x) =>
                  String(x.serverId || x.id) === String(msg.serverId || msg.id)
              )
            ) {
              return list;
            }
            return [...list, msg];
          });
        };

        socket.on("chat:new", onNew);

        cleanup = () => {
          socket?.off("chat:new", onNew);
        };
      } catch {
        // اگر سوکت وصل نشد، چت فقط با history کار می‌کند
      }
    })();

    return () => {
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, otherUserId, meSender]);

  // 5) Send message via socket (optimistic + ack)
  const send = async () => {
    const text = String(draft || "").trim();
    if (!text) return;
    if (!otherUserId) return;

    const tempId = `temp-${Date.now()}`;

    // optimistic
    setMessages((prev) => [
      ...(prev || []),
      {
        id: tempId,
        sender: meSender,
        text,
        ts: Date.now(),
        pending: true,
      },
    ]);
    setDraft("");

    try {
      const socket = await getSocket();
      socket.emit(
        "chat:send",
        { receiverId: otherUserId, content: text },
        (ack) => {
          if (!ack?.ok || !ack?.message) {
            setMessages((prev) =>
              (prev || []).map((x) =>
                x.id === tempId ? { ...x, pending: false, failed: true } : x
              )
            );
            return;
          }

          const confirmed = mapServerMessage(ack.message);

          setMessages((prev) =>
            (prev || []).map((x) => (x.id === tempId ? confirmed : x))
          );
        }
      );
    } catch {
      setMessages((prev) =>
        (prev || []).map((x) =>
          x.id === tempId ? { ...x, pending: false, failed: true } : x
        )
      );
    }
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

    return (
      <View
        key={String(m?.id)}
        style={[
          styles.bubble,
          isMe ? styles.bubbleCoach : styles.bubbleAthlete,
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

        <Text
          style={[
            styles.bubbleTime,
            isMe ? styles.bubbleTimeCoach : styles.bubbleTimeAthlete,
          ]}
        >
          {formatTimeFa(m?.ts || Date.now())}
        </Text>
      </View>
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

  // ========= Coach Variant (همان قبلی شما) =========
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

  // ========= User Variant (پایدارتر/بدون منفی) =========
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

  // ========= Rest (بدون تغییر) =========
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
  bubbleText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(12),
  },
  bubbleTextCoach: { color: COLORS.text },
  bubbleTextAthlete: { color: COLORS.text },

  bubbleTime: {
    marginTop: ms(6),
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(9),
    opacity: 0.85,
  },
  bubbleTimeCoach: { color: COLORS.text, textAlign: "left" },
  bubbleTimeAthlete: { color: COLORS.text, textAlign: "left" },

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
