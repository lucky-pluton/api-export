/**
 * Generates personalized B2B home décor export outreach email copy.
 * Compliant with B2B cold outreach standards (truthful header, physical address, opt-out mechanism).
 */
export function buildPersonalizedEmail({
  businessName = 'Your Boutique',
  contactName = '',
  category = 'Home Décor & Interior Design',
  location = 'United States',
  customPitch = ''
}) {
  const greeting = contactName ? `Dear ${contactName},` : `Dear ${businessName} Buying Team,`;
  const subject = `Curated Handcrafted Home Décor Collection for ${businessName}`;

  const bodyText = `${greeting}

I hope this email finds you well.

I came across ${businessName} while reviewing leading design studios and home décor retailers in ${location}. Your curated aesthetic and focus on ${category.toLowerCase()} caught our attention.

We represent an ethical export workshop specializing in premium handcrafted home accents, sustainable ceramics, woven textiles, and architectural brass hardware tailored for high-end boutique retailers and interior showrooms in the US.

Our upcoming collection features:
• Artisan-crafted tabletop & decorative vessel series with low minimum order quantities (MOQs).
• Responsibly sourced, certified natural materials designed for premium retail margins (up to 3.2x markup).
• US-standard duty handling, reliable air & ocean freight forwarding, and barcoded retail-ready packaging.

${customPitch ? customPitch + '\n\n' : ''}Would you be open to a quick 5-minute preview of our Fall/Spring wholesale lookbook and wholesale line sheet?

Warm regards,

Export Operations Team
API Export B2B Global Trade
100 Trade Tower Blvd, Suite 400, Wilmington, DE 19801
Email: export@apiexport.example

---
Compliance & Opt-out Notice:
You received this personalized commercial inquiry because ${businessName} operates in the home furnishings and interior décor sector. If you are not the right contact or prefer not to receive wholesale export previews, simply reply with "Unsubscribe" or "Opt-Out" and we will immediately remove your address from our correspondence list.`;

  const htmlBody = bodyText
    .split('\n\n')
    .map(para => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #2d3748; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return {
    subject,
    bodyText,
    htmlBody: `<div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">${htmlBody}</div>`
  };
}
