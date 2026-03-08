const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');
const logger = require('../config/logger');

// Get dashboard data by role
router.get('/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    
    let data = {};
    
    if (role === 'admin') {
      const facilities = await pool.query('SELECT COUNT(*) as count FROM facilities');
      const patients = await pool.query('SELECT COUNT(*) as count FROM patients');
      const staff = await pool.query('SELECT COUNT(*) as count FROM staff');
      const appointments = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE status = $1', ['scheduled']);
      
      data = {
        facilities_count: parseInt(facilities.rows[0].count),
        patients_count: parseInt(patients.rows[0].count),
        staff_count: parseInt(staff.rows[0].count),
        scheduled_appointments: parseInt(appointments.rows[0].count)
      };
    } else if (role === 'clinician') {
      const appointments = await pool.query(
        'SELECT COUNT(*) as count FROM appointments WHERE clinician_id = $1 AND status = $2',
        [req.user.userId, 'scheduled']
      );
      
      data = {
        my_appointments: parseInt(appointments.rows[0].count),
        queue_length: Math.floor(Math.random() * 10) + 5
      };
    } else if (role === 'patient') {
      // Use patientId from token if available, otherwise userId
      const patientId = req.user.patientId || req.user.userId;
      
      const appointments = await pool.query(
        'SELECT * FROM appointments WHERE patient_id = $1 AND status = \'scheduled\' ORDER BY scheduled_time ASC LIMIT 5',
        [patientId]
      );
      
      const allAppointments = await pool.query(
        'SELECT COUNT(*) as count FROM appointments WHERE patient_id = $1 AND status = \'scheduled\'',
        [patientId]
      );

      const medicalRecords = await pool.query(
        'SELECT COUNT(*) as count FROM clinical_encounters WHERE patient_id = $1',
        [patientId]
      );

      const prescriptions = await pool.query(
        'SELECT COUNT(*) as count FROM current_medications WHERE patient_id = $1 AND is_active = true',
        [patientId]
      );
      
      data = {
        upcoming_appointments: appointments.rows,
        appointments_count: parseInt(allAppointments.rows[0].count),
        medical_records_count: parseInt(medicalRecords.rows[0].count),
        prescriptions_count: parseInt(prescriptions.rows[0].count),
        metrics_count: 0 // Placeholder for now
      };
    }
    
    res.json({
      success: true,
      role,
      data
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
