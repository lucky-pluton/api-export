import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  ShieldCheck, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  User, 
  Award,
  Globe
} from 'lucide-react';

export default function ContactDiscoveryModal({
  isOpen,
  onClose,
  lead,
  onComposeEmail
}) {
  const [expandedSources, setExpandedSources] = useState({});

  if (!isOpen || !lead) return null;

  const toggleSources = (contactId) => {
    setExpandedSources(prev => ({
      ...prev,
      [contactId]: !prev[contactId]
    }));
  };

  const contacts = lead.contacts || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Building2 size={18} color="#3b82f6" />
              <h2>{lead.name}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8' }}>
              <Globe size={13} />
              <span>Domain: {lead.domain || 'N/A'}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="alert-box alert-info">
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Hunter.io Verification:</strong> Contacts listed below originate directly from Hunter.io's domain crawler with live confidence ratings and web source URLs.
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="empty-state">
              <Mail size={32} className="empty-icon" />
              <h3>No Email Contacts Found</h3>
              <p>Hunter.io does not currently index verified public email addresses for domain <strong>{lead.domain}</strong>.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '14px', color: '#f8fafc' }}>
                Discovered Contacts ({contacts.length}):
              </h4>

              {contacts.map((contact) => {
                const isExpanded = Boolean(expandedSources[contact.id]);
                const sources = contact.sources || [];
                const confidence = contact.confidence || 0;

                return (
                  <div
                    key={contact.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} color="#60a5fa" />
                          <strong style={{ fontSize: '14px', color: '#f8fafc' }}>
                            {contact.first_name || contact.last_name
                              ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                              : 'Commercial Contact'}
                          </strong>
                          {contact.verification_status && (
                            <span className="badge badge-green" style={{ fontSize: '10px' }}>
                              {contact.verification_status}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                          {contact.position || contact.department || 'General Inquiry / Procurement'}
                        </div>

                        <div style={{ fontSize: '13px', color: '#60a5fa', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                          {contact.email}
                        </div>
                      </div>

                      {/* Compose button */}
                      <button
                        onClick={() => onComposeEmail(lead, contact)}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        <Send size={13} />
                        <span>Compose Outreach</span>
                      </button>
                    </div>

                    {/* Confidence Meter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={13} color="#10b981" />
                        <span>Confidence Score: <strong>{confidence}%</strong></span>
                      </div>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{ 
                            width: `${confidence}%`,
                            backgroundColor: confidence > 75 ? '#10b981' : confidence > 50 ? '#f59e0b' : '#ef4444'
                          }} 
                        />
                      </div>
                    </div>

                    {/* Sources toggle */}
                    {sources.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => toggleSources(contact.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                        >
                          <span>{sources.length} Verified Source URL{sources.length > 1 ? 's' : ''}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {sources.map((s, idx) => (
                              <div key={idx} style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                {s.uri ? (
                                  <a href={s.uri} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{s.uri}</span>
                                    <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  <span>{s.domain || 'Source unlisted'}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
