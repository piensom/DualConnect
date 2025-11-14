const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const nodemailer = require('nodemailer');

// Get all contact persons
router.get('/advisors', async (req, res) => {
  try {
    const { specialization, language } = req.query;

    let query = `
      SELECT cp.*, c.company_name
      FROM contact_persons cp
      LEFT JOIN companies c ON cp.company_id = c.company_id
      WHERE cp.is_available = true
    `;

    const params = [];
    let paramCount = 0;

    if (specialization) {
      paramCount++;
      query += ` AND cp.specialization = $${paramCount}`;
      params.push(specialization);
    }

    if (language) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(cp.languages_spoken)`;
      params.push(language);
    }

    query += ' ORDER BY cp.last_name, cp.first_name';

    const result = await pool.query(query, params);

    res.json({ advisors: result.rows });
  } catch (error) {
    console.error('Get advisors error:', error);
    res.status(500).json({ error: 'Failed to fetch advisors' });
  }
});

// Send contact email
router.post('/send-message', async (req, res) => {
  try {
    const { name, email, subject, message, contact_id } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get contact person details if specified
    let recipientEmail = process.env.CONTACT_EMAIL || 'contact@dualconnect.de';

    if (contact_id) {
      const contactResult = await pool.query(
        'SELECT email FROM contact_persons WHERE contact_id = $1',
        [contact_id]
      );
      if (contactResult.rows.length > 0) {
        recipientEmail = contactResult.rows[0].email;
      }
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipientEmail,
      replyTo: email,
      subject: `[Dual Connect] ${subject}`,
      html: `
        <h3>New Contact Form Message</h3>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
