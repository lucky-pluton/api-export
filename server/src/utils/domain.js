/**
 * Extracts a normalized, clean domain name from a URL or raw string.
 * Example: 'https://www.highpointfurnishings.com/about?ref=1' -> 'highpointfurnishings.com'
 */
export function extractDomain(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let cleaned = rawUrl.trim();
  if (!cleaned) return null;

  // Add protocol if missing for URL parser
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    let hostname = parsed.hostname.toLowerCase();

    // Strip leading 'www.'
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    // Basic domain validation (must contain at least one dot and valid characters)
    if (!hostname.includes('.') || hostname.length < 4) {
      return null;
    }

    // Filter out common generic hosting platforms if not standalone
    const invalidHosts = ['facebook.com', 'instagram.com', 'yelp.com', 'google.com', 'maps.google.com', 'twitter.com', 'linkedin.com'];
    if (invalidHosts.includes(hostname)) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}
