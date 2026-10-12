import { config } from '../config.js';
import { extractDomain } from '../utils/domain.js';

export async function searchGooglePlaces(query, location) {
  if (!config.googlePlacesApiKey) {
    const error = new Error('Google Places API key is not configured in server/.env. Please set GOOGLE_PLACES_API_KEY to search live businesses.');
    error.status = 503;
    error.provider = 'google_places';
    error.code = 'UNCONFIGURED';
    throw error;
  }

  const trimmedQuery = (query || '').trim();
  const trimmedLocation = (location || '').trim();

  if (!trimmedQuery || !trimmedLocation) {
    const error = new Error('Both business search query and US location are required.');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const endpoint = 'https://places.googleapis.com/v1/places:searchText';
  const textQuery = `${trimmedQuery} in ${trimmedLocation}, USA`;

  const requestBody = {
    textQuery,
    pageSize: 20,
    languageCode: 'en'
  };

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.primaryType',
    'places.types',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.nationalPhoneNumber',
    'places.rating',
    'places.userRatingCount'
  ].join(',');

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.googlePlacesApiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(requestBody)
    });
  } catch (netErr) {
    const error = new Error(`Network failure connecting to Google Places API: ${netErr.message}`);
    error.status = 502;
    error.provider = 'google_places';
    throw error;
  }

  if (!response.ok) {
    let errorDetails = 'Unknown Google Places API error';
    try {
      const errData = await response.json();
      if (errData.error && errData.error.message) {
        errorDetails = `${errData.error.status || 'ERROR'}: ${errData.error.message}`;
      }
    } catch {
      errorDetails = `HTTP ${response.status} ${response.statusText}`;
    }

    const error = new Error(`Google Places API request failed: ${errorDetails}`);
    error.status = response.status >= 500 ? 502 : response.status;
    error.provider = 'google_places';
    throw error;
  }

  const data = await response.json();
  const rawPlaces = data.places || [];

  // Deduplicate and normalize
  const seenPlaceIds = new Set();
  const seenDomains = new Set();
  const leads = [];

  for (const place of rawPlaces) {
    if (!place.id || seenPlaceIds.has(place.id)) {
      continue;
    }
    seenPlaceIds.add(place.id);

    const website = place.websiteUri || null;
    const domain = website ? extractDomain(website) : null;

    if (domain && seenDomains.has(domain)) {
      continue; // Skip duplicate business domains in same search
    }
    if (domain) {
      seenDomains.add(domain);
    }

    const businessName = place.displayName?.text || 'Unnamed Home Décor Business';
    const category = formatCategory(place.primaryType || (place.types && place.types[0]));

    leads.push({
      id: `lead_${place.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      place_id: place.id,
      name: businessName,
      address: place.formattedAddress || 'Address not listed',
      category: category,
      types: place.types || [],
      website: website,
      domain: domain,
      source_url: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
      phone: place.nationalPhoneNumber || null,
      rating: place.rating !== undefined ? place.rating : null,
      user_ratings_total: place.userRatingCount || 0,
      search_query: trimmedQuery,
      search_location: trimmedLocation,
      created_at: new Date().toISOString()
    });
  }

  return leads;
}

function formatCategory(rawType) {
  if (!rawType) return 'Home Décor Retailer';
  return rawType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
