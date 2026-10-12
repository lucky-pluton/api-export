import express from 'express';
import { searchGooglePlaces } from '../services/googlePlaces.js';
import { searchHunterEmails } from '../services/hunter.js';
import { dbOps } from '../db.js';
import { extractDomain } from '../utils/domain.js';

const router = express.Router();

// GET /api/buyers - List all previously saved leads
router.get('/', (req, res) => {
  try {
    const leads = dbOps.getAllLeads(100);
    return res.json({
      success: true,
      total: leads.length,
      leads
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to retrieve saved leads',
      details: err.message
    });
  }
});

// GET /api/buyers/search?q=home%20decor&location=Dallas,%20Texas
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const location = req.query.location || '';

  if (!q.trim()) {
    return res.status(400).json({
      error: 'Missing query parameter',
      details: 'Please provide a search keyword or business category (e.g. "home decor", "furniture boutique", "interior design showroom").'
    });
  }

  if (!location.trim()) {
    return res.status(400).json({
      error: 'Missing location parameter',
      details: 'Please provide a US city or state (e.g. "Dallas, Texas", "High Point, NC", "Los Angeles, CA").'
    });
  }

  try {
    const leads = await searchGooglePlaces(q, location);

    // Persist discovered leads into SQLite
    for (const lead of leads) {
      dbOps.saveLead(lead);
    }

    return res.json({
      success: true,
      query: q.trim(),
      location: location.trim(),
      totalDiscovered: leads.length,
      disclaimer: 'Discovered businesses are potential business leads identified via Google Places API (New). They are not pre-confirmed wholesale buyers.',
      leads
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message,
      provider: err.provider || 'system',
      code: err.code || 'SEARCH_ERROR'
    });
  }
});

// GET /api/buyers/:id/emails?domain=example.com
router.get('/:id/emails', async (req, res) => {
  const leadId = req.params.id;
  let domain = req.query.domain;

  // If domain is not provided in query, look up lead from database
  if (!domain) {
    const lead = dbOps.getLeadById(leadId);
    if (lead && lead.domain) {
      domain = lead.domain;
    } else if (lead && lead.website) {
      domain = extractDomain(lead.website);
    }
  }

  if (!domain) {
    return res.status(400).json({
      error: 'Missing domain',
      details: 'Company domain is required for email discovery. Provide ?domain=example.com or select a business with an active website.'
    });
  }

  try {
    const hunterResult = await searchHunterEmails(domain, leadId);

    // Save genuine contacts into SQLite
    for (const contact of hunterResult.contacts) {
      dbOps.saveContact(contact);
    }

    return res.json({
      success: true,
      leadId,
      domain: hunterResult.domain,
      organization: hunterResult.organization,
      pattern: hunterResult.pattern,
      totalContacts: hunterResult.contacts.length,
      contacts: hunterResult.contacts,
      status: hunterResult.contacts.length > 0 ? 'discovered' : 'none_found',
      message: hunterResult.contacts.length > 0
        ? `Found ${hunterResult.contacts.length} verified business contact(s) via Hunter.io.`
        : `No business email addresses found on Hunter.io for domain "${domain}".`
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message,
      provider: err.provider || 'system',
      code: err.code || 'EMAIL_SEARCH_ERROR'
    });
  }
});

// GET /api/buyers/:id - Single lead details and its saved contacts
router.get('/:id', (req, res) => {
  try {
    const lead = dbOps.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const contacts = dbOps.getContactsForLead(req.params.id);
    return res.json({
      success: true,
      lead,
      contacts
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to retrieve lead details',
      details: err.message
    });
  }
});

export default router;
