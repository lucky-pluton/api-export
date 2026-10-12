/**
 * ISOLATED SYNTHETIC FIXTURES FOR UI PREVIEW & OFFLINE TESTING ONLY.
 * 
 * NOTICE:
 * These entries are clearly-labeled synthetic demonstration data to test the UI 
 * layout when external API credentials are not yet configured.
 * They are NEVER mixed with live API responses and are explicitly flagged as DEMO.
 */
export const DEMO_LEADS = [
  {
    id: 'demo_lead_1',
    place_id: 'DEMO_PLACE_DALLAS_01',
    name: '[DEMO FIXTURE] Dallas Artisanal Living & Furnishings',
    address: '1420 Dragon St, Dallas, TX 75207',
    category: 'Home Goods Store',
    types: ['home_goods_store', 'store', 'point_of_interest'],
    website: 'https://dallasartisanal.example',
    domain: 'dallasartisanal.example',
    source_url: 'https://maps.google.com',
    phone: '(214) 555-0144',
    rating: 4.8,
    user_ratings_total: 62,
    is_demo: true,
    contacts: [
      {
        id: 'demo_contact_1',
        email: 'buyer@dallasartisanal.example',
        first_name: 'Jessica',
        last_name: 'Miller',
        position: 'Head of Merchandising & Sourcing',
        department: 'Purchasing',
        confidence: 94,
        sources: [
          { uri: 'https://dallasartisanal.example/about-us', domain: 'dallasartisanal.example' }
        ],
        verification_status: 'valid'
      }
    ]
  },
  {
    id: 'demo_lead_2',
    place_id: 'DEMO_PLACE_HIGHPOINT_02',
    name: '[DEMO FIXTURE] High Point Design Studio & Curated Accents',
    address: '209 S Main St, High Point, NC 27260',
    category: 'Interior Design Studio',
    types: ['furniture_store', 'interior_designer'],
    website: 'https://hpcurated.example',
    domain: 'hpcurated.example',
    source_url: 'https://maps.google.com',
    phone: '(336) 555-0182',
    rating: 4.9,
    user_ratings_total: 48,
    is_demo: true,
    contacts: [
      {
        id: 'demo_contact_2',
        email: 'partnerships@hpcurated.example',
        first_name: 'Marcus',
        last_name: 'Vance',
        position: 'Senior Buying Director',
        department: 'Executive',
        confidence: 88,
        sources: [
          { uri: 'https://hpcurated.example/contact', domain: 'hpcurated.example' }
        ],
        verification_status: 'valid'
      }
    ]
  },
  {
    id: 'demo_lead_3',
    place_id: 'DEMO_PLACE_ATLANTA_03',
    name: '[DEMO FIXTURE] Peachtree Architectural Home & Lighting',
    address: '351 Peachtree St NE, Atlanta, GA 30308',
    category: 'Lighting & Decor Showroom',
    types: ['home_goods_store'],
    website: 'https://peachtreedecor.example',
    domain: 'peachtreedecor.example',
    source_url: 'https://maps.google.com',
    phone: '(404) 555-0193',
    rating: 4.6,
    user_ratings_total: 29,
    is_demo: true,
    contacts: []
  }
];
