import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import SearchForm from './components/SearchForm.jsx';
import LeadsTable from './components/LeadsTable.jsx';
import ContactDiscoveryModal from './components/ContactDiscoveryModal.jsx';
import EmailComposerModal from './components/EmailComposerModal.jsx';
import TestEmailModal from './components/TestEmailModal.jsx';
import SetupModal from './components/SetupModal.jsx';
import AuditLogView from './components/AuditLogView.jsx';
import SavedLeadsView from './components/SavedLeadsView.jsx';
import { DEMO_LEADS } from './data/demoFixtures.js';
import { Search, Database, Clock, Key, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'saved' | 'audit'

  // Search state
  const [query, setQuery] = useState('Home Décor Boutique');
  const [location, setLocation] = useState('Dallas, Texas');
  const [leads, setLeads] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Email discovery state
  const [discoveringLeadId, setDiscoveringLeadId] = useState(null);
  const [selectedLeadForContacts, setSelectedLeadForContacts] = useState(null);

  // Email composer state
  const [composerState, setComposerState] = useState({
    isOpen: false,
    lead: null,
    contact: null,
    isSending: false,
    result: null,
    error: null
  });

  // Test email modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  // Setup modal state
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Isolated demo mode for offline evaluation
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load health data on mount
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {
      // Backend not running yet or starting up
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Perform Business Discovery Search
  const handleSearch = async () => {
    setSearchError(null);
    setIsSearching(true);

    if (isDemoMode) {
      setTimeout(() => {
        setLeads(DEMO_LEADS);
        setIsSearching(false);
      }, 500);
      return;
    }

    try {
      const url = `/api/buyers/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'UNCONFIGURED') {
          setSearchError(`${data.error} Click the 'Setup' button in the header to configure your Google Places key in server/.env.`);
        } else {
          setSearchError(data.error || `Search failed with status ${res.status}`);
        }
        setLeads([]);
      } else {
        setLeads(data.leads || []);
      }
    } catch (err) {
      setSearchError(`Network error connecting to backend API: ${err.message}. Make sure server is running on http://localhost:5000`);
      setLeads([]);
    } finally {
      setIsSearching(false);
      fetchHealth();
    }
  };

  // Discover Contacts via Hunter.io
  const handleDiscoverEmails = async (lead) => {
    if (!lead.domain) return;
    setDiscoveringLeadId(lead.id);

    if (isDemoMode) {
      setTimeout(() => {
        const updatedLeads = leads.map(l => {
          if (l.id === lead.id) {
            return {
              ...l,
              contacts: lead.contacts || [],
              contactDiscoveryStatus: (lead.contacts && lead.contacts.length > 0) ? 'discovered' : 'none_found'
            };
          }
          return l;
        });
        setLeads(updatedLeads);
        setSelectedLeadForContacts(lead);
        setDiscoveringLeadId(null);
      }, 600);
      return;
    }

    try {
      const url = `/api/buyers/${encodeURIComponent(lead.id)}/emails?domain=${encodeURIComponent(lead.domain)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'UNCONFIGURED') {
          alert(`${data.error}\n\nPlease add HUNTER_API_KEY to server/.env to search company domains.`);
          setIsSetupModalOpen(true);
        } else {
          alert(`Hunter.io search error: ${data.error}`);
        }
      } else {
        const updatedLeads = leads.map(l => {
          if (l.id === lead.id) {
            return {
              ...l,
              contacts: data.contacts || [],
              contactDiscoveryStatus: data.status
            };
          }
          return l;
        });
        setLeads(updatedLeads);

        // Open contact modal for inspection
        setSelectedLeadForContacts({
          ...lead,
          contacts: data.contacts || []
        });
      }
    } catch (err) {
      alert(`Network error during email discovery: ${err.message}`);
    } finally {
      setDiscoveringLeadId(null);
      fetchHealth();
    }
  };

  // Open Email Composer
  const handleComposeEmail = (lead, contact) => {
    setSelectedLeadForContacts(null);
    setComposerState({
      isOpen: true,
      lead,
      contact,
      isSending: false,
      result: null,
      error: null
    });
  };

  // Send Verified Outreach Email
  const handleSendEmail = async (payload) => {
    setComposerState(prev => ({ ...prev, isSending: true, error: null, result: null }));

    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setComposerState(prev => ({
          ...prev,
          isSending: false,
          error: data.error || 'Failed to dispatch email'
        }));
      } else {
        setComposerState(prev => ({
          ...prev,
          isSending: false,
          result: data,
          error: null
        }));
        fetchHealth();
      }
    } catch (err) {
      setComposerState(prev => ({
        ...prev,
        isSending: false,
        error: `Network failure: ${err.message}`
      }));
    }
  };

  // Run Resend Diagnostic Self-Test
  const handleRunTest = async (recipient) => {
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient })
      });
      const data = await res.json();

      if (!res.ok) {
        setTestError(data.error || `Test failed with code ${res.status}`);
      } else {
        setTestResult(data);
        fetchHealth();
      }
    } catch (err) {
      setTestError(`Network failure: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Toggle isolated sandbox mode
  const handleToggleDemoMode = () => {
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    if (nextMode) {
      setLeads(DEMO_LEADS);
      setSearchError(null);
    } else {
      setLeads([]);
      setSearchError(null);
    }
  };

  const googleReady = healthData?.providers?.googlePlaces?.configured;
  const hunterReady = healthData?.providers?.hunter?.configured;
  const resendReady = healthData?.providers?.resend?.configured;
  const hasUnconfiguredProviders = healthData && (!googleReady || !hunterReady || !resendReady);

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        healthData={healthData}
        onOpenTestModal={() => {
          setTestResult(null);
          setTestError(null);
          setIsTestModalOpen(true);
        }}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />

      {/* Unconfigured Provider Banner */}
      {hasUnconfiguredProviders && !isDemoMode && (
        <div className="alert-box alert-warning animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Action Required: Live API Keys Pending Configuration</strong>
              <div style={{ fontSize: '12px', marginTop: '2px', color: '#fef3c7' }}>
                {!googleReady && '• Google Places API (New) '}
                {!hunterReady && '• Hunter.io '}
                {!resendReady && '• Resend '}
                need to be configured in <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>server/.env</code>.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsSetupModalOpen(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              View Setup Steps
            </button>
            <button onClick={handleToggleDemoMode} className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px', background: '#8b5cf6' }}>
              Preview with Sandbox Fixtures
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="view-tabs">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={15} />
          <span>Live Search & Discovery</span>
          {leads.length > 0 && <span className="tab-badge">{leads.length}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Database size={15} />
          <span>SQLite Database</span>
          {healthData?.database?.stats?.savedLeads > 0 && (
            <span className="tab-badge">{healthData.database.stats.savedLeads}</span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Clock size={15} />
          <span>Outreach Audit History</span>
          {healthData?.database?.stats?.emailLogs > 0 && (
            <span className="tab-badge">{healthData.database.stats.emailLogs}</span>
          )}
        </button>
      </nav>

      {/* Main Tab Views */}
      <main>
        {activeTab === 'search' && (
          <div>
            <SearchForm
              query={query}
              setQuery={setQuery}
              location={location}
              setLocation={setLocation}
              onSearch={handleSearch}
              isLoading={isSearching}
              onReset={() => {
                setQuery('Home Décor Boutique');
                setLocation('Dallas, Texas');
                setLeads([]);
                setSearchError(null);
              }}
            />

            <LeadsTable
              leads={leads}
              isLoading={isSearching}
              error={searchError}
              onDiscoverEmails={handleDiscoverEmails}
              discoveringLeadId={discoveringLeadId}
              onOpenContactsModal={(lead) => setSelectedLeadForContacts(lead)}
              isDemoMode={isDemoMode}
              onOpenSetupModal={() => setIsSetupModalOpen(true)}
              onToggleDemoMode={handleToggleDemoMode}
            />
          </div>
        )}

        {activeTab === 'saved' && (
          <SavedLeadsView
            onDiscoverEmails={handleDiscoverEmails}
            discoveringLeadId={discoveringLeadId}
            onOpenContactsModal={(lead) => setSelectedLeadForContacts(lead)}
          />
        )}

        {activeTab === 'audit' && <AuditLogView />}
      </main>

      {/* Contact Discovery Modal */}
      <ContactDiscoveryModal
        isOpen={Boolean(selectedLeadForContacts)}
        onClose={() => setSelectedLeadForContacts(null)}
        lead={selectedLeadForContacts}
        onComposeEmail={handleComposeEmail}
      />

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={composerState.isOpen}
        onClose={() => setComposerState(prev => ({ ...prev, isOpen: false }))}
        lead={composerState.lead}
        contact={composerState.contact}
        onSendEmail={handleSendEmail}
        isSending={composerState.isSending}
        sendResult={composerState.result}
        sendError={composerState.error}
      />

      {/* Resend Diagnostic Test Modal */}
      <TestEmailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        healthData={healthData}
        onRunTest={handleRunTest}
        isTesting={isTesting}
        testResult={testResult}
        testError={testError}
      />

      {/* Setup & API Key Manager Modal */}
      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        healthData={healthData}
        onConfigUpdated={fetchHealth}
      />
    </div>
  );
}
