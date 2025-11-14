// Email Service using Nodemailer
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    // Initialize transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.templatesDir = path.join(__dirname, '../src/emails');
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@dualconnect.com';
    this.fromName = process.env.FROM_NAME || 'Dual Connect';
  }

  /**
   * Load and process email template
   */
  async loadTemplate(templateName, variables) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf-8');

      // Replace all variables in template
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, value);
      }

      return template;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error('Email template not found');
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user) {
    try {
      const variables = {
        firstName: user.first_name || user.name,
        dashboardUrl: `${process.env.APP_URL}/src/pages/dashboard.html`,
        faqUrl: `${process.env.APP_URL}/src/pages/faq.html`,
        unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe/${user.user_id}`,
        helpUrl: `${process.env.APP_URL}/src/pages/contact.html`
      };

      const html = await this.loadTemplate('welcome', variables);

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: 'Welcome to Dual Connect! 🎓',
        html: html,
        text: `Welcome to Dual Connect, ${variables.firstName}! Visit your dashboard at ${variables.dashboardUrl}`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send application status update email
   */
  async sendApplicationStatusEmail(application, user) {
    try {
      const statusMessages = {
        pending: 'Your application is pending review.',
        under_review: 'Your application is currently under review by our team.',
        approved: 'Congratulations! Your application has been approved.',
        rejected: 'We regret to inform you that your application was not successful this time.'
      };

      const variables = {
        firstName: user.first_name || user.name,
        status: application.status,
        statusText: this.getStatusText(application.status),
        statusMessage: statusMessages[application.status] || '',
        programTitle: application.program_title,
        companyName: application.company_name,
        location: `${application.city}, ${application.state}`,
        submittedDate: new Date(application.created_at).toLocaleDateString('de-DE'),
        updatedDate: new Date().toLocaleDateString('de-DE'),
        nextSteps: this.getNextSteps(application.status),
        adminNotes: application.admin_notes || '',
        dashboardUrl: `${process.env.APP_URL}/src/pages/dashboard.html`,
        unsubscribeUrl: `${process.env.APP_URL}/api/unsubscribe/${user.user_id}`
      };

      const html = await this.loadTemplate('application-status', variables);

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: `Application Status Update: ${application.program_title}`,
        html: html,
        text: `Your application to ${application.program_title} at ${application.company_name} is now ${variables.statusText}.`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Status update email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending status email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetUrl = `${process.env.APP_URL}/src/pages/reset-password.html?token=${resetToken}`;

      const variables = {
        firstName: user.first_name || user.name,
        resetUrl: resetUrl,
        helpUrl: `${process.env.APP_URL}/src/pages/contact.html`
      };

      const html = await this.loadTemplate('password-reset', variables);

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: 'Password Reset Request - Dual Connect',
        html: html,
        text: `Reset your password by clicking this link: ${resetUrl}`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send application deadline reminder
   */
  async sendDeadlineReminder(user, program) {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: `⏰ Application Deadline Approaching: ${program.title}`,
        html: `
          <h2>Hi ${user.first_name || user.name},</h2>
          <p>This is a friendly reminder that the application deadline for <strong>${program.title}</strong> at <strong>${program.company_name}</strong> is approaching.</p>
          <p><strong>Deadline:</strong> ${new Date(program.application_deadline).toLocaleDateString('de-DE')}</p>
          <p><a href="${process.env.APP_URL}/src/pages/program-details.html?id=${program.program_id}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Apply Now</a></p>
          <p>Don't miss this opportunity!</p>
          <p>Best regards,<br>The Dual Connect Team</p>
        `,
        text: `Application deadline for ${program.title} at ${program.company_name} is approaching. Deadline: ${new Date(program.application_deadline).toLocaleDateString('de-DE')}`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Deadline reminder sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
      throw error;
    }
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(user, stats) {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: '📊 Your Weekly Digest - Dual Connect',
        html: `
          <h2>Hi ${user.first_name || user.name},</h2>
          <p>Here's your weekly summary:</p>
          <ul>
            <li><strong>${stats.newPrograms || 0}</strong> new programs added</li>
            <li><strong>${stats.applicationUpdates || 0}</strong> application updates</li>
            <li><strong>${stats.matchingPrograms || 0}</strong> programs matching your profile</li>
          </ul>
          <p><a href="${process.env.APP_URL}/src/pages/dashboard.html" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a></p>
          <p>Best regards,<br>The Dual Connect Team</p>
        `,
        text: `Weekly digest: ${stats.newPrograms} new programs, ${stats.applicationUpdates} updates, ${stats.matchingPrograms} matching programs.`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Weekly digest sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending weekly digest:', error);
      throw error;
    }
  }

  /**
   * Helper: Get status text
   */
  getStatusText(status) {
    const statusTexts = {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return statusTexts[status] || status;
  }

  /**
   * Helper: Get next steps based on status
   */
  getNextSteps(status) {
    const nextSteps = {
      pending: 'We will review your application within 5-7 business days.',
      under_review: 'Our team is currently reviewing your application. We will contact you soon.',
      approved: 'Please check your email for further instructions from the company.',
      rejected: 'Feel free to apply to other programs that match your profile.'
    };
    return nextSteps[status] || '';
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
