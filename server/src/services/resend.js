import { config } from '../config.js';

export async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
  emailType = 'outreach'
}) {
  if (!config.resendApiKey) {
    const error = new Error('Resend API key is not configured in server/.env. Please set RESEND_API_KEY to enable email delivery.');
    error.status = 503;
    error.provider = 'resend';
    error.code = 'UNCONFIGURED';
    throw error;
  }

  if (!config.emailFrom) {
    const error = new Error('EMAIL_FROM is not configured in server/.env. Please specify your verified sender address (e.g., onboarding@resend.dev or your custom domain).');
    error.status = 400;
    error.provider = 'resend';
    error.code = 'MISSING_SENDER';
    throw error;
  }

  // Basic recipient validation
  const recipient = (to || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipient || !emailRegex.test(recipient)) {
    const error = new Error(`Invalid recipient email address: "${to}".`);
    error.status = 400;
    error.code = 'INVALID_RECIPIENT';
    throw error;
  }

  if (!subject || !subject.trim()) {
    const error = new Error('Email subject is required.');
    error.status = 400;
    error.code = 'MISSING_SUBJECT';
    throw error;
  }

  if (!text && !html) {
    const error = new Error('Email body content is required.');
    error.status = 400;
    error.code = 'MISSING_BODY';
    throw error;
  }

  const endpoint = 'https://api.resend.com/emails';
  const payload = {
    from: config.emailFrom,
    to: [recipient],
    subject: subject.trim(),
    text: text || undefined,
    html: html || undefined
  };

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (netErr) {
    const error = new Error(`Network failure connecting to Resend API: ${netErr.message}`);
    error.status = 502;
    error.provider = 'resend';
    throw error;
  }

  if (!response.ok) {
    let errorDetails = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.message) {
        errorDetails = errData.message;
      } else if (errData.name) {
        errorDetails = `${errData.name}: ${JSON.stringify(errData)}`;
      }
    } catch {
      // Use fallback
    }

    const error = new Error(`Resend email delivery failed (${response.status}): ${errorDetails}`);
    error.status = response.status >= 500 ? 502 : response.status;
    error.provider = 'resend';
    throw error;
  }

  const result = await response.json();

  // Note: Resend returns { id: '...' } upon successful provider queuing/acceptance
  return {
    success: true,
    provider: 'resend',
    provider_id: result.id,
    from: config.emailFrom,
    to: recipient,
    status: 'accepted_by_provider',
    deliveryNote: 'Email accepted by Resend provider. Delivery depends on destination mail server and MX records.',
    timestamp: new Date().toISOString()
  };
}
