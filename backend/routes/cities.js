const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all cities
router.get('/', async (req, res) => {
  try {
    const { state } = req.query;

    let query = 'SELECT * FROM cities';
    const params = [];

    if (state) {
      query += ' WHERE state = $1';
      params.push(state);
    }

    query += ' ORDER BY city_name ASC';

    const result = await pool.query(query, params);

    res.json({ cities: result.rows });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Get single city
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM cities WHERE city_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Get programs in this city
    const programsResult = await pool.query(
      `SELECT p.*, c.company_name
       FROM programs p
       JOIN companies c ON p.company_id = c.company_id
       WHERE c.city = $1 AND p.is_active = true
       LIMIT 10`,
      [result.rows[0].city_name]
    );

    res.json({
      city: result.rows[0],
      programs: programsResult.rows
    });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({ error: 'Failed to fetch city' });
  }
});

// Compare cities
router.post('/compare', async (req, res) => {
  try {
    const { city_ids } = req.body;

    if (!Array.isArray(city_ids) || city_ids.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 city IDs' });
    }

    const result = await pool.query(
      'SELECT * FROM cities WHERE city_id = ANY($1) ORDER BY city_name',
      [city_ids]
    );

    res.json({ cities: result.rows });
  } catch (error) {
    console.error('Compare cities error:', error);
    res.status(500).json({ error: 'Failed to compare cities' });
  }
});

module.exports = router;
