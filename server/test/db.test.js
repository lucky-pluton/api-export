import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getDb, dbOps } from '../src/db.js';

describe('SQLite Persistence Layer', () => {
  test('persists leads and prevents duplicates by place_id', () => {
    // Ensure in-memory or clean test db
    const lead1 = {
      id: 'lead_test_1',
      place_id: 'ChIJ1234567890',
      name: 'Dallas Modern Furnishings',
      address: '100 Main St, Dallas, TX',
      category: 'Home Goods Store',
      website: 'https://dallasmodern.example',
      domain: 'dallasmodern.example',
      source_url: 'https://maps.google.com/?cid=123',
      phone: '(214) 555-0199',
      rating: 4.8,
      user_ratings_total: 45
    };

    const savedId = dbOps.saveLead(lead1);
    assert.equal(savedId, 'lead_test_1');

    // Fetch by id
    const fetched = dbOps.getLeadById('lead_test_1');
    assert.ok(fetched);
    assert.equal(fetched.name, 'Dallas Modern Furnishings');
    assert.equal(fetched.domain, 'dallasmodern.example');

    // Attempt saving duplicate place_id with updated name
    const leadDuplicate = {
      ...lead1,
      id: 'lead_test_2_should_not_duplicate',
      name: 'Dallas Modern Furnishings (Renamed)'
    };

    const updatedId = dbOps.saveLead(leadDuplicate);
    assert.equal(updatedId, 'lead_test_1'); // Preserved original primary key

    const updatedRecord = dbOps.getLeadById('lead_test_1');
    assert.equal(updatedRecord.name, 'Dallas Modern Furnishings (Renamed)');
  });

  test('saves and associates contacts with lead', () => {
    const contact = {
      id: 'contact_test_1',
      lead_id: 'lead_test_1',
      email: 'buyer@dallasmodern.example',
      first_name: 'Jessica',
      last_name: 'Miller',
      position: 'Head Buyer',
      confidence: 96,
      sources: [{ uri: 'https://dallasmodern.example/team' }]
    };

    dbOps.saveContact(contact);
    const contacts = dbOps.getContactsForLead('lead_test_1');
    assert.ok(contacts.length >= 1);
    const match = contacts.find(c => c.email === 'buyer@dallasmodern.example');
    assert.ok(match);
    assert.equal(match.first_name, 'Jessica');
    assert.equal(match.confidence, 96);
    assert.equal(match.sources.length, 1);
  });

  test('logs email outreach and retrieves audit history', () => {
    const logId = `log_test_${Date.now()}`;
    dbOps.logEmail({
      id: logId,
      recipient_email: 'buyer@dallasmodern.example',
      recipient_name: 'Jessica Miller',
      business_name: 'Dallas Modern Furnishings',
      subject: 'Wholesale Catalog Inquiry',
      body_text: 'Dear Jessica, ...',
      email_type: 'outreach',
      provider: 'resend',
      provider_id: 're_1234567890',
      status: 'submitted'
    });

    const history = dbOps.getEmailHistory(10);
    const found = history.find(h => h.id === logId);
    assert.ok(found);
    assert.equal(found.recipient_email, 'buyer@dallasmodern.example');
    assert.equal(found.status, 'submitted');
  });
});
