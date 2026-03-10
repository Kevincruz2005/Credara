const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

async function register(req, res) {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Name, phone, and password are required' });
    }

    // Check if phone already exists
    const existing = await db.query('SELECT id FROM workers WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Phone number already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO workers (name, phone, password_hash) VALUES ($1, $2, $3) RETURNING id, name, phone',
      [name, phone, password_hash]
    );
    const worker = result.rows[0];

    const token = jwt.sign({ id: worker.id, phone: worker.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { token, worker } });
  } catch (err) {
    console.error('[authController] register error:', err.message);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'Phone and password are required' });
    }

    const result = await db.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const worker = result.rows[0];
    const valid = await bcrypt.compare(password, worker.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: worker.id, phone: worker.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, worker: { id: worker.id, name: worker.name, phone: worker.phone, id_verified: worker.id_verified } } });
  } catch (err) {
    console.error('[authController] login error:', err.message);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
}

module.exports = { register, login };
