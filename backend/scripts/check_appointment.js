
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../config/database');

async function checkAppointment() {
  try {
    const email = 'kjaidev@tataelxsi.co.in';
    console.log(`Checking appointment for user: ${email}`);
    
    // First get patient_id
    const patientRes = await pool.query('SELECT patient_id FROM patients WHERE email = $1', [email]);
    if (patientRes.rows.length === 0) {
      console.log('Patient not found');
      return;
    }
    const patientId = patientRes.rows[0].patient_id;

    // Get appointments
    const result = await pool.query(
      `SELECT appointment_id, specialty, scheduled_time, status, created_at 
       FROM appointments 
       WHERE patient_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      console.log('No appointments found for this patient.');
    } else {
      console.log('Latest Appointment Found:', result.rows[0]);
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkAppointment();
