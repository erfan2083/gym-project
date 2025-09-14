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

    db.execute('CALL LoginCustomer(?, ?)', [email, password], async (err, result) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).json({ message: 'Error during login', error: err });
        }

        const customer = result[0][0]; 
        const isMatch = await bcrypt.compare(password, customer.password);

        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        if (customer) {
            res.json({
              message: 'ورود موفقیت‌آمیز',
              token,
              user: {
                id: user.id,
                name: user.name,
                role: user.role
              }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    });
};
