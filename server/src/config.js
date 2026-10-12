import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  googlePlacesApiKey: (process.env.GOOGLE_PLACES_API_KEY || '').trim(),
  hunterApiKey: (process.env.HUNTER_API_KEY || '').trim(),
  resendApiKey: (process.env.RESEND_API_KEY || '').trim(),
  emailFrom: (process.env.EMAIL_FROM || '').trim(),
  testEmailTo: (process.env.TEST_EMAIL_TO || '').trim(),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../data/export_leads.db')
};

import fs from 'fs';

const envFilePath = path.resolve(__dirname, '../.env');

export function maskKey(val) {
  if (!val) return '';
  if (val.length <= 8) return '••••••••';
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`;
}

export function updateConfig(updates = {}) {
  if (updates.googlePlacesApiKey !== undefined) {
    config.googlePlacesApiKey = updates.googlePlacesApiKey.trim();
  }
  if (updates.hunterApiKey !== undefined) {
    config.hunterApiKey = updates.hunterApiKey.trim();
  }
  if (updates.resendApiKey !== undefined) {
    config.resendApiKey = updates.resendApiKey.trim();
  }
  if (updates.emailFrom !== undefined) {
    config.emailFrom = updates.emailFrom.trim();
  }
  if (updates.testEmailTo !== undefined) {
    config.testEmailTo = updates.testEmailTo.trim();
  }

  // Persist to server/.env
  const envContent = `PORT=${config.port}
GOOGLE_PLACES_API_KEY=${config.googlePlacesApiKey}
HUNTER_API_KEY=${config.hunterApiKey}
RESEND_API_KEY=${config.resendApiKey}
EMAIL_FROM=${config.emailFrom}
TEST_EMAIL_TO=${config.testEmailTo}
`;

  try {
    fs.writeFileSync(envFilePath, envContent, 'utf8');
  } catch (err) {
    console.error('Failed to write to .env:', err);
  }

  return getProviderStatus();
}

export function getProviderStatus() {
  return {
    googlePlaces: {
      name: 'Google Places API (New)',
      configured: Boolean(config.googlePlacesApiKey),
      maskedKey: maskKey(config.googlePlacesApiKey),
      description: 'Discovers verified US home décor stores and design studios'
    },
    hunter: {
      name: 'Hunter.io API',
      configured: Boolean(config.hunterApiKey),
      maskedKey: maskKey(config.hunterApiKey),
      description: 'Discovers verified business contact emails from company domains'
    },
    resend: {
      name: 'Resend API',
      configured: Boolean(config.resendApiKey),
      maskedKey: maskKey(config.resendApiKey),
      emailFromConfigured: Boolean(config.emailFrom),
      testEmailToConfigured: Boolean(config.testEmailTo),
      senderAddress: config.emailFrom ? config.emailFrom : '(Not configured)',
      testRecipient: config.testEmailTo ? config.testEmailTo : '(Not configured)',
      description: 'Delivers personalized B2B outreach and diagnostic test emails'
    }
  };
}
