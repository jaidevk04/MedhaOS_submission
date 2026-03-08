const { pool } = require('../config/database');

async function checkAppointments() {
  try {
    const res = await pool.query(`
      SELECT 
        a.appointment_id, 
        a.scheduled_time, 
        a.status,
        p.first_name as patient_name,
        s.first_name as doctor_name,
        a.clinician_id
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN staff s ON a.clinician_id = s.staff_id
      ORDER BY a.scheduled_time DESC
    `);
    
    console.log('Total Appointments:', res.rowCount);
    res.rows.forEach(row => {
      console.log(`- [${row.scheduled_time}] ${row.patient_name} with Dr. ${row.doctor_name} (${row.status})`);
    });
    
    // Check current date in DB time
    const timeRes = await pool.query('SELECT NOW()::date as db_date, NOW() as db_time');
    console.log('DB Time:', timeRes.rows[0]);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkAppointments();
