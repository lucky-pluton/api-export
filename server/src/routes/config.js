import express from 'express';
import { updateConfig, getProviderStatus, config } from '../config.js';

const router = express.Router();

// GET /api/config - Returns provider status with masked keys
router.get('/', (req, res) => {
  return res.json({
    success: true,
    providers: getProviderStatus()
  });
});

// POST /api/config - Updates API keys in runtime and writes to server/.env
router.post('/', (req, res) => {
  const {
    googlePlacesApiKey,
    hunterApiKey,
    resendApiKey,
    emailFrom,
    testEmailTo
  } = req.body;

  const updates = {};
  if (typeof googlePlacesApiKey === 'string') updates.googlePlacesApiKey = googlePlacesApiKey;
  if (typeof hunterApiKey === 'string') updates.hunterApiKey = hunterApiKey;
  if (typeof resendApiKey === 'string') updates.resendApiKey = resendApiKey;
  if (typeof emailFrom === 'string') updates.emailFrom = emailFrom;
  if (typeof testEmailTo === 'string') updates.testEmailTo = testEmailTo;

  const status = updateConfig(updates);

  return res.json({
    success: true,
    message: 'API configuration saved and updated successfully.',
    providers: status
  });
});

// POST /api/config/test-key - Validate an API key with the live provider
router.post('/test-key', async (req, res) => {
  const { provider, apiKey } = req.body;
  const keyToTest = (apiKey || '').trim() || (
    provider === 'googlePlaces' ? config.googlePlacesApiKey :
    provider === 'hunter' ? config.hunterApiKey :
    provider === 'resend' ? config.resendApiKey : ''
  );

  if (!keyToTest) {
    return res.status(400).json({
      valid: false,
      message: 'No API key provided to test.'
    });
  }

  if (provider === 'googlePlaces') {
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': keyToTest,
          'X-Goog-FieldMask': 'places.id,places.displayName'
        },
        body: JSON.stringify({
          textQuery: 'Home decor in Dallas, Texas',
          pageSize: 1
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const detail = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        return res.json({
          valid: false,
          message: `Google Places API returned error: ${detail}`
        });
      }

      return res.json({
        valid: true,
        message: 'Google Places API (New) key is verified and operational!'
      });
    } catch (err) {
      return res.status(502).json({
        valid: false,
        message: `Network error reaching Google Places API: ${err.message}`
      });
    }
  }

  if (provider === 'hunter') {
    try {
      const response = await fetch(`https://api.hunter.io/v2/account?api_key=${encodeURIComponent(keyToTest)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data.errors?.[0]?.details || data.message || `HTTP ${response.status}`;
        return res.json({
          valid: false,
          message: `Hunter.io returned error: ${detail}`
        });
      }

      const email = data.data?.email || 'Active';
      const requestsLeft = data.data?.requests?.searches?.available ?? 'Active';
      return res.json({
        valid: true,
        message: `Hunter.io key is verified! Account: ${email} (${requestsLeft} searches available)`
      });
    } catch (err) {
      return res.status(502).json({
        valid: false,
        message: `Network error reaching Hunter.io API: ${err.message}`
      });
    }
  }

  if (provider === 'resend') {
    try {
      const response = await fetch('https://api.resend.com/api-keys', {
        headers: {
          'Authorization': `Bearer ${keyToTest}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const detail = data.message || `HTTP ${response.status}`;
        return res.json({
          valid: false,
          message: `Resend returned error: ${detail}`
        });
      }

      return res.json({
        valid: true,
        message: 'Resend API key is verified and operational!'
      });
    } catch (err) {
      return res.status(502).json({
        valid: false,
        message: `Network error reaching Resend API: ${err.message}`
      });
    }
  }

  return res.status(400).json({
    valid: false,
    message: `Unknown provider: ${provider}`
  });
});

export default router;
