import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractDomain } from '../src/utils/domain.js';

describe('Domain Extractor Utility', () => {
  test('extracts clean root domain from full https URL with www', () => {
    const url = 'https://www.potterybarn.com/shop/furniture?ref=nav';
    assert.equal(extractDomain(url), 'potterybarn.com');
  });

  test('extracts clean domain from http URL without www', () => {
    const url = 'http://dallasinteriordesign.com/portfolio';
    assert.equal(extractDomain(url), 'dallasinteriordesign.com');
  });

  test('extracts domain from raw string without protocol', () => {
    const raw = 'austinhomestore.com';
    assert.equal(extractDomain(raw), 'austinhomestore.com');
  });

  test('strips port and subpaths', () => {
    const url = 'https://shop.decorhaven.com:8080/products/vessels';
    assert.equal(extractDomain(url), 'shop.decorhaven.com');
  });

  test('returns null for null, empty or non-string input', () => {
    assert.equal(extractDomain(null), null);
    assert.equal(extractDomain(''), null);
    assert.equal(extractDomain('   '), null);
    assert.equal(extractDomain(123), null);
  });

  test('rejects generic social/search platforms', () => {
    assert.equal(extractDomain('https://www.facebook.com/decorstore'), null);
    assert.equal(extractDomain('https://www.instagram.com/dallasdecor'), null);
    assert.equal(extractDomain('https://maps.google.com/place'), null);
  });
});
