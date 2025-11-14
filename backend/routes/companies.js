const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all companies
router.get('/', async (req, res) => {
  try {
    const { city, industry, limit = 200, offset = 0 } = req.query;

    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM programs WHERE company_id = c.company_id AND is_active = true) as programs_count
      FROM companies c
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (city) {
      paramCount++;
      query += ` AND c.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
    }

    if (industry) {
      paramCount++;
      query += ` AND c.industry = $${paramCount}`;
      params.push(industry);
    }

    query += ` ORDER BY c.company_name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const result = await pool.query(query, params);

    res.json({ companies: result.rows });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get single company
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM companies WHERE company_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get company's programs
    const programsResult = await pool.query(
      'SELECT * FROM programs WHERE company_id = $1 AND is_active = true ORDER BY created_at DESC',
      [id]
    );

    // Get contact persons
    const contactsResult = await pool.query(
      'SELECT * FROM contact_persons WHERE company_id = $1 ORDER BY contact_id',
      [id]
    );

    res.json({
      company: result.rows[0],
      programs: programsResult.rows,
      contacts: contactsResult.rows
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

module.exports = router;
