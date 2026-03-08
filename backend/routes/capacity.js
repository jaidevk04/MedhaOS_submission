const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get bed availability
router.get('/beds', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT facility_id, name, bed_capacity, current_bed_occupancy,
              (bed_capacity - current_bed_occupancy) as available_beds,
              ROUND((current_bed_occupancy::numeric / bed_capacity * 100), 1) as occupancy_percentage
       FROM facilities
       ORDER BY available_beds DESC`
    );
    
    res.json({
      success: true,
      facilities: result.rows
    });
  } catch (error) {
    logger.error('Bed availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ICU capacity
router.get('/icu', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT facility_id, name, icu_capacity, current_icu_occupancy,
              (icu_capacity - current_icu_occupancy) as available_icu_beds,
              ROUND((current_icu_occupancy::numeric / icu_capacity * 100), 1) as icu_occupancy_percentage
       FROM facilities
       ORDER BY available_icu_beds DESC`
    );
    
    res.json({
      success: true,
      facilities: result.rows
    });
  } catch (error) {
    logger.error('ICU capacity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
