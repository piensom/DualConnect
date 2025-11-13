const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Get approved success stories
router.get('/', async (req, res) => {
  try {
    const { country, featured, limit = 20 } = req.query;

    let query = `
      SELECT ss.*, u.first_name, u.last_name, p.program_name, c.company_name
      FROM success_stories ss
      JOIN users u ON ss.user_id = u.user_id
      LEFT JOIN programs p ON ss.program_id = p.program_id
      LEFT JOIN companies c ON p.company_id = c.company_id
      WHERE ss.is_approved = true
    `;

    const params = [];
    let paramCount = 0;

    if (country) {
      paramCount++;
      query += ` AND ss.country_of_origin = $${paramCount}`;
      params.push(country);
    }

    if (featured === 'true') {
      query += ' AND ss.is_featured = true';
    }

    query += ` ORDER BY ss.is_featured DESC, ss.created_at DESC LIMIT ${parseInt(limit)}`;

    const result = await pool.query(query, params);

    res.json({ stories: result.rows });
  } catch (error) {
    console.error('Get success stories error:', error);
    res.status(500).json({ error: 'Failed to fetch success stories' });
  }
});

// Submit success story
router.post('/', authenticate, async (req, res) => {
  try {
    const { program_id, title, story, photo_url, video_url, country_of_origin } = req.body;

    const result = await pool.query(
      `INSERT INTO success_stories (user_id, program_id, title, story, photo_url, video_url, country_of_origin)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.user_id, program_id, title, story, photo_url, video_url, country_of_origin]
    );

    res.status(201).json({
      message: 'Success story submitted for review',
      story: result.rows[0]
    });
  } catch (error) {
    console.error('Submit success story error:', error);
    res.status(500).json({ error: 'Failed to submit success story' });
  }
});

module.exports = router;
