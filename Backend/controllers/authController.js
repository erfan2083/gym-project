import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const signup = async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `CALL "gym-project".sign_up($1, $2, $3, $4);`,
      [email, hashedPassword, name, role]
    );

    res.status(201).json({ message: 'ثبت‌ نام با موفقیت انجام شد.' });

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

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const result = await pool.query('CALL "gym-project".login_user($1, o_id => NULL, o_email => NULL, o_password_hash => NULL, o_full_name => NULL, o_role => NULL);', [email]);

    

    const user = result.rows[0]; 
    const isMatch = await bcrypt.compare(password, user.o_password_hash);

    if (isMatch) {
        const token = jwt.sign(
          { id: user.o_id, role: user.o_role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          message: 'ورود موفقیت‌آمیز',
          token,
          user: {
            id: user.o_id,
            name: user.o_full_name,
            role: user.o_role
          }
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};
