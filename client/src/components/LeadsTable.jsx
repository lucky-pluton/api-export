import React from 'react';
import { 
  Building2, 
  ExternalLink, 
  Globe, 
  MapPin, 
  Star, 
  Mail, 
  Users, 
  Loader2, 
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function LeadsTable({
  leads,
  isLoading,
  error,
  onDiscoverEmails,
  discoveringLeadId,
  onOpenContactsModal,
  isDemoMode,
  onOpenSetupModal,
  onToggleDemoMode
}) {
  if (isLoading) {
    return (
      <div className="glass-panel empty-state">
        <Loader2 size={36} className="empty-icon animate-spin" color="#3b82f6" />
        <h3>Querying Google Places API (New)...</h3>
        <p>Searching live US business registries and commercial directories for home décor establishments.</p>
      </div>
    );
  }

  if (error) {
    const isUnconfigured = error.toLowerCase().includes('not configured') || error.toLowerCase().includes('unconfigured');

    return (
      <div className="alert-box alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>Discovery Request Error</strong>
            <p style={{ fontSize: '13px', lineHeight: '1.5' }}>{error}</p>
          </div>
        </div>

        {isUnconfigured && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(239, 68, 68, 0.25)', paddingTop: '14px', marginTop: '4px' }}>
            {onOpenSetupModal && (
              <button
                onClick={onOpenSetupModal}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 16px', background: '#3b82f6' }}
              >
                <span>Connect Google Places API Key</span>
              </button>
            )}
            {onToggleDemoMode && (
              <button
                onClick={onToggleDemoMode}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.2)', borderColor: '#8b5cf6', color: '#c4b5fd' }}
              >
                <span>Switch to Sandbox Fixture Preview</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <Building2 size={36} className="empty-icon" />
        <h3>No Business Leads Discovered</h3>
        <p>Use the search bar above to discover genuine US home décor boutiques, interior design studios, and showrooms.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Notice Banner Required by Assignment */}
      <div className="alert-box alert-info">
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Business Discovery Notice:</strong> All results are potential business leads identified via Google Places API (New). They are active home décor and interior design businesses, not pre-confirmed wholesale buyers.
          {isDemoMode && (
            <span style={{ display: 'block', marginTop: '4px', color: '#c4b5fd', fontWeight: 'bold' }}>
              [DEMO SANDBOX PREVIEW ACTIVE — Synthetic entries for offline UI evaluation]
            </span>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Address / Location</th>
              <th>Business Category</th>
              <th>Website & Domain</th>
              <th>Source Link</th>
              <th>Contact Discovery</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const isDiscovering = discoveringLeadId === lead.id;
              const hasContacts = lead.contacts && lead.contacts.length > 0;
              const noContactsFound = lead.contactDiscoveryStatus === 'none_found';

              return (
                <tr key={lead.id}>
                  {/* Company Name & Rating */}
                  <td>
                    <div className="company-cell">
                      <span className="company-name">{lead.name}</span>
                      {lead.rating ? (
                        <span className="rating-badge">
                          <Star size={13} fill="#fbbf24" stroke="#fbbf24" />
                          <span>{lead.rating.toFixed(1)}</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                            ({lead.user_ratings_total || 0} reviews)
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Rating unlisted</span>
                      )}
                    </div>
                  </td>

                  {/* Address */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', maxWidth: '240px' }}>
                      <MapPin size={14} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{lead.address || 'Address unlisted'}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="badge badge-gray">{lead.category || 'Retailer'}</span>
                  </td>

                  {/* Website & Domain */}
                  <td>
                    {lead.website ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <a 
                          href={lead.website} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500' }}
                        >
                          <Globe size={12} />
                          <span>{lead.domain || 'Visit Site'}</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>No website listed</span>
                    )}
                  </td>

                  {/* Source Link */}
                  <td>
                    {lead.source_url ? (
                      <a 
                        href={lead.source_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        <span>Google Maps</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Source unlisted</span>
                    )}
                  </td>

                  {/* Contact Discovery Action */}
                  <td>
                    {hasContacts ? (
                      <button 
                        onClick={() => onOpenContactsModal(lead)}
                        className="btn-secondary"
                        style={{
                          borderColor: 'var(--success-border)',
                          color: 'var(--success-text)',
                          background: 'var(--success-bg)',
                          padding: '6px 12px'
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>{lead.contacts.length} Contact{lead.contacts.length > 1 ? 's' : ''} Found</span>
                      </button>
                    ) : noContactsFound ? (
                      <span className="badge badge-amber" style={{ padding: '6px 10px' }}>
                        No Emails on Domain
                      </span>
                    ) : (
                      <button
                        onClick={() => onDiscoverEmails(lead)}
                        disabled={isDiscovering || !lead.domain}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        title={lead.domain ? `Search Hunter.io for ${lead.domain}` : 'No domain available to search'}
                      >
                        {isDiscovering ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Hunter Search...</span>
                          </>
                        ) : (
                          <>
                            <Mail size={13} />
                            <span>Find Contacts</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
