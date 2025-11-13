const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get user dashboard stats
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const applicationsResult = await pool.query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
              COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
              COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted
       FROM applications WHERE user_id = $1`,
      [req.user.user_id]
    );

    const bookmarksResult = await pool.query(
      'SELECT COUNT(*) as total FROM bookmarks WHERE user_id = $1',
      [req.user.user_id]
    );

    const notificationsResult = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.user_id]
    );

    res.json({
      stats: {
        applications: applicationsResult.rows[0],
        bookmarks: parseInt(bookmarksResult.rows[0].total),
        unread_notifications: parseInt(notificationsResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
