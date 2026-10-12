import React from 'react';
import { Search, MapPin, Sparkles, Loader2, RotateCcw } from 'lucide-react';

const CATEGORY_PRESETS = [
  'Home Décor Boutique',
  'Interior Design Studio',
  'Luxury Furnishings Showroom',
  'Home Goods Retailer',
  'Architectural Lighting & Decor'
];

const LOCATION_PRESETS = [
  'Dallas, Texas',
  'High Point, NC',
  'Los Angeles, CA',
  'New York, NY',
  'Atlanta, GA',
  'Miami, FL',
  'Chicago, IL'
];

export default function SearchForm({
  query,
  setQuery,
  location,
  setLocation,
  onSearch,
  isLoading,
  onReset
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || !location.trim()) return;
    onSearch();
  };

  return (
    <div className="glass-panel search-card">
      <form onSubmit={handleSubmit}>
        <div className="search-grid">
          {/* Query Input */}
          <div className="form-group">
            <label htmlFor="search-query">
              <Sparkles size={14} color="#60a5fa" />
              <span>Business Category or Keyword</span>
            </label>
            <div className="input-wrapper">
              <Search size={16} className="input-icon" />
              <input
                id="search-query"
                type="text"
                className="text-input"
                placeholder="e.g. Home Decor Boutique, Interior Design Showroom"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="chip-group">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="chip-btn"
                  onClick={() => setQuery(cat)}
                  disabled={isLoading}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location Input */}
          <div className="form-group">
            <label htmlFor="search-location">
              <MapPin size={14} color="#f87171" />
              <span>US City or State</span>
            </label>
            <div className="input-wrapper">
              <MapPin size={16} className="input-icon" />
              <input
                id="search-location"
                type="text"
                className="text-input"
                placeholder="e.g. Dallas, Texas or High Point, NC"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="chip-group">
              {LOCATION_PRESETS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className="chip-btn"
                  onClick={() => setLocation(loc)}
                  disabled={isLoading}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !query.trim() || !location.trim()}
              style={{ minWidth: '150px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Discover Leads</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={onReset}
              disabled={isLoading}
              title="Reset Search"
              style={{ padding: '12px' }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
