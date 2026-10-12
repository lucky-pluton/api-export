import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/server.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

describe('API Route Validation & Safety Behavior', () => {
  test('GET /api/health returns 200, status ok, and provider config flags', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.product, 'API Export');
    assert.ok(body.providers);
    assert.ok('googlePlaces' in body.providers);
    assert.ok('hunter' in body.providers);
    assert.ok('resend' in body.providers);
    assert.ok(body.database);
    assert.equal(body.database.status, 'healthy');
  });

  test('GET /api/buyers/search rejects missing query parameters', async () => {
    // Missing both
    const res1 = await fetch(`${baseUrl}/api/buyers/search`);
    assert.equal(res1.status, 400);

    // Missing location
    const res2 = await fetch(`${baseUrl}/api/buyers/search?q=home%20decor`);
    assert.equal(res2.status, 400);

    const body = await res2.json();
    assert.ok(body.error.toLowerCase().includes('location') || body.details.toLowerCase().includes('city'));
  });

  test('GET /api/buyers/search returns helpful 503 if Google Places key is unconfigured', async () => {
    // In unconfigured environment, should return 503 without crashing or returning fake mock data
    const res = await fetch(`${baseUrl}/api/buyers/search?q=home%20decor&location=Dallas,%20Texas`);
    const body = await res.json();

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      assert.equal(res.status, 503);
      assert.equal(body.code, 'UNCONFIGURED');
      assert.ok(body.error.includes('Google Places API key is not configured'));
    }
  });

  test('GET /api/buyers/:id/emails rejects missing domain', async () => {
    const res = await fetch(`${baseUrl}/api/buyers/unknown_lead_id/emails`);
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.equal(body.error, 'Missing domain');
  });

  test('GET /api/buyers/:id/emails returns helpful 503 if Hunter key is unconfigured', async () => {
    const res = await fetch(`${baseUrl}/api/buyers/test_lead/emails?domain=crateandbarrel.com`);
    const body = await res.json();

    if (!process.env.HUNTER_API_KEY) {
      assert.equal(res.status, 503);
      assert.equal(body.code, 'UNCONFIGURED');
      assert.ok(body.error.includes('Hunter.io API key is not configured'));
    }
  });

  test('POST /api/emails/send strictly rejects unconfirmed outreach requests', async () => {
    const payload = {
      confirmed: false, // User has NOT given explicit approval
      recipientEmail: 'buyer@example.com',
      recipientName: 'Jane Buyer',
      businessName: 'Dallas Decor',
      subject: 'Wholesale Inquiry',
      bodyText: 'Hello, please unsubscribe if you wish.'
    };

    const res = await fetch(`${baseUrl}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'CONFIRMATION_REQUIRED');
  });

  test('POST /api/emails/send rejects invalid recipient email format', async () => {
    const payload = {
      confirmed: true,
      recipientEmail: 'not-an-email',
      subject: 'Wholesale Inquiry',
      bodyText: 'Hello, unsubscribe here.'
    };

    const res = await fetch(`${baseUrl}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'INVALID_RECIPIENT');
  });

  test('POST /api/emails/send rejects email without compliance opt-out notice', async () => {
    const payload = {
      confirmed: true,
      recipientEmail: 'buyer@homedecor.example',
      subject: 'Wholesale Inquiry',
      bodyText: 'Just saying hello with no opt out notice whatsoever.'
    };

    const res = await fetch(`${baseUrl}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'COMPLIANCE_ERROR');
  });

  test('POST /api/emails/test returns 503 if Resend key is unconfigured without crashing', async () => {
    const res = await fetch(`${baseUrl}/api/emails/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: 'tester@example.com' })
    });

    const body = await res.json();
    if (!process.env.RESEND_API_KEY) {
      assert.equal(res.status, 503);
      assert.equal(body.code, 'UNCONFIGURED');
    }
  });

  test('GET /api/emails/history returns 200 and audit array', async () => {
    const res = await fetch(`${baseUrl}/api/emails/history`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.logs));
  });

  test('POST /api/emails/preview generates personalized copy', async () => {
    const res = await fetch(`${baseUrl}/api/emails/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'High Point Showroom',
        contactName: 'David Lee',
        location: 'High Point, NC'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.preview.subject.includes('High Point Showroom'));
    assert.ok(body.preview.bodyText.includes('Dear David Lee,'));
  });

  test('GET /api/config returns masked provider configuration', async () => {
    const res = await fetch(`${baseUrl}/api/config`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.providers);
    assert.ok('googlePlaces' in body.providers);
  });

  test('POST /api/config updates runtime config and status', async () => {
    const res = await fetch(`${baseUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailFrom: 'test-sender@example.com'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.providers.resend.senderAddress, 'test-sender@example.com');
  });

  test('POST /api/config/test-key rejects missing key', async () => {
    const res = await fetch(`${baseUrl}/api/config/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'googlePlaces',
        apiKey: ''
      })
    });
    // If not configured, should return 400
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      assert.equal(res.status, 400);
    }
  });
});
