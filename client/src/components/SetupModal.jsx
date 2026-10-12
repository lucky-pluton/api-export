import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Play, 
  Info,
  Check
} from 'lucide-react';

export default function SetupModal({ isOpen, onClose, healthData, onConfigUpdated }) {
  const [googleKey, setGoogleKey] = useState('');
  const [hunterKey, setHunterKey] = useState('');
  const [resendKey, setResendKey] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [testEmailTo, setTestEmailTo] = useState('');

  const [showKeys, setShowKeys] = useState({});
  const [testStatuses, setTestStatuses] = useState({});
  const [testingProvider, setTestingProvider] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (healthData?.providers) {
      if (healthData.providers.resend?.senderAddress && healthData.providers.resend?.senderAddress !== '(Not configured)') {
        setEmailFrom(healthData.providers.resend.senderAddress);
      }
      if (healthData.providers.resend?.testRecipient && healthData.providers.resend?.testRecipient !== '(Not configured)') {
        setTestEmailTo(healthData.providers.resend.testRecipient);
      }
    }
  }, [healthData, isOpen]);

  if (!isOpen) return null;

  const toggleShow = (field) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTestKey = async (provider, apiKey) => {
    setTestingProvider(provider);
    setTestStatuses(prev => ({ ...prev, [provider]: null }));
    try {
      const res = await fetch('/api/config/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });
      const data = await res.json();
      setTestStatuses(prev => ({
        ...prev,
        [provider]: {
          valid: data.valid,
          message: data.message
        }
      }));
    } catch (err) {
      setTestStatuses(prev => ({
        ...prev,
        [provider]: {
          valid: false,
          message: `Connection failed: ${err.message}`
        }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload = {};
    if (googleKey.trim()) payload.googlePlacesApiKey = googleKey.trim();
    if (hunterKey.trim()) payload.hunterApiKey = hunterKey.trim();
    if (resendKey.trim()) payload.resendApiKey = resendKey.trim();
    if (emailFrom.trim()) payload.emailFrom = emailFrom.trim();
    if (testEmailTo.trim()) payload.testEmailTo = testEmailTo.trim();

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || 'Failed to update configuration.');
      } else {
        setSaveSuccess(true);
        if (onConfigUpdated) onConfigUpdated();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setSaveError(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const googleConfigured = healthData?.providers?.googlePlaces?.configured;
  const hunterConfigured = healthData?.providers?.hunter?.configured;
  const resendConfigured = healthData?.providers?.resend?.configured;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={22} color="#3b82f6" />
            <div>
              <h2>API Connection & Key Manager</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Enter your live provider keys here to connect live business discovery and email delivery.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="alert-box alert-info" style={{ marginBottom: '20px' }}>
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Secure Local Storage:</strong> Keys entered here are written directly to your local <code style={{ color: '#cbd5e1' }}>server/.env</code> file. They stay on your machine and are never leaked to client bundles or git.
            </div>
          </div>

          {saveSuccess && (
            <div className="alert-box alert-info" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success-text)', marginBottom: '16px' }}>
              <CheckCircle2 size={18} />
              <span>Keys saved to server/.env and connected live successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="alert-box alert-danger" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Google Places API */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>1. Google Places API (New) Key</strong>
                  <span className={`badge ${googleConfigured ? 'badge-green' : 'badge-amber'}`}>
                    {googleConfigured ? 'Connected' : 'Missing'}
                  </span>
                </div>
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Get Key</span> <ExternalLink size={11} />
                </a>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                Used for live US home décor business search. Requires "Places API (New)" enabled in Google Cloud Console.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <input
                    type={showKeys.google ? 'text' : 'password'}
                    className="text-input"
                    style={{ paddingLeft: '14px', paddingRight: '40px' }}
                    placeholder={googleConfigured ? `${healthData.providers.googlePlaces.maskedKey} (Leave blank to keep current)` : 'AIzaSy...'}
                    value={googleKey}
                    onChange={(e) => setGoogleKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('google')}
                    style={{ position: 'absolute', right: '12px', color: '#94a3b8' }}
                  >
                    {showKeys.google ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestKey('googlePlaces', googleKey)}
                  className="btn-secondary"
                  disabled={testingProvider === 'googlePlaces' || (!googleKey.trim() && !googleConfigured)}
                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                >
                  {testingProvider === 'googlePlaces' ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>Test Key</span>
                </button>
              </div>
              {testStatuses.googlePlaces && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: testStatuses.googlePlaces.valid ? '#34d399' : '#f87171' }}>
                  {testStatuses.googlePlaces.valid ? '✓ ' : '✗ '} {testStatuses.googlePlaces.message}
                </div>
              )}
            </div>

            {/* 2. Hunter.io API */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>2. Hunter.io API Key</strong>
                  <span className={`badge ${hunterConfigured ? 'badge-green' : 'badge-amber'}`}>
                    {hunterConfigured ? 'Connected' : 'Missing'}
                  </span>
                </div>
                <a href="https://hunter.io/api_keys" target="_blank" rel="noreferrer" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Get Key</span> <ExternalLink size={11} />
                </a>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                Used for discovering genuine business contact emails from company websites.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <input
                    type={showKeys.hunter ? 'text' : 'password'}
                    className="text-input"
                    style={{ paddingLeft: '14px', paddingRight: '40px' }}
                    placeholder={hunterConfigured ? `${healthData.providers.hunter.maskedKey} (Leave blank to keep current)` : 'Enter Hunter.io API key...'}
                    value={hunterKey}
                    onChange={(e) => setHunterKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('hunter')}
                    style={{ position: 'absolute', right: '12px', color: '#94a3b8' }}
                  >
                    {showKeys.hunter ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestKey('hunter', hunterKey)}
                  className="btn-secondary"
                  disabled={testingProvider === 'hunter' || (!hunterKey.trim() && !hunterConfigured)}
                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                >
                  {testingProvider === 'hunter' ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>Test Key</span>
                </button>
              </div>
              {testStatuses.hunter && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: testStatuses.hunter.valid ? '#34d399' : '#f87171' }}>
                  {testStatuses.hunter.valid ? '✓ ' : '✗ '} {testStatuses.hunter.message}
                </div>
              )}
            </div>

            {/* 3. Resend API */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>3. Resend API Key & Email Configuration</strong>
                  <span className={`badge ${resendConfigured ? 'badge-green' : 'badge-amber'}`}>
                    {resendConfigured ? 'Connected' : 'Missing'}
                  </span>
                </div>
                <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Get Key</span> <ExternalLink size={11} />
                </a>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                Used for sending verified diagnostic test emails and confirmed B2B outreach.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <input
                    type={showKeys.resend ? 'text' : 'password'}
                    className="text-input"
                    style={{ paddingLeft: '14px', paddingRight: '40px' }}
                    placeholder={resendConfigured ? `${healthData.providers.resend.maskedKey} (Leave blank to keep current)` : 're_...'}
                    value={resendKey}
                    onChange={(e) => setResendKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('resend')}
                    style={{ position: 'absolute', right: '12px', color: '#94a3b8' }}
                  >
                    {showKeys.resend ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestKey('resend', resendKey)}
                  className="btn-secondary"
                  disabled={testingProvider === 'resend' || (!resendKey.trim() && !resendConfigured)}
                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                >
                  {testingProvider === 'resend' ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>Test Key</span>
                </button>
              </div>
              {testStatuses.resend && (
                <div style={{ marginBottom: '10px', fontSize: '12px', color: testStatuses.resend.valid ? '#34d399' : '#f87171' }}>
                  {testStatuses.resend.valid ? '✓ ' : '✗ '} {testStatuses.resend.message}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px' }}>Sender Address (EMAIL_FROM)</label>
                  <input
                    type="text"
                    className="text-input"
                    style={{ paddingLeft: '14px', fontSize: '13px' }}
                    placeholder="onboarding@resend.dev or your custom domain"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px' }}>Test Recipient (TEST_EMAIL_TO)</label>
                  <input
                    type="email"
                    className="text-input"
                    style={{ paddingLeft: '14px', fontSize: '13px' }}
                    placeholder="your.email@example.com"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
                style={{ minWidth: '180px' }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Keys...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save & Connect Keys</span>
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
