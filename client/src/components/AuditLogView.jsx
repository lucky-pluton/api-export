import React, { useEffect, useState } from 'react';
import { Mail, Clock, RefreshCw, CheckCircle2, XCircle, AlertCircle, Shield } from 'lucide-react';

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/emails/history');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Outreach & Delivery Audit History</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Permanent local SQLite record of every test and verified B2B email submitted to Resend.
          </p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary" disabled={isLoading} style={{ gap: '6px' }}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {error && (
        <div className="alert-box alert-danger">
          <AlertCircle size={18} />
          <span>Failed to load audit history: {error}</span>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="glass-panel empty-state">
          <Clock size={36} className="empty-icon" />
          <h3>No Email Activity Recorded</h3>
          <p>Dispatched test emails and confirmed outreach messages will appear here with Resend provider reference IDs.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Recipient</th>
                <th>Company</th>
                <th>Subject Line</th>
                <th>Type</th>
                <th>Provider ID (Resend)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isTest = log.email_type === 'test';
                const isSuccess = log.status === 'submitted' || log.status === 'accepted';

                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500' }}>{log.recipient_email}</span>
                        {log.recipient_name && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{log.recipient_name}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{log.business_name || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }} title={log.subject}>
                        {log.subject.length > 35 ? log.subject.slice(0, 35) + '...' : log.subject}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isTest ? 'badge-amber' : 'badge-blue'}`}>
                        {isTest ? 'Diagnostics' : 'B2B Outreach'}
                      </span>
                    </td>
                    <td>
                      {log.provider_id ? (
                        <code style={{ fontSize: '11px', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                          {log.provider_id}
                        </code>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isSuccess ? 'badge-green' : 'badge-amber'}`}>
                        {isSuccess ? 'Accepted' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
