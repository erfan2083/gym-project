import pool from "../db/index.js";

// Create coach profile
export const createCoachProfile = async (req, res) => {
  const { userId, bio, specialties, experience_years, price_per_month } = req.body;

  if (!userId || !bio) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await pool.query(
      'CALL create_coach_profile($1, $2, $3, $4, $5)',
      [userId, bio, specialties, experience_years, price_per_month]
    );

    res.json({ message: "Coach profile created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update coach profile
export const updateCoachProfile = async (req, res) => {
  const { userId, bio, specialties, experience_years, price_per_month } = req.body;

  try {
    await pool.query(
      'CALL update_coach_profile($1, $2, $3, $4, $5)',
      [userId, bio, specialties, experience_years, price_per_month]
    );

    res.json({ message: "Coach profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all coaches
export const getCoaches = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM get_coaches()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
