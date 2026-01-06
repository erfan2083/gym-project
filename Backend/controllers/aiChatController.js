import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from "../db/index.js";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * POST /api/ai-chat/start
 * شروع چت با AI و ارسال برنامه تمرینی کاربر
 */
export async function startAIChat(req, res) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // گرفتن برنامه تمرینی کاربر از دیتابیس
    const workoutQuery = `
      SELECT
        ws.week_start,
        sw.day_of_week,
        sw.sets_count,
        sw.reps_count,
        sw.notes,
        w.title as workout_name,
        w.description as workout_description
      FROM "gym-project".weeklyschedule ws
      LEFT JOIN "gym-project".scheduleworkout sw ON sw.schedule_id = ws.id
      LEFT JOIN "gym-project".workout w ON w.id = sw.workout_id
      WHERE ws.trainee_id = $1
      ORDER BY ws.week_start DESC, sw.day_of_week ASC
      LIMIT 50;
    `;

    const { rows } = await pool.query(workoutQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "هیچ برنامه تمرینی برای شما ثبت نشده است.",
      });
    }

    // ساختن متن برنامه تمرینی به فارسی
    const dayNames = [
      "شنبه",
      "یکشنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنجشنبه",
      "جمعه",
    ];

    let workoutText = "برنامه تمرینی شما:\n\n";

    // Group by week_start and day
    const workoutsByWeek = {};
    rows.forEach((row) => {
      const weekKey = row.week_start || "نامشخص";
      if (!workoutsByWeek[weekKey]) {
        workoutsByWeek[weekKey] = {};
      }

      const dayName = dayNames[row.day_of_week] || `روز ${row.day_of_week}`;
      if (!workoutsByWeek[weekKey][dayName]) {
        workoutsByWeek[weekKey][dayName] = [];
      }

      workoutsByWeek[weekKey][dayName].push({
        name: row.workout_name || "تمرین",
        description: row.workout_description || "",
        sets: row.sets_count,
        reps: row.reps_count,
        notes: row.notes || "",
      });
    });

    // ساختن متن
    Object.keys(workoutsByWeek).forEach((week) => {
      workoutText += `هفته شروع: ${week}\n`;
      Object.keys(workoutsByWeek[week]).forEach((day) => {
        workoutText += `\n${day}:\n`;
        workoutsByWeek[week][day].forEach((exercise, index) => {
          workoutText += `  ${index + 1}. ${exercise.name}`;
          if (exercise.sets) workoutText += ` - ${exercise.sets} ست`;
          if (exercise.reps) workoutText += ` × ${exercise.reps} تکرار`;
          if (exercise.description)
            workoutText += `\n     توضیحات: ${exercise.description}`;
          if (exercise.notes) workoutText += `\n     یادداشت: ${exercise.notes}`;
          workoutText += "\n";
        });
      });
      workoutText += "\n";
    });

    // ارسال به Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `شما یک مربی ورزشی حرفه‌ای و متخصص هستید. یک کاربر برنامه تمرینی زیر را از مربی خود دریافت کرده است:

${workoutText}

لطفاً به عنوان یک مربی حرفه‌ای، نظر خود را در مورد این برنامه تمرینی بدهید. به نکات زیر توجه کنید:
- تنوع تمرینات
- حجم تمرین (ست و تکرار)
- توازن بین گروه‌های عضلانی مختلف
- پیشنهادات برای بهبود
- نکات ایمنی و اجرای صحیح

لطفاً پاسخ خود را به زبان فارسی و با لحنی دوستانه و حرفه‌ای بنویسید.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiMessage = response.text();

    res.json({
      success: true,
      message: aiMessage,
      workoutProgram: workoutText,
    });
  } catch (error) {
    console.error("AI Chat Start Error:", error);
    res.status(500).json({
      message: "خطا در برقراری ارتباط با هوش مصنوعی",
      error: error.message,
    });
  }
}

/**
 * POST /api/ai-chat/message
 * ارسال پیام به AI
 */
export async function sendAIMessage(req, res) {
  const userId = req.user?.id;
  const { message, conversationHistory } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "پیام الزامی است" });
  }

  try {
    // گرفتن برنامه تمرینی کاربر (برای context)
    const workoutQuery = `
      SELECT
        ws.week_start,
        sw.day_of_week,
        sw.sets_count,
        sw.reps_count,
        sw.notes,
        w.title as workout_name,
        w.description as workout_description
      FROM "gym-project".weeklyschedule ws
      LEFT JOIN "gym-project".scheduleworkout sw ON sw.schedule_id = ws.id
      LEFT JOIN "gym-project".workout w ON w.id = sw.workout_id
      WHERE ws.trainee_id = $1
      ORDER BY ws.week_start DESC, sw.day_of_week ASC
      LIMIT 50;
    `;

    const { rows } = await pool.query(workoutQuery, [userId]);

    const dayNames = [
      "شنبه",
      "یکشنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنجشنبه",
      "جمعه",
    ];

    let workoutContext = "برنامه تمرینی کاربر:\n\n";

    if (rows.length > 0) {
      const workoutsByWeek = {};
      rows.forEach((row) => {
        const weekKey = row.week_start || "نامشخص";
        if (!workoutsByWeek[weekKey]) {
          workoutsByWeek[weekKey] = {};
        }

        const dayName = dayNames[row.day_of_week] || `روز ${row.day_of_week}`;
        if (!workoutsByWeek[weekKey][dayName]) {
          workoutsByWeek[weekKey][dayName] = [];
        }

        workoutsByWeek[weekKey][dayName].push({
          name: row.workout_name || "تمرین",
          sets: row.sets_count,
          reps: row.reps_count,
          notes: row.notes || "",
        });
      });

      Object.keys(workoutsByWeek).forEach((week) => {
        workoutContext += `هفته ${week}:\n`;
        Object.keys(workoutsByWeek[week]).forEach((day) => {
          workoutContext += `${day}: `;
          const exercises = workoutsByWeek[week][day]
            .map((ex) => {
              let txt = ex.name;
              if (ex.sets) txt += ` (${ex.sets}×${ex.reps || "؟"})`;
              return txt;
            })
            .join(", ");
          workoutContext += exercises + "\n";
        });
      });
    } else {
      workoutContext += "هیچ برنامه تمرینی ثبت نشده است.\n";
    }

    // ارسال به Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Build conversation context
    let conversationContext = "";
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg) => {
        if (msg.sender === "user") {
          conversationContext += `کاربر: ${msg.text}\n`;
        } else if (msg.sender === "ai") {
          conversationContext += `مربی AI: ${msg.text}\n`;
        }
      });
    }

    const prompt = `شما یک مربی ورزشی حرفه‌ای و متخصص هستید که در حال مشاوره با یک کاربر هستید.

${workoutContext}

${conversationContext ? `تاریخچه مکالمه:\n${conversationContext}\n` : ""}

سوال جدید کاربر: ${message}

لطفاً به عنوان یک مربی حرفه‌ای، به سوال کاربر پاسخ دهید. پاسخ شما باید:
- مرتبط با برنامه تمرینی کاربر باشد
- دوستانه و حرفه‌ای باشد
- به زبان فارسی باشد
- مفید و کاربردی باشد
- در صورت لزوم، نکات ایمنی را یادآوری کند

پاسخ:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiMessage = response.text();

    res.json({
      success: true,
      message: aiMessage,
    });
  } catch (error) {
    console.error("AI Message Error:", error);
    res.status(500).json({
      message: "خطا در برقراری ارتباط با هوش مصنوعی",
      error: error.message,
    });
  }
}