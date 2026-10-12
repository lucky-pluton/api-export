import React, { useState } from 'react';
import { X, FlaskConical, Send, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function TestEmailModal({
  isOpen,
  onClose,
  healthData,
  onRunTest,
  isTesting,
  testResult,
  testError
}) {
  const defaultTo = healthData?.providers?.resend?.testRecipient !== '(Not configured)' 
    ? healthData?.providers?.resend?.testRecipient 
    : '';

  const [recipient, setRecipient] = useState(defaultTo);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!recipient.trim()) return;
    onRunTest(recipient.trim());
  };

  const senderAddress = healthData?.providers?.resend?.senderAddress || '(Not configured)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={20} color="#3b82f6" />
            <h2>Resend Integration Diagnostic Self-Test</h2>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="alert-box alert-info">
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Safety Isolation:</strong> This diagnostic test sends a verification message exclusively to your authorized test address. It does not contact any prospective business lead.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Configured Sender (EMAIL_FROM in .env)</label>
              <input
                type="text"
                className="text-input"
                value={senderAddress}
                disabled
                style={{ opacity: 0.8, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label>Target Test Recipient (TEST_EMAIL_TO)</label>
              <input
                type="email"
                className="text-input"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={isTesting}
              />
            </div>

            {testResult && (
              <div className="alert-box alert-info" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success-text)' }}>
                <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Diagnostic Email Accepted by Resend</strong>
                  <div style={{ fontSize: '12px' }}>Provider ID: <code>{testResult.providerId}</code></div>
                  <div style={{ fontSize: '12px' }}>Recipient: {testResult.recipient}</div>
                  <div style={{ fontSize: '12px' }}>Timestamp: {testResult.timestamp}</div>
                </div>
              </div>
            )}

            {testError && (
              <div className="alert-box alert-danger">
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Diagnostic Test Failed:</strong> {testError}
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
              <button type="button" onClick={onClose} className="btn-secondary" disabled={isTesting}>
                Close
              </button>
              <button type="submit" className="btn-primary" disabled={isTesting || !recipient.trim()}>
                {isTesting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending Test...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Dispatch Test Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
