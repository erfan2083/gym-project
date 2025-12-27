// Backend/controllers/clientController.js
import pool from "../db/index.js";

/**
 * GET /api/user/schedule/week?weekStart=YYYY-MM-DD
 * Client gets their own weekly schedule (READ-ONLY)
 */
export const getMyWeekSchedule = async (req, res) => {
  const traineeId = req.user?.id;
  const { weekStart } = req.query;

  if (!traineeId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!weekStart) {
    return res.status(400).json({ message: "weekStart is required" });
  }

  try {
    // Get the weekly schedule for this client
    const { rows } = await pool.query(
      `
      SELECT
        ws.id AS schedule_id,
        sw.id AS item_id,
        sw.day_of_week,
        sw.sets_count,
        sw.reps_count,
        sw.notes,
        w.id AS workout_id,
        w.title AS workout_title,
        w.description AS workout_description,
        w.video_url AS workout_video_url,
        w.created_by
      FROM "gym-project".weeklyschedule ws
      LEFT JOIN "gym-project".scheduleworkout sw ON sw.schedule_id = ws.id
      LEFT JOIN "gym-project".workout w ON w.id = sw.workout_id
      WHERE ws.trainee_id = $1
        AND ws.week_start = $2
      ORDER BY sw.day_of_week ASC, sw.id ASC
      `,
      [traineeId, weekStart]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMyWeekSchedule error:", err);
    return res.status(500).json({ message: "خطا در دریافت برنامه هفته" });
  }
};

/**
 * GET /api/user/my-trainer
 * Get the client's active trainer (from their active subscription)
 */
export const getMyTrainer = async (req, res) => {
  const traineeId = req.user?.id;

  if (!traineeId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get the trainer from the client's most recent active subscription
    const { rows } = await pool.query(
      `
      SELECT DISTINCT ON (u.id)
        u.id AS trainer_id,
        u.full_name AS trainer_name,
        u.avatar_url AS trainer_avatar,
        tp.username AS trainer_username,
        p.title AS plan_title,
        s.end_date
      FROM "gym-project"."subscription" s
      JOIN "gym-project"."plan" p ON p.id = s.plan_id
      JOIN "gym-project"."User" u ON u.id = p.trainer_id
      LEFT JOIN "gym-project".trainerprofile tp ON tp.user_id = u.id
      WHERE s.trainee_id = $1
        AND COALESCE(s.is_active, TRUE) = TRUE
        AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
      ORDER BY u.id, s.end_date DESC NULLS LAST
      LIMIT 1
      `,
      [traineeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "شما هنوز اشتراک فعالی ندارید",
        trainer: null 
      });
    }

    const trainer = rows[0];

    return res.json({
      trainerId: trainer.trainer_id,
      trainerName: trainer.trainer_name || trainer.trainer_username || "مربی",
      trainerAvatar: trainer.trainer_avatar,
      trainerUsername: trainer.trainer_username,
      planTitle: trainer.plan_title,
      endDate: trainer.end_date,
    });
  } catch (err) {
    console.error("getMyTrainer error:", err);
    return res.status(500).json({ message: "خطا در دریافت اطلاعات مربی" });
  }
};

/**
 * GET /api/user/my-trainers
 * Get ALL trainers the client has active subscriptions with
 */
export const getMyTrainers = async (req, res) => {
  const traineeId = req.user?.id;

  if (!traineeId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT
        u.id AS trainer_id,
        u.full_name AS trainer_name,
        u.avatar_url AS trainer_avatar,
        tp.username AS trainer_username,
        MAX(s.end_date) AS latest_end_date
      FROM "gym-project"."subscription" s
      JOIN "gym-project"."plan" p ON p.id = s.plan_id
      JOIN "gym-project"."User" u ON u.id = p.trainer_id
      LEFT JOIN "gym-project".trainerprofile tp ON tp.user_id = u.id
      WHERE s.trainee_id = $1
        AND COALESCE(s.is_active, TRUE) = TRUE
        AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
      GROUP BY u.id, u.full_name, u.avatar_url, tp.username
      ORDER BY latest_end_date DESC NULLS LAST
      `,
      [traineeId]
    );

    const trainers = rows.map((t) => ({
      id: t.trainer_id,
      name: t.trainer_name || t.trainer_username || "مربی",
      avatarUrl: t.trainer_avatar,
      username: t.trainer_username,
      latestEndDate: t.latest_end_date,
    }));

    return res.json(trainers);
  } catch (err) {
    console.error("getMyTrainers error:", err);
    return res.status(500).json({ message: "خطا در دریافت لیست مربی‌ها" });
  }
};