import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Globe, MapPin, ExternalLink, Mail, CheckCircle2 } from 'lucide-react';

export default function SavedLeadsView({
  onDiscoverEmails,
  discoveringLeadId,
  onOpenContactsModal
}) {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSavedLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/buyers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedLeads();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>SQLite Discovered Leads Database</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            All authentic US home décor businesses discovered via Google Places API and persisted locally.
          </p>
        </div>
        <button onClick={fetchSavedLeads} className="btn-secondary" disabled={isLoading} style={{ gap: '6px' }}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Database</span>
        </button>
      </div>

      {leads.length === 0 ? (
        <div className="glass-panel empty-state">
          <Database size={36} className="empty-icon" />
          <h3>No Persisted Leads in Database</h3>
          <p>Perform a search in the "Live Search & Discovery" tab to discover and save US home décor leads.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Location</th>
                <th>Category</th>
                <th>Domain</th>
                <th>Discovered At</th>
                <th>Contacts</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <span style={{ fontWeight: '600' }}>{lead.name}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{lead.address || '—'}</span>
                  </td>
                  <td>
                    <span className="badge badge-gray">{lead.category || 'Retailer'}</span>
                  </td>
                  <td>
                    {lead.domain ? (
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                        {lead.domain}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>No domain</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {lead.contact_count > 0 ? (
                      <button
                        onClick={async () => {
                          // Fetch contacts for lead and open modal
                          try {
                            const res = await fetch(`/api/buyers/${lead.id}`);
                            const data = await res.json();
                            onOpenContactsModal(data.lead ? { ...data.lead, contacts: data.contacts } : lead);
                          } catch {
                            onOpenContactsModal(lead);
                          }
                        }}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--success-text)' }}
                      >
                        <CheckCircle2 size={12} />
                        <span>{lead.contact_count} Contact{lead.contact_count > 1 ? 's' : ''}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onDiscoverEmails(lead)}
                        disabled={discoveringLeadId === lead.id || !lead.domain}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        <Mail size={12} />
                        <span>Find Contacts</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
