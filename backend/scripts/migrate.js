const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'medhaos_db',
  user: process.env.DB_USER || 'medhaos',
  password: process.env.DB_PASSWORD || 'medhaos_dev_password',
});

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing schema.sql...');
    await pool.query(schema);
    console.log('✅ Schema created successfully!\n');

    // Read seed file
    const seedPath = path.join(__dirname, 'seed-simple.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Seeding database with mock data...');
    const result = await pool.query(seed);
    console.log('✅ Database seeded successfully!\n');

    // Show summary
    const facilitiesCount = await pool.query('SELECT COUNT(*) FROM facilities');
    const staffCount = await pool.query('SELECT COUNT(*) FROM staff');
    const patientsCount = await pool.query('SELECT COUNT(*) FROM patients');
    const appointmentsCount = await pool.query('SELECT COUNT(*) FROM appointments');

    console.log('📊 Database Summary:');
    console.log(`   • Facilities: ${facilitiesCount.rows[0].count}`);
    console.log(`   • Staff: ${staffCount.rows[0].count}`);
    console.log(`   • Patients: ${patientsCount.rows[0].count}`);
    console.log(`   • Appointments: ${appointmentsCount.rows[0].count}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
