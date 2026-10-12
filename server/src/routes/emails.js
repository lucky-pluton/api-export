import express from 'express';
import { sendEmailViaResend } from '../services/resend.js';
import { config } from '../config.js';
import { dbOps } from '../db.js';
import { buildPersonalizedEmail } from '../utils/emailTemplate.js';

const router = express.Router();

// POST /api/emails/preview - Generate personalized preview without sending
router.post('/preview', (req, res) => {
  const { businessName, contactName, category, location, customPitch } = req.body;
  const template = buildPersonalizedEmail({
    businessName: businessName || 'Potential Buyer Boutique',
    contactName: contactName || '',
    category: category || 'Home Décor & Furnishings',
    location: location || 'United States',
    customPitch: customPitch || ''
  });

  return res.json({
    success: true,
    preview: template
  });
});

// POST /api/emails/test - Send diagnostic test email to verified TEST_EMAIL_TO
router.post('/test', async (req, res) => {
  if (!config.resendApiKey) {
    return res.status(503).json({
      error: 'Resend API key is not configured in server/.env.',
      code: 'UNCONFIGURED',
      provider: 'resend',
      setupGuide: 'Add RESEND_API_KEY to server/.env'
    });
  }

  if (!config.emailFrom) {
    return res.status(400).json({
      error: 'EMAIL_FROM is not configured in server/.env.',
      code: 'MISSING_SENDER',
      provider: 'resend',
      setupGuide: 'Set EMAIL_FROM in server/.env to your verified sender (e.g., onboarding@resend.dev or your custom domain)'
    });
  }

  const testRecipient = (req.body.recipient || config.testEmailTo || '').trim();

  if (!testRecipient) {
    return res.status(400).json({
      error: 'TEST_EMAIL_TO is not configured in server/.env and no test recipient was provided in request.',
      code: 'MISSING_TEST_RECIPIENT',
      provider: 'resend',
      setupGuide: 'Set TEST_EMAIL_TO in server/.env or provide recipient in request body.'
    });
  }

  const testSubject = `[API Export] Resend Integration Diagnostic Test (${new Date().toLocaleTimeString()})`;
  const testText = `Hello,

This is a diagnostic verification email sent from your API Export application.

Diagnostics details:
- Timestamp: ${new Date().toISOString()}
- Provider: Resend API
- Sender Address (EMAIL_FROM): ${config.emailFrom}
- Target Test Recipient: ${testRecipient}
- Status: Active & Operational

If you are receiving this message, your Resend API key and sender configuration are successfully connected.`;

  const testHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2b6cb0; margin-top: 0;">API Export — Resend Integration Verified</h2>
      <p style="color: #4a5568; line-height: 1.5;">This diagnostic email confirms that your Resend API connection and sender address are working correctly.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #edf2f7;"><td style="padding: 8px; font-weight: bold; color: #718096;">Sender (FROM):</td><td style="padding: 8px; color: #2d3748;">${config.emailFrom}</td></tr>
        <tr style="border-bottom: 1px solid #edf2f7;"><td style="padding: 8px; font-weight: bold; color: #718096;">Recipient (TO):</td><td style="padding: 8px; color: #2d3748;">${testRecipient}</td></tr>
        <tr style="border-bottom: 1px solid #edf2f7;"><td style="padding: 8px; font-weight: bold; color: #718096;">Provider:</td><td style="padding: 8px; color: #2d3748;">Resend API</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; color: #718096;">Timestamp:</td><td style="padding: 8px; color: #2d3748;">${new Date().toISOString()}</td></tr>
      </table>
      <p style="color: #a0aec0; font-size: 12px; margin-bottom: 0;">Automated integration test sent via API Export platform.</p>
    </div>
  `;

  try {
    const result = await sendEmailViaResend({
      to: testRecipient,
      subject: testSubject,
      text: testText,
      html: testHtml,
      emailType: 'test'
    });

    const logId = `log_${Date.now()}_test`;
    dbOps.logEmail({
      id: logId,
      recipient_email: testRecipient,
      recipient_name: 'Diagnostic Tester',
      business_name: 'System Self-Test',
      subject: testSubject,
      body_text: testText,
      email_type: 'test',
      provider: 'resend',
      provider_id: result.provider_id,
      status: 'submitted',
      created_at: result.timestamp
    });

    return res.json({
      success: true,
      message: `Diagnostic test email submitted to Resend for recipient ${testRecipient}.`,
      provider: 'resend',
      providerId: result.provider_id,
      recipient: testRecipient,
      sender: config.emailFrom,
      timestamp: result.timestamp,
      logId
    });
  } catch (err) {
    const logId = `log_${Date.now()}_test_fail`;
    try {
      dbOps.logEmail({
        id: logId,
        recipient_email: testRecipient,
        recipient_name: 'Diagnostic Tester',
        business_name: 'System Self-Test',
        subject: testSubject,
        body_text: testText,
        email_type: 'test',
        provider: 'resend',
        provider_id: null,
        status: 'failed',
        error_message: err.message,
        created_at: new Date().toISOString()
      });
    } catch {
      // Ignore db log error if secondary
    }

    const status = err.status || 500;
    return res.status(status).json({
      error: err.message,
      provider: 'resend',
      code: err.code || 'SEND_ERROR'
    });
  }
});

// POST /api/emails/send - Send personalized outreach email (Requires explicit user confirmation)
router.post('/send', async (req, res) => {
  const {
    confirmed,
    recipientEmail,
    recipientName,
    businessName,
    subject,
    bodyText,
    leadId,
    contactId
  } = req.body;

  // SAFETY REQUIREMENT: Explicit user approval
  if (confirmed !== true) {
    return res.status(400).json({
      error: 'Explicit confirmation required',
      code: 'CONFIRMATION_REQUIRED',
      details: 'Cold outreach emails require explicit user confirmation before delivery. Set confirmed: true.'
    });
  }

  const recipient = (recipientEmail || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipient || !emailRegex.test(recipient)) {
    return res.status(400).json({
      error: 'Invalid recipient email',
      code: 'INVALID_RECIPIENT',
      details: `"${recipientEmail}" is not a valid email address.`
    });
  }

  if (!subject || !subject.trim()) {
    return res.status(400).json({
      error: 'Subject is required',
      code: 'MISSING_SUBJECT'
    });
  }

  if (!bodyText || !bodyText.trim()) {
    return res.status(400).json({
      error: 'Body text is required',
      code: 'MISSING_BODY'
    });
  }

  // Ensure compliance content is not stripped
  if (!bodyText.toLowerCase().includes('unsubscribe') && !bodyText.toLowerCase().includes('opt-out')) {
    return res.status(400).json({
      error: 'Compliance notice missing',
      code: 'COMPLIANCE_ERROR',
      details: 'Outreach emails must contain a clear opt-out or unsubscribe notice for commercial B2B compliance.'
    });
  }

  // Convert plain text to simple clean HTML
  const htmlBody = bodyText
    .split('\n\n')
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #2d3748; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const fullHtml = `<div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">${htmlBody}</div>`;

  try {
    const result = await sendEmailViaResend({
      to: recipient,
      subject: subject.trim(),
      text: bodyText.trim(),
      html: fullHtml,
      emailType: 'outreach'
    });

    const logId = `log_${Date.now()}_outreach`;
    dbOps.logEmail({
      id: logId,
      lead_id: leadId || null,
      contact_id: contactId || null,
      recipient_email: recipient,
      recipient_name: recipientName || null,
      business_name: businessName || null,
      subject: subject.trim(),
      body_text: bodyText.trim(),
      email_type: 'outreach',
      provider: 'resend',
      provider_id: result.provider_id,
      status: 'submitted',
      created_at: result.timestamp
    });

    return res.json({
      success: true,
      message: `Outreach email submitted to Resend for ${recipient}.`,
      provider: 'resend',
      providerId: result.provider_id,
      recipient,
      businessName: businessName || 'Business',
      status: 'submitted',
      deliveryNote: 'Accepted by Resend provider. Delivery receipt recorded in SQLite audit log.',
      timestamp: result.timestamp,
      logId
    });
  } catch (err) {
    const logId = `log_${Date.now()}_outreach_fail`;
    try {
      dbOps.logEmail({
        id: logId,
        lead_id: leadId || null,
        contact_id: contactId || null,
        recipient_email: recipient,
        recipient_name: recipientName || null,
        business_name: businessName || null,
        subject: subject.trim(),
        body_text: bodyText.trim(),
        email_type: 'outreach',
        provider: 'resend',
        provider_id: null,
        status: 'failed',
        error_message: err.message,
        created_at: new Date().toISOString()
      });
    } catch {
      // Ignore secondary db error
    }

    const status = err.status || 500;
    return res.status(status).json({
      error: err.message,
      provider: 'resend',
      code: err.code || 'SEND_ERROR'
    });
  }
});

// GET /api/emails/history - Audit log of sent emails
router.get('/history', (req, res) => {
  try {
    const logs = dbOps.getEmailHistory(50);
    return res.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch email history',
      details: err.message
    });
  }
});

export default router;
