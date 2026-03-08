const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');
const logger = require('../config/logger');

// Patient login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find patient by email
    const result = await pool.query(
      'SELECT patient_id, email, password_hash, first_name, last_name, phone, language_preference FROM patients WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    const patient = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, patient.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        patientId: patient.patient_id,
        email: patient.email,
        type: 'patient'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    logger.info(`Patient logged in: ${email}`);

    res.json({
      success: true,
      token,
      patient: {
        id: patient.patient_id,
        email: patient.email,
        name: `${patient.first_name} ${patient.last_name}`,
        phone: patient.phone,
        language: patient.language_preference
      }
    });
  } catch (error) {
    logger.error('Patient login error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get all patients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT patient_id, abha_id, first_name, last_name, age, gender, 
             phone, email, city, blood_group, language_preference
      FROM patients
    `;
    let params = [];
    
    if (search) {
      query += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR phone LIKE $1`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${params.length + 1} OFFSET ${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      patients: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get patient by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, 
              (SELECT json_agg(mh.*) FROM medical_history mh WHERE mh.patient_id = p.patient_id) as medical_history,
              (SELECT json_agg(a.*) FROM allergies a WHERE a.patient_id = p.patient_id) as allergies,
              (SELECT json_agg(cm.*) FROM current_medications cm WHERE cm.patient_id = p.patient_id AND cm.is_active = true) as medications
       FROM patients p
       WHERE p.patient_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get patient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new patient
router.post('/register', async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      date_of_birth, 
      gender, 
      phone, 
      email, 
      password,
      language_preference = 'en' 
    } = req.body;
    
    if (!first_name || !last_name || !date_of_birth || !gender || !phone || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const existingPatient = await pool.query(
      'SELECT patient_id FROM patients WHERE email = $1',
      [email]
    );

    if (existingPatient.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if phone already exists
    const existingPhone = await pool.query(
      'SELECT patient_id FROM patients WHERE phone = $1',
      [phone]
    );

    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    const age = new Date().getFullYear() - new Date(date_of_birth).getFullYear();
    
    const result = await pool.query(
      `INSERT INTO patients (first_name, last_name, date_of_birth, age, gender, phone, email, password_hash, language_preference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING patient_id, first_name, last_name, phone, email, language_preference`,
      [first_name, last_name, date_of_birth, age, gender, phone, email, password_hash, language_preference]
    );
    
    const patient = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        patientId: patient.patient_id,
        email: patient.email,
        type: 'patient'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    logger.info(`New patient registered: ${first_name} ${last_name} (${email})`);
    
    res.status(201).json({
      success: true,
      token,
      patient: {
        id: patient.patient_id,
        email: patient.email,
        name: `${patient.first_name} ${patient.last_name}`,
        phone: patient.phone,
        language: patient.language_preference
      }
    });
  } catch (error) {
    logger.error('Patient registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
