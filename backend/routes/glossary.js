const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all glossary terms
router.get('/', async (req, res) => {
  try {
    const { language = 'de', category, letter } = req.query;

    let query = 'SELECT * FROM glossary WHERE language = $1';
    const params = [language];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (letter) {
      paramCount++;
      query += ` AND term ILIKE $${paramCount}`;
      params.push(`${letter}%`);
    }

    query += ' ORDER BY term ASC';

    const result = await pool.query(query, params);

    res.json({ terms: result.rows });
  } catch (error) {
    console.error('Get glossary terms error:', error);
    res.status(500).json({ error: 'Failed to fetch glossary terms' });
  }
});

// Search glossary
router.get('/search', async (req, res) => {
  try {
    const { q, language = 'de' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await pool.query(
      `SELECT * FROM glossary
       WHERE language = $1 AND (term ILIKE $2 OR definition ILIKE $2)
       ORDER BY term ASC
       LIMIT 20`,
      [language, `%${q}%`]
    );

    res.json({ terms: result.rows });
  } catch (error) {
    console.error('Search glossary error:', error);
    res.status(500).json({ error: 'Failed to search glossary' });
  }
});

module.exports = router;
