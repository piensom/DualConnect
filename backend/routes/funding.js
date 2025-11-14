const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all funding options
router.get('/', async (req, res) => {
  try {
    const { country, type, limit = 50 } = req.query;

    let query = 'SELECT * FROM funding_options WHERE is_active = true';
    const params = [];
    let paramCount = 0;

    if (country) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(eligible_countries)`;
      params.push(country);
    }

    if (type) {
      paramCount++;
      query += ` AND funding_type = $${paramCount}`;
      params.push(type);
    }

    query += ` ORDER BY funding_name LIMIT ${parseInt(limit)}`;

    const result = await pool.query(query, params);

    res.json({ funding_options: result.rows });
  } catch (error) {
    console.error('Get funding options error:', error);
    res.status(500).json({ error: 'Failed to fetch funding options' });
  }
});

// Get single funding option
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM funding_options WHERE funding_id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding option not found' });
    }

    // Get related programs
    const programsResult = await pool.query(
      `SELECT p.*, c.company_name
       FROM programs p
       JOIN program_funding pf ON p.program_id = pf.program_id
       JOIN companies c ON p.company_id = c.company_id
       WHERE pf.funding_id = $1 AND p.is_active = true`,
      [id]
    );

    res.json({
      funding_option: result.rows[0],
      related_programs: programsResult.rows
    });
  } catch (error) {
    console.error('Get funding option error:', error);
    res.status(500).json({ error: 'Failed to fetch funding option' });
  }
});

module.exports = router;
