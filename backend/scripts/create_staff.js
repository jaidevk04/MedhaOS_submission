
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

async function createStaff() {
  try {
    const email = 'doctor@medhaos.com';
    const password = 'doctor123';
    
    console.log(`Creating staff: ${email}`);
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if exists
    const check = await pool.query('SELECT staff_id FROM staff WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      console.log('Staff already exists. Updating password...');
      await pool.query('UPDATE staff SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    } else {
      // Create facility if needed
      let facilityId;
      const facilityRes = await pool.query('SELECT facility_id FROM facilities LIMIT 1');
      if (facilityRes.rows.length > 0) {
        facilityId = facilityRes.rows[0].facility_id;
      } else {
        // Create default facility
        const newFac = await pool.query(
          "INSERT INTO facilities (name, type) VALUES ('MedhaOS General Hospital', 'Hospital') RETURNING facility_id"
        );
        facilityId = newFac.rows[0].facility_id;
      }

      await pool.query(
        `INSERT INTO staff (
          facility_id, first_name, last_name, email, password_hash, role, specialization, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          facilityId, 
          'Sharma', 
          'Doctor', 
          email, 
          passwordHash, 
          'doctor', 
          'General Medicine', 
          true
        ]
      );
      console.log('Staff created successfully');
    }
    
  } catch (err) {
    console.error('Error creating staff:', err);
  } finally {
    await pool.end();
  }
}

createStaff();
