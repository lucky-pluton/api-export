import { config } from '../config.js';
import { extractDomain } from '../utils/domain.js';

export async function searchHunterEmails(rawDomain, leadId = null) {
  if (!config.hunterApiKey) {
    const error = new Error('Hunter.io API key is not configured in server/.env. Please set HUNTER_API_KEY to discover domain contacts.');
    error.status = 503;
    error.provider = 'hunter';
    error.code = 'UNCONFIGURED';
    throw error;
  }

  const domain = extractDomain(rawDomain);
  if (!domain) {
    const error = new Error(`Invalid or missing company website domain: "${rawDomain}". A valid website domain is required for email discovery.`);
    error.status = 400;
    error.code = 'INVALID_DOMAIN';
    throw error;
  }

  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${config.hunterApiKey}&limit=10`;

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
  } catch (netErr) {
    const error = new Error(`Network failure connecting to Hunter.io API: ${netErr.message}`);
    error.status = 502;
    error.provider = 'hunter';
    throw error;
  }

  if (!response.ok) {
    let errorDetails = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
        errorDetails = errData.errors.map(e => e.details || e.id).join('; ');
      } else if (errData.message) {
        errorDetails = errData.message;
      }
    } catch {
      // Use fallback
    }

    if (response.status === 401) {
      const error = new Error('Hunter.io authentication failed: Invalid API key.');
      error.status = 401;
      error.provider = 'hunter';
      throw error;
    }

    if (response.status === 429) {
      const error = new Error('Hunter.io rate limit reached or monthly request credits exhausted.');
      error.status = 429;
      error.provider = 'hunter';
      throw error;
    }

    const error = new Error(`Hunter.io API returned error (${response.status}): ${errorDetails}`);
    error.status = response.status >= 500 ? 502 : response.status;
    error.provider = 'hunter';
    throw error;
  }

  const result = await response.json();
  const data = result.data || {};
  const rawEmails = data.emails || [];

  const contacts = rawEmails.map((item, idx) => {
    const safeLeadId = leadId || `domain_${domain.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const contactId = `contact_${domain.replace(/[^a-zA-Z0-9_-]/g, '_')}_${idx}_${Date.now()}`;

    // Extract sources with their URLs
    const sources = Array.isArray(item.sources)
      ? item.sources.map(s => ({
          domain: s.domain || null,
          uri: s.uri || null,
          extracted_on: s.extracted_on || null
        }))
      : [];

    return {
      id: contactId,
      lead_id: safeLeadId,
      email: item.value,
      first_name: item.first_name || null,
      last_name: item.last_name || null,
      position: item.position || (item.type === 'generic' ? 'General Inquiry / Buying Desk' : null),
      department: item.department || null,
      confidence: typeof item.confidence === 'number' ? item.confidence : null,
      sources: sources,
      sources_count: sources.length,
      verification_status: item.verification?.status || null,
      discovered_at: new Date().toISOString()
    };
  });

  return {
    domain: data.domain || domain,
    organization: data.organization || null,
    pattern: data.pattern || null,
    total_discovered: contacts.length,
    contacts: contacts
  };
}
