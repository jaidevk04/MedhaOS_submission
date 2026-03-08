
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../config/database');

async function checkStaff() {
  try {
    console.log('Checking staff...');
    const result = await pool.query('SELECT email, role, first_name FROM staff');
    console.log('Staff found:', result.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkStaff();
