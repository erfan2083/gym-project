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
import { getSocket, isSocketConnected } from "../../../api/socket";

// AsyncStorage (اگر موجود نبود کرش نکن)
const safeGetAsyncStorage = () => {
  try {
    // eslint-disable-next-line global-require
    return require("@react-native-async-storage/async-storage");
  } catch {
    return null;
  }
};

const storageKeyForThread = (oderId) => `coach_chat_thread_${oderId}`;

// ✅ FIX: Always return a number for user ID
const getOtherUserId = (athlete) => {
  const rawId = athlete?.id ?? athlete?._id ?? athlete?.oderId ?? athlete?.user_id ?? athlete?.trainerId ?? athlete?.trainer_id ?? null;
  
  if (rawId === null || rawId === undefined) {
    return null;
  }
  
  // ✅ Convert to number
  const numId = Number(rawId);
  return isNaN(numId) ? null : numId;
};

const getAthleteName = (athlete) => {
  const full =
    athlete?.name ||
    athlete?.fullName ||
    athlete?.full_name ||
    athlete?.trainerName ||
    athlete?.trainer_name ||
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
}) {
  const otherUserId = useMemo(() => getOtherUserId(athlete), [athlete]);
  const athleteName = useMemo(() => getAthleteName(athlete), [athlete]);

  const AsyncStorage = safeGetAsyncStorage();

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const isMountedRef = useRef(true);

  const isUser = meSender === "athlete";

  // ---- helpers: map server message -> UI message ----
  const mapServerMessage = (m) => {
    if (!m) return null;
    
    const sid = Number(m?.sender_id);
    const other = Number(otherUserId);

    // ✅ تشخیص صحیح فرستنده
    const isFromOther = sid === other;
    
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
  };

  const canUseStorage = Boolean(AsyncStorage?.default || AsyncStorage);

  // 1) Load cached messages on open, then fetch history from server
  useEffect(() => {
    isMountedRef.current = true;

    const load = async () => {
      if (!visible) return;

      // Reset if no otherUserId
      if (!otherUserId) {
        console.log("❌ No otherUserId available for chat");
        setMessages([]);
        return;
      }

      console.log("📥 Loading chat with user ID:", otherUserId, "Type:", typeof otherUserId);

      // (A) Load local cache first (fast)
      if (canUseStorage) {
        try {
          const storage = AsyncStorage.default || AsyncStorage;
          const raw = await storage.getItem(storageKeyForThread(otherUserId));
          if (!isMountedRef.current) return;
          const parsed = raw ? JSON.parse(raw) : [];
          setMessages(Array.isArray(parsed) ? parsed : []);
        } catch {
          if (!isMountedRef.current) return;
          setMessages([]);
        }
      }

      // (B) Fetch server history
      try {
        setLoading(true);
        console.log(`📥 Fetching chat history with user ${otherUserId}...`);
        
        const { data } = await api.get(
          `/api/chat/history/${otherUserId}?limit=80`
        );

        if (!isMountedRef.current) return;

        const arr = Array.isArray(data) ? data : [];
        console.log(`📥 Received ${arr.length} messages`);
        
        const mapped = arr.map(mapServerMessage).filter(Boolean);
        
        // ✅ حذف duplicate ها
        const uniqueMessages = [];
        const seenIds = new Set();
        for (const msg of mapped) {
          const msgId = String(msg.serverId || msg.id);
          if (!seenIds.has(msgId)) {
            seenIds.add(msgId);
            uniqueMessages.push(msg);
          }
        }

        setMessages(uniqueMessages);
      } catch (e) {
        console.error("Error loading chat history:", e);
        // اگر history شکست خورد، همان cache لوکال نمایش داده می‌شود
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    load();
    
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, otherUserId, meSender]);

  // 2) Save to local storage whenever messages change (while visible)
  useEffect(() => {
    const save = async () => {
      if (!visible) return;
      if (!otherUserId) return;
      if (!canUseStorage) return;

      try {
        const storage = AsyncStorage.default || AsyncStorage;
        await storage.setItem(
          storageKeyForThread(otherUserId),
          JSON.stringify(messages || [])
        );
      } catch {
        // ignore
      }
    };
    save();
  }, [messages, visible, otherUserId, canUseStorage, AsyncStorage]);

  // 3) Auto-scroll
  useEffect(() => {
    if (!visible) return;
    if (messages.length > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  }, [visible, messages.length]);

  // 4) Socket listener for new messages
  useEffect(() => {
    let cleanup = null;

    if (!visible) return;
    if (!otherUserId) return;

    (async () => {
      try {
        const socket = await getSocket();
        socketRef.current = socket;

        const onNew = (m) => {
          if (!isMountedRef.current) return;
          
          const sid = Number(m?.sender_id);
          const rid = Number(m?.receiver_id);
          const other = Number(otherUserId);

          // فقط پیام‌هایی که بین من و otherUserId هستند
          if (sid !== other && rid !== other) return;

          console.log("📨 New message received:", m);

          const msg = mapServerMessage(m);
          if (!msg) return;

          setMessages((prev) => {
            const list = prev || [];
            // ✅ جلوگیری از duplicate
            const msgId = String(msg.serverId || msg.id);
            if (list.some((x) => String(x.serverId || x.id) === msgId)) {
              return list;
            }
            return [...list, msg];
          });
        };

        socket.on("chat:new", onNew);
        console.log("✅ Socket listener attached for chat");

        cleanup = () => {
          socket?.off("chat:new", onNew);
        };
      } catch (e) {
        console.error("Socket setup error:", e);
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
    if (!otherUserId) {
      console.error("❌ Cannot send: No otherUserId");
      return;
    }

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
        failed: false,
      },
    ]);
    setDraft("");

    try {
      let socket = socketRef.current;
      
      if (!socket || !socket.connected) {
        console.log("🔌 Socket not connected, getting new connection...");
        socket = await getSocket();
        socketRef.current = socket;
      }

      console.log(`📤 Sending message to ${otherUserId} (type: ${typeof otherUserId}): "${text}"`);

      socket.emit(
        "chat:send",
        { 
          receiverId: Number(otherUserId), // ✅ Always send as number
          content: text 
        },
        (ack) => {
          if (!isMountedRef.current) return;
          
          if (!ack?.ok || !ack?.message) {
            console.error("❌ Send failed:", ack?.error);
            setMessages((prev) =>
              (prev || []).map((x) =>
                x.id === tempId ? { ...x, pending: false, failed: true } : x
              )
            );
            return;
          }

          console.log("✅ Message sent successfully");
          const confirmed = mapServerMessage(ack.message);

          setMessages((prev) =>
            (prev || []).map((x) => (x.id === tempId ? { ...confirmed, pending: false } : x))
          );
        }
      );
    } catch (e) {
      console.error("❌ Send error:", e);
      if (!isMountedRef.current) return;
      
      setMessages((prev) =>
        (prev || []).map((x) =>
          x.id === tempId ? { ...x, pending: false, failed: true } : x
        )
      );
    }
  };

  // ✅ Retry failed message
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
    const isMe = m?.sender === meSender;
    const isPending = m?.pending;
    const isFailed = m?.failed;

    // ✅ کلید یونیک - استفاده از index به عنوان fallback
    const uniqueKey = m?.serverId 
      ? `server-${m.serverId}` 
      : m?.id 
        ? `local-${m.id}` 
        : `idx-${index}`;

    return (
      <Pressable
        key={uniqueKey}
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

  // ✅ Show warning if no trainer/athlete to chat with
  if (!otherUserId) {
    return (
      <View
        style={[
          styles.overlayWrap,
          isUser ? styles.overlayWrapUser : styles.overlayWrapCoach,
          { paddingBottom: bottomOffset },
        ]}
      >
        <Pressable
          style={[
            styles.backdrop,
            isUser ? styles.backdropUser : styles.backdropCoach,
          ]}
          onPress={onClose}
        />
        <View style={[styles.cardWrap, isUser ? styles.cardWrapUser : styles.cardWrapCoach]}>
          <View style={[styles.card, isUser ? styles.cardUser : styles.cardCoach]}>
            <View style={styles.headerRow}>
              <Pressable onPress={onClose} hitSlop={10} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={ms(22)} color={COLORS.primary} />
              </Pressable>
              <View style={styles.headerLine} />
              <Text style={styles.headerName}>چت</Text>
              <View style={styles.avatarCircle}>
                <FontAwesome5 name="user-alt" size={ms(16)} color={COLORS.primary} />
              </View>
            </View>
            
            <View style={styles.noTrainerWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={ms(48)} color={COLORS.text2} />
              <Text style={styles.noTrainerText}>
                {isUser 
                  ? "هنوز اشتراک فعالی با مربی ندارید"
                  : "شاگردی انتخاب نشده است"
                }
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

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
              (messages || []).map((m, index) => renderBubble(m, index))
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

  // ========= No Trainer State =========
  noTrainerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: ms(16),
  },
  noTrainerText: {
    fontFamily: "Vazirmatn_700Bold",
    fontSize: ms(14),
    color: COLORS.text2,
    textAlign: "center",
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