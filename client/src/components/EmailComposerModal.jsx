import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  Building2, 
  User, 
  Mail,
  Copy,
  Check
} from 'lucide-react';

export default function EmailComposerModal({
  isOpen,
  onClose,
  lead,
  contact,
  onSendEmail,
  isSending,
  sendResult,
  sendError
}) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lead && contact) {
      const name = contact.first_name || contact.last_name
        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        : '';
      setRecipientName(name);
      setRecipientEmail(contact.email || '');

      const businessName = lead.name || 'Your Boutique';
      const greeting = name ? `Dear ${name},` : `Dear ${businessName} Buying Team,`;
      
      setSubject(`Curated Handcrafted Home Décor Collection for ${businessName}`);
      
      setBodyText(`${greeting}

I hope this email finds you well.

I came across ${businessName} while reviewing design studios and home décor retailers in ${lead.address || 'the US'}. Your curated aesthetic and focus on ${lead.category || 'home furnishings'} caught our attention.

We represent an ethical export workshop specializing in premium handcrafted home accents, sustainable ceramics, woven textiles, and architectural hardware tailored for high-end boutique retailers and interior showrooms in the US.

Our upcoming collection features:
• Artisan-crafted tabletop & decorative vessel series with low minimum order quantities (MOQs).
• Responsibly sourced, certified natural materials designed for premium retail margins (up to 3.2x markup).
• US-standard duty handling, reliable air & ocean freight forwarding, and barcoded retail-ready packaging.

Would you be open to a quick 5-minute preview of our Fall/Spring wholesale lookbook and line sheet?

Warm regards,

Export Operations Team
API Export B2B Global Trade
100 Trade Tower Blvd, Suite 400, Wilmington, DE 19801
Email: export@apiexport.example

---
Compliance & Opt-out Notice:
You received this personalized commercial inquiry because ${businessName} operates in the home furnishings and interior décor sector. If you are not the right contact or prefer not to receive wholesale export previews, simply reply with "Unsubscribe" or "Opt-Out" and we will immediately remove your address from our correspondence list.`);
      setShowConfirmDialog(false);
    }
  }, [lead, contact, isOpen]);

  if (!isOpen || !lead || !contact) return null;

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (!recipientEmail || !subject || !bodyText) return;
    // Trigger explicit review-and-confirm stage
    setShowConfirmDialog(true);
  };

  const handleFinalConfirmedSend = () => {
    onSendEmail({
      confirmed: true, // EXPLICIT USER APPROVAL
      recipientEmail,
      recipientName,
      businessName: lead.name,
      subject,
      bodyText,
      leadId: lead.id,
      contactId: contact.id
    });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Mail size={18} color="#3b82f6" />
              <h2>Personalized B2B Outreach Composer</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Target: <strong>{lead.name}</strong> ({lead.domain})
            </p>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Success receipt */}
          {sendResult && (
            <div className="alert-box alert-info" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success-text)', marginBottom: '18px' }}>
              <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Outreach Accepted by Resend Provider</strong>
                <p style={{ fontSize: '12px' }}>
                  Provider Message ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{sendResult.providerId}</code>
                </p>
                <p style={{ fontSize: '12px', marginTop: '2px' }}>
                  {sendResult.deliveryNote}
                </p>
              </div>
            </div>
          )}

          {/* Error notice */}
          {sendError && (
            <div className="alert-box alert-danger" style={{ marginBottom: '18px' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Delivery Failed:</strong> {sendError}
              </div>
            </div>
          )}

          {!showConfirmDialog ? (
            <form onSubmit={handleInitialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>
                    <User size={13} />
                    <span>Recipient Contact Name</span>
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Jessica Miller"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={13} />
                    <span>Recipient Email (Verified from Hunter.io)</span>
                  </label>
                  <input
                    type="email"
                    className="text-input"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span>Subject Line</span>
                </label>
                <input
                  type="text"
                  className="text-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>
                    <span>Email Body (Editable B2B Pitch)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  className="text-input"
                  rows={13}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  style={{ resize: 'vertical', lineHeight: '1.5', fontSize: '13px', fontFamily: 'inherit' }}
                  required
                />
              </div>

              <div style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                ℹ️ <strong>Safety & Compliance:</strong> The email body includes mandatory sender identification and an opt-out mechanism per CAN-SPAM requirements. Retain these notices when editing.
              </div>

              <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSending}>
                  <span>Review & Send Outreach</span>
                </button>
              </div>
            </form>
          ) : (
            /* Explicit Two-Stage Confirmation Dialog */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="alert-box alert-warning">
                <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Explicit User Confirmation Required
                  </strong>
                  <p>
                    You are about to deliver a real B2B email to <strong>{recipientEmail}</strong> via Resend API.
                  </p>
                  <p style={{ marginTop: '4px' }}>
                    Per internship guidelines, automated bulk-emailing is strictly prohibited and each message requires your explicit authorization.
                  </p>
                </div>
              </div>

              <div style={{ background: '#090d16', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <div><strong>Recipient:</strong> {recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail}</div>
                <div style={{ marginTop: '4px' }}><strong>Company:</strong> {lead.name}</div>
                <div style={{ marginTop: '4px' }}><strong>Subject:</strong> {subject}</div>
              </div>

              <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
                <button 
                  type="button" 
                  onClick={() => setShowConfirmDialog(false)} 
                  className="btn-secondary"
                  disabled={isSending}
                >
                  Back to Editing
                </button>
                <button 
                  type="button" 
                  onClick={handleFinalConfirmedSend} 
                  className="btn-primary"
                  disabled={isSending}
                  style={{ background: '#10b981' }}
                >
                  {isSending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending via Resend...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Confirm & Send via Resend</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
