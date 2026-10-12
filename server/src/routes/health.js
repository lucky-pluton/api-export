import express from 'express';
import { getProviderStatus, config } from '../config.js';
import { getDb } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  let dbStatus = 'healthy';
  let totalSavedLeads = 0;
  let totalSavedContacts = 0;
  let totalEmailsSent = 0;

  try {
    const db = getDb();
    const leadsCount = db.prepare('SELECT COUNT(*) as count FROM leads').get();
    const contactsCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
    const emailsCount = db.prepare('SELECT COUNT(*) as count FROM email_logs').get();

    totalSavedLeads = leadsCount?.count || 0;
    totalSavedContacts = contactsCount?.count || 0;
    totalEmailsSent = emailsCount?.count || 0;
  } catch (err) {
    dbStatus = `degraded: ${err.message}`;
  }

  const providers = getProviderStatus();

  return res.json({
    status: 'ok',
    product: 'API Export',
    subtitle: 'US Home Décor Buyer Discovery and Email Automation',
    serverTime: new Date().toISOString(),
    database: {
      status: dbStatus,
      engine: 'SQLite (Node.js native DatabaseSync)',
      stats: {
        savedLeads: totalSavedLeads,
        savedContacts: totalSavedContacts,
        emailLogs: totalEmailsSent
      }
    },
    providers: providers
  });
});

export default router;
