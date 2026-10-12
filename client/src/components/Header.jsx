import React from 'react';
import { 
  Building2, 
  Search, 
  Mail, 
  Send, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FlaskConical,
  Radio
} from 'lucide-react';

export default function Header({ 
  healthData, 
  onOpenTestModal, 
  onOpenSetupModal,
  isDemoMode,
  onToggleDemoMode
}) {
  const googleConfigured = healthData?.providers?.googlePlaces?.configured;
  const hunterConfigured = healthData?.providers?.hunter?.configured;
  const resendConfigured = healthData?.providers?.resend?.configured;
  const dbHealthy = healthData?.database?.status === 'healthy';

  return (
    <header className="glass-panel app-header">
      <div className="header-brand">
        <div className="logo-icon">
          <Building2 size={24} />
        </div>
        <div className="brand-text">
          <h1>API Export</h1>
          <p>US Home Décor Buyer Discovery & Email Automation</p>
        </div>
      </div>

      <div className="provider-status-bar">
        {/* Google Places Status */}
        <div 
          className={`status-pill ${googleConfigured ? 'configured' : 'unconfigured'}`}
          title={googleConfigured ? 'Google Places API (New) is configured and active' : 'Google Places API key is missing in server/.env'}
        >
          <span className="status-dot"></span>
          <span>Google Places</span>
        </div>

        {/* Hunter.io Status */}
        <div 
          className={`status-pill ${hunterConfigured ? 'configured' : 'unconfigured'}`}
          title={hunterConfigured ? 'Hunter.io API is configured and active' : 'Hunter.io API key is missing in server/.env'}
        >
          <span className="status-dot"></span>
          <span>Hunter.io</span>
        </div>

        {/* Resend Status */}
        <div 
          className={`status-pill ${resendConfigured ? 'configured' : 'unconfigured'}`}
          title={resendConfigured ? 'Resend API is configured and active' : 'Resend API key is missing in server/.env'}
        >
          <span className="status-dot"></span>
          <span>Resend</span>
        </div>

        {/* Database Status */}
        <div 
          className={`status-pill ${dbHealthy ? 'configured' : 'unconfigured'}`}
          title="Node native SQLite persistence"
        >
          <Database size={13} />
          <span>SQLite DB</span>
        </div>

        {/* Isolated Demo Mode Toggle */}
        <button 
          onClick={onToggleDemoMode}
          className={`btn-secondary ${isDemoMode ? 'active' : ''}`}
          style={{
            borderColor: isDemoMode ? '#8b5cf6' : undefined,
            color: isDemoMode ? '#c4b5fd' : undefined,
            background: isDemoMode ? 'rgba(139, 92, 246, 0.18)' : undefined
          }}
          title="Toggle isolated UI development fixtures"
        >
          <Radio size={14} />
          <span>{isDemoMode ? 'Sandbox Fixture Mode' : 'Live API Mode'}</span>
        </button>

        {/* Test Email Action */}
        <button 
          onClick={onOpenTestModal}
          className="btn-secondary"
          title="Send a diagnostic verification email via Resend"
        >
          <FlaskConical size={14} />
          <span>Test Resend</span>
        </button>

        {/* Setup Help */}
        <button 
          onClick={onOpenSetupModal}
          className="btn-secondary"
          title="View API environment setup guide"
        >
          <HelpCircle size={14} />
          <span>Setup</span>
        </button>
      </div>
    </header>
  );
}
