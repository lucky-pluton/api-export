import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildPersonalizedEmail } from '../src/utils/emailTemplate.js';

describe('Email Template Engine', () => {
  test('generates personalized subject and greeting with contact name', () => {
    const result = buildPersonalizedEmail({
      businessName: 'High Point Living',
      contactName: 'Sarah Jenkins',
      category: 'Luxury Furniture & Lighting',
      location: 'North Carolina'
    });

    assert.ok(result.subject.includes('High Point Living'));
    assert.ok(result.bodyText.includes('Dear Sarah Jenkins,'));
    assert.ok(result.bodyText.includes('High Point Living operates in the home furnishings'));
  });

  test('falls back gracefully to business name if contact name is empty', () => {
    const result = buildPersonalizedEmail({
      businessName: 'Dallas Decor Studio',
      contactName: '',
      category: 'Home Accents',
      location: 'Dallas, TX'
    });

    assert.ok(result.bodyText.includes('Dear Dallas Decor Studio Buying Team,'));
  });

  test('contains mandatory compliance opt-out and physical address disclosures', () => {
    const result = buildPersonalizedEmail({
      businessName: 'Modern Hearth',
      location: 'Denver, CO'
    });

    assert.ok(result.bodyText.toLowerCase().includes('unsubscribe') || result.bodyText.toLowerCase().includes('opt-out'));
    assert.ok(result.bodyText.includes('Wilmington, DE'));
    assert.ok(result.htmlBody.includes('<p style='));
  });
});
