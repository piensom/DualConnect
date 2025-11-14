const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get user's bookmarks
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, p.program_name, p.program_type, p.field_of_study, p.duration_months,
              c.company_name, c.city, c.logo_url
       FROM bookmarks b
       JOIN programs p ON b.program_id = p.program_id
       JOIN companies c ON p.company_id = c.company_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.user_id]
    );

    res.json({ bookmarks: result.rows });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Add bookmark
router.post('/', authenticate, async (req, res) => {
  try {
    const { program_id, notes } = req.body;

    // Check if already bookmarked
    const existing = await pool.query(
      'SELECT bookmark_id FROM bookmarks WHERE user_id = $1 AND program_id = $2',
      [req.user.user_id, program_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Program already bookmarked' });
    }

    const result = await pool.query(
      'INSERT INTO bookmarks (user_id, program_id, notes) VALUES ($1, $2, $3) RETURNING *',
      [req.user.user_id, program_id, notes]
    );

    res.status(201).json({
      message: 'Bookmark added successfully',
      bookmark: result.rows[0]
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

// Update bookmark notes
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      'UPDATE bookmarks SET notes = $1 WHERE bookmark_id = $2 AND user_id = $3 RETURNING *',
      [notes, id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({
      message: 'Bookmark updated successfully',
      bookmark: result.rows[0]
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

// Delete bookmark
router.delete('/:program_id', authenticate, async (req, res) => {
  try {
    const { program_id } = req.params;

    const result = await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND program_id = $2 RETURNING *',
      [req.user.user_id, program_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

module.exports = router;
