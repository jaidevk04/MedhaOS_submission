const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');
const logger = require('../config/logger');

// Test endpoint
router.get('/test', (req, res) => res.json({ msg: 'Appointments API is working' }));

// Start consultation from appointment
router.post('/:id/start-consultation', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const appointmentId = req.params.id;
    const clinicianId = req.user.id; // From auth token

    await client.query('BEGIN');

    // 1. Get Appointment Details
    const apptResult = await client.query(`
      SELECT a.*, p.first_name, p.last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.appointment_id = $1
    `, [appointmentId]);

    if (apptResult.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    const appt = apptResult.rows[0];

    // 2. Check if encounter already exists for today/this appointment
    // Note: Schema doesn't strictly link appointment to encounter, so we check by patient+clinician+date
    const encounterCheck = await client.query(`
      SELECT encounter_id FROM clinical_encounters 
      WHERE patient_id = $1 
      AND clinician_id = $2 
      AND created_at::date = CURRENT_DATE
      AND status = 'in_progress'
    `, [appt.patient_id, clinicianId]); 

    let encounterId;

    if (encounterCheck.rows.length > 0) {
      encounterId = encounterCheck.rows[0].encounter_id;
    } else {
      // 3. Create new encounter
      // Fetch latest triage data if available
      const triageRes = await client.query(`
        SELECT * FROM triage_sessions 
        WHERE patient_id = $1 
        ORDER BY completed_at DESC LIMIT 1
      `, [appt.patient_id]);

      let triageData = {};
      let urgencyScore = appt.urgency_score || 0;
      let symptoms = [];

      if (triageRes.rows.length > 0) {
        const triage = triageRes.rows[0];
        triageData = triage.triage_result || {};
        urgencyScore = triage.urgency_score || urgencyScore;
        symptoms = triage.symptoms || [];
      }

      const insertRes = await client.query(`
        INSERT INTO clinical_encounters (
          patient_id, facility_id, clinician_id, encounter_type,
          urgency_score, chief_complaint, symptoms, triage_data,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'in_progress', NOW())
        RETURNING encounter_id
      `, [
        appt.patient_id,
        appt.facility_id,
        clinicianId, 
        'OPD', 
        urgencyScore,
        appt.notes || 'Scheduled Consultation', 
        symptoms,
        triageData
      ]);
      
      encounterId = insertRes.rows[0].encounter_id;

      // 4. Update Appointment Status
      await client.query(`
        UPDATE appointments 
        SET status = 'in-progress', actual_start_time = NOW() 
        WHERE appointment_id = $1
      `, [appointmentId]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      encounterId: encounterId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Start consultation error:', error);
    res.status(500).json({ error: 'Failed to start consultation: ' + error.message });
  } finally {
    client.release();
  }
});

// Get appointments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, status, date } = req.query;
    
    let query = `
      SELECT a.*, p.first_name || ' ' || p.last_name as patient_name,
             p.date_of_birth as patient_dob,
             p.age as patient_age,
             p.gender as patient_gender,
             p.phone as patient_phone,
             s.first_name || ' ' || s.last_name as doctor_name,
             f.name as facility_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN staff s ON a.clinician_id = s.staff_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE 1=1
    `;
    let params = [];
    
    if (patient_id) {
      params.push(patient_id);
      query += ` AND a.patient_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND a.scheduled_time::date = $${params.length}`;
    }
    
    query += ` ORDER BY a.scheduled_time ASC LIMIT 50`;
    
    logger.info(`Fetching appointments query params: ${JSON.stringify(params)}`);
    const result = await pool.query(query, params);
    logger.info(`Found ${result.rows.length} appointments`);
    
    res.json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Book appointment
router.post('/book', async (req, res) => {
  try {
    const { 
      patient_id, 
      patient_name, 
      patient_phone,
      patient_email,
      facility_id, 
      clinician_id, 
      appointment_type, 
      specialty, 
      scheduled_time, 
      urgency_score,
      notes,
      triage_data
    } = req.body;
    
    if (!scheduled_time || !specialty) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If no patient_id, this is a guest booking - create a temporary patient record
    let actualPatientId = patient_id;
    
    if (!patient_id && patient_name && patient_phone) {
      // Check if patient exists by phone
      const existingPatient = await pool.query(
        'SELECT patient_id FROM patients WHERE phone = $1',
        [patient_phone]
      );

      if (existingPatient.rows.length > 0) {
        actualPatientId = existingPatient.rows[0].patient_id;
      } else {
        // Create guest patient record
        const newPatient = await pool.query(
          `INSERT INTO patients (first_name, last_name, phone, email, date_of_birth, age, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING patient_id`,
          [
            patient_name.split(' ')[0] || 'Guest',
            patient_name.split(' ').slice(1).join(' ') || 'Patient',
            patient_phone,
            patient_email,
            '1990-01-01', // Default DOB for guest
            30,
            'other'
          ]
        );
        actualPatientId = newPatient.rows[0].patient_id;
      }
    }

    if (!actualPatientId) {
      return res.status(400).json({ error: 'Patient information required' });
    }

    // Get a default facility if not provided
    let defaultFacility = facility_id;
    
    if (!defaultFacility) {
      // Try to find an existing facility
      const facilityResult = await pool.query('SELECT facility_id FROM facilities LIMIT 1');
      if (facilityResult.rows.length > 0) {
        defaultFacility = facilityResult.rows[0].facility_id;
      } else {
        // Fallback to hardcoded if no facilities exist (this might still fail FK check but it's a last resort)
        defaultFacility = '11111111-1111-1111-1111-111111111111';
      }
    }
    
    const result = await pool.query(
      `INSERT INTO appointments (
        patient_id, facility_id, clinician_id, appointment_type, 
        specialty, scheduled_time, urgency_score, status, notes
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        actualPatientId, 
        defaultFacility, 
        clinician_id, 
        appointment_type || 'consultation', 
        specialty, 
        scheduled_time, 
        urgency_score || 30, 
        'scheduled',
        notes
      ]
    );
    
    const appointment = result.rows[0];

    // If triage data exists, save it
    if (triage_data && triage_data.symptoms) {
      try {
        // Check if triage_sessions table exists
        const tableCheck = await pool.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'triage_sessions')"
        );
        
        if (tableCheck.rows[0].exists) {
          await pool.query(
            `INSERT INTO triage_sessions (
              patient_id, session_type, symptoms, triage_result, 
              urgency_score, recommended_action, completed_at
            )
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              actualPatientId,
              'text',
              triage_data.symptoms,
              JSON.stringify(triage_data),
              urgency_score,
              urgency_score >= 70 ? 'emergency' : 'schedule_appointment'
            ]
          );
        } else {
          logger.warn('triage_sessions table does not exist, skipping triage data save');
        }
      } catch (triageError) {
        logger.error('Error saving triage data:', triageError);
        // Continue without failing the appointment booking
      }
    }
    
    logger.info(`Appointment booked: ${appointment.appointment_id} for patient ${actualPatientId}`);
    
    res.status(201).json({
      success: true,
      appointment: {
        ...appointment,
        patient_name,
        patient_phone,
        patient_email
      }
    });
  } catch (error) {
    logger.error('Book appointment error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get queue status
router.get('/queue/status', authenticateToken, async (req, res) => {
  try {
    const { facility_id } = req.query;
    
    const result = await pool.query(
      `SELECT COUNT(*) as waiting_count, 
              AVG(urgency_score) as avg_urgency
       FROM appointments
       WHERE facility_id = $1 AND status = 'scheduled' AND scheduled_time::date = CURRENT_DATE`,
      [facility_id || '11111111-1111-1111-1111-111111111111']
    );
    
    res.json({
      success: true,
      queue: {
        waiting_count: parseInt(result.rows[0].waiting_count),
        avg_urgency: parseFloat(result.rows[0].avg_urgency) || 0,
        estimated_wait_time: parseInt(result.rows[0].waiting_count) * 15
      }
    });
  } catch (error) {
    logger.error('Queue status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
