import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const signup = async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `CALL signup_user($1, $2, $3, $4);`,
      [email, hashedPassword, name, role]
    );

    res.status(201).json({ message: 'ثبت‌نام با موفقیت انجام شد.' });

  } catch (err) {
    console.error(err);
    if (err.message.includes('duplicate')) {
      res.status(400).json({ error: 'ایمیل قبلاً استفاده شده است.' });
    } else {
      res.status(500).json({ error: 'خطا در ثبت‌نام.' });
    }
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userQuery = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'کاربر یافت نشد.' });
    }

    const user = userQuery.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'رمز عبور اشتباه است.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'ورود موفقیت‌آمیز',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطا در ورود.' });
  }
};
