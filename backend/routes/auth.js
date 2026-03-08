const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT staff_id, email, password_hash, role, first_name, last_name, facility_id, language_preference FROM staff WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.staff_id,
        email: user.email,
        role: user.role,
        facilityId: user.facility_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Log audit trail
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, details) VALUES ($1, $2, $3, $4)',
      [user.staff_id, user.role, 'LOGIN', JSON.stringify({ email, timestamp: new Date() })]
    );

    logger.info(`User logged in: ${email} (${user.role})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.staff_id,
        email: user.email,
        role: user.role,
        name: `${user.first_name} ${user.last_name}`,
        facilityId: user.facility_id,
        language: user.language_preference
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.staff_id, s.first_name, s.last_name, s.email, s.role, s.specialization, 
              s.phone, s.language_preference, f.name as facility_name
       FROM staff s
       LEFT JOIN facilities f ON s.facility_id = f.facility_id
       WHERE s.staff_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
