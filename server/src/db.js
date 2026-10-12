import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

let dbInstance = null;

export function getDb(customPath = null) {
  if (dbInstance) return dbInstance;

  let targetPath = customPath || config.dbPath;

  // On Vercel serverless, root filesystem is read-only; use /tmp or in-memory
  if (process.env.VERCEL) {
    targetPath = path.join('/tmp', 'export_leads.db');
  }

  if (targetPath !== ':memory:') {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      targetPath = ':memory:';
    }
  }

  try {
    dbInstance = new DatabaseSync(targetPath);
  } catch {
    // Fallback to in-memory if DatabaseSync file write fails
    dbInstance = new DatabaseSync(':memory:');
  }

  // Enable WAL mode for better concurrency if on disk
  if (targetPath !== ':memory:') {
    try {
      dbInstance.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // Ignore if PRAGMA is restricted
    }
  }

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      place_id TEXT UNIQUE,
      name TEXT NOT NULL,
      address TEXT,
      category TEXT,
      types_json TEXT,
      website TEXT,
      domain TEXT,
      source_url TEXT,
      phone TEXT,
      rating REAL,
      user_ratings_total INTEGER,
      search_query TEXT,
      search_location TEXT,
      contact_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      position TEXT,
      department TEXT,
      confidence INTEGER,
      sources_json TEXT,
      verification_status TEXT,
      discovered_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      UNIQUE(lead_id, email)
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      contact_id TEXT,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      business_name TEXT,
      subject TEXT NOT NULL,
      body_text TEXT NOT NULL,
      email_type TEXT NOT NULL, -- 'test' or 'outreach'
      provider TEXT DEFAULT 'resend',
      provider_id TEXT,
      status TEXT NOT NULL, -- 'submitted', 'failed', 'accepted'
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
    CREATE INDEX IF NOT EXISTS idx_contacts_lead ON contacts(lead_id);
    CREATE INDEX IF NOT EXISTS idx_emails_lead ON email_logs(lead_id);
  `);
}

// Helper database operations
export const dbOps = {
  saveLead(lead) {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM leads WHERE place_id = ?').get(lead.place_id);
    
    if (existing) {
      // Update details
      const updateStmt = db.prepare(`
        UPDATE leads 
        SET name = ?, address = ?, category = ?, types_json = ?, website = ?, domain = ?, source_url = ?, phone = ?, rating = ?, user_ratings_total = ?
        WHERE place_id = ?
      `);
      updateStmt.run(
        lead.name,
        lead.address || null,
        lead.category || null,
        JSON.stringify(lead.types || []),
        lead.website || null,
        lead.domain || null,
        lead.source_url || null,
        lead.phone || null,
        lead.rating || null,
        lead.user_ratings_total || null,
        lead.place_id
      );
      return existing.id;
    }

    const insertStmt = db.prepare(`
      INSERT INTO leads (
        id, place_id, name, address, category, types_json, website, domain, source_url, phone, rating, user_ratings_total, search_query, search_location, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      lead.id,
      lead.place_id,
      lead.name,
      lead.address || null,
      lead.category || null,
      JSON.stringify(lead.types || []),
      lead.website || null,
      lead.domain || null,
      lead.source_url || null,
      lead.phone || null,
      lead.rating || null,
      lead.user_ratings_total || null,
      lead.search_query || null,
      lead.search_location || null,
      lead.created_at || new Date().toISOString()
    );

    return lead.id;
  },

  getLeadById(id) {
    const db = getDb();
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    if (!lead) return null;
    return {
      ...lead,
      types: lead.types_json ? JSON.parse(lead.types_json) : []
    };
  },

  getAllLeads(limit = 100) {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT ?').all(limit);
    return rows.map(r => ({
      ...r,
      types: r.types_json ? JSON.parse(r.types_json) : []
    }));
  },

  saveContact(contact) {
    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO contacts (
        id, lead_id, email, first_name, last_name, position, department, confidence, sources_json, verification_status, discovered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      contact.id,
      contact.lead_id,
      contact.email,
      contact.first_name || null,
      contact.last_name || null,
      contact.position || null,
      contact.department || null,
      contact.confidence !== undefined ? contact.confidence : null,
      JSON.stringify(contact.sources || []),
      contact.verification_status || null,
      contact.discovered_at || new Date().toISOString()
    );

    // Update contact count in leads table
    db.prepare('UPDATE leads SET contact_count = (SELECT COUNT(*) FROM contacts WHERE lead_id = ?) WHERE id = ?').run(contact.lead_id, contact.lead_id);

    return contact.id;
  },

  getContactsForLead(leadId) {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM contacts WHERE lead_id = ? ORDER BY confidence DESC').all(leadId);
    return rows.map(r => ({
      ...r,
      sources: r.sources_json ? JSON.parse(r.sources_json) : []
    }));
  },

  logEmail(log) {
    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO email_logs (
        id, lead_id, contact_id, recipient_email, recipient_name, business_name, subject, body_text, email_type, provider, provider_id, status, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      log.id,
      log.lead_id || null,
      log.contact_id || null,
      log.recipient_email,
      log.recipient_name || null,
      log.business_name || null,
      log.subject,
      log.body_text,
      log.email_type,
      log.provider || 'resend',
      log.provider_id || null,
      log.status,
      log.error_message || null,
      log.created_at || new Date().toISOString()
    );

    return log.id;
  },

  getEmailHistory(limit = 50) {
    const db = getDb();
    return db.prepare('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  }
};
