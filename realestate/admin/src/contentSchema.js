/**
 * Schema describing every editable content block of the website.
 * The admin panel renders forms from this — so any text, image or list
 * on the site can be changed without touching code.
 *
 * field types: text | textarea | number | image | boolean | select | list | group | listObj
 */
export const CONTENT_SCHEMA = [
  {
    key: 'hero',
    label: 'Homepage Hero',
    desc: 'Big headline area of the homepage.',
    fields: [
      { key: 'brand', label: 'Brand name (hero top)', type: 'text' },
      { key: 'badge', label: 'Badge / tagline', type: 'text' },
      { key: 'titleLine1', label: 'Title — line 1', type: 'text' },
      { key: 'titleLine2', label: 'Title — line 2 (accent)', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'primaryCta', label: 'Primary button', type: 'group', fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'to', label: 'Link (e.g. /properties)', type: 'text' },
      ]},
      { key: 'secondaryCta', label: 'Secondary button', type: 'group', fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'to', label: 'Link', type: 'text' },
      ]},
      { key: 'image', label: 'Hero image', type: 'image' },
    ],
  },
  {
    key: 'about',
    label: 'About Section',
    desc: 'Story shown on the homepage and About page.',
    fields: [
      { key: 'title', label: 'Eyebrow / title', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'paragraphs', label: 'Paragraphs', type: 'list', itemLabel: 'paragraph' },
      { key: 'highlights', label: 'Highlight points', type: 'list', itemLabel: 'point' },
      { key: 'image', label: 'About image', type: 'image' },
      { key: 'since', label: 'Established year', type: 'text' },
    ],
  },
  {
    key: 'stats',
    label: 'Statistics Band',
    desc: 'Numbers shown in the green band (homepage + about).',
    fields: [
      { key: 'items', label: 'Statistics', type: 'listObj', itemLabel: 'stat', fields: [
        { key: 'value', label: 'Value', type: 'number' },
        { key: 'suffix', label: 'Suffix (+, %…)', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
      ]},
    ],
  },
  {
    key: 'features',
    label: 'Why Gurukripa (Features)',
    desc: 'The 4 benefit cards.',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'items', label: 'Feature cards', type: 'listObj', itemLabel: 'card', fields: [
        { key: 'icon', label: 'Icon', type: 'select', options: ['shield', 'rupee', 'handshake', 'home'] },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Text', type: 'textarea' },
      ]},
    ],
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    desc: 'Customer reviews (auto-scrolling strip).',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'items', label: 'Reviews', type: 'listObj', itemLabel: 'review', fields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'property', label: 'Property / role (e.g. 3 BHK Buyer)', type: 'text' },
        { key: 'rating', label: 'Rating (1–5)', type: 'number' },
        { key: 'text', label: 'Review text', type: 'textarea' },
      ]},
    ],
  },
  {
    key: 'marquee',
    label: 'City Marquee',
    desc: 'Scrolling strip of city names.',
    fields: [
      { key: 'items', label: 'City names (Hindi or English)', type: 'list', itemLabel: 'city' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact Details',
    desc: 'Phone, WhatsApp, email, address — used in navbar, contact page & footer.',
    fields: [
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp (with country code)', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Office address', type: 'textarea' },
      { key: 'hours', label: 'Working hours', type: 'text' },
    ],
  },
  {
    key: 'footer',
    label: 'Footer Text',
    fields: [
      { key: 'company', label: 'Company name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'about', label: 'About text', type: 'textarea' },
      { key: 'rera', label: 'RERA Registration No. (optional)', type: 'text' },
      { key: 'gstin', label: 'GSTIN (optional)', type: 'text' },
      { key: 'facebook', label: 'Facebook URL (optional)', type: 'text' },
      { key: 'instagram', label: 'Instagram URL (optional)', type: 'text' },
    ],
  },
  {
    key: 'banner',
    label: 'Call-to-action Banner',
    desc: 'Red band before the footer.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'cta', label: 'Button', type: 'group', fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'to', label: 'Link', type: 'text' },
      ]},
    ],
  },
  {
    key: 'trust',
    label: 'Hero Trust Indicators',
    desc: 'Hero ke neeche chhote trust badges (Verified, Years, Specialist).',
    fields: [
      { key: 'items', label: 'Indicators', type: 'listObj', itemLabel: 'indicator', fields: [
        { key: 'icon', label: 'Icon', type: 'select', options: ['check', 'clock', 'pin'] },
        { key: 'label', label: 'Label', type: 'text' },
      ]},
    ],
  },
  {
    key: 'selected',
    label: 'Selected Properties Section',
    desc: 'Homepage ka featured properties section ka heading.',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'sub', label: 'Subtitle', type: 'textarea' },
    ],
  },
  {
    key: 'services',
    label: 'Our Services',
    desc: 'Homepage services cards — sirf wahi rakho jo business deta hai.',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'items', label: 'Service cards', type: 'listObj', itemLabel: 'service', fields: [
        { key: 'icon', label: 'Icon', type: 'select', options: ['home', 'land', 'building', 'rupee', 'doc', 'key', 'shield', 'handshake'] },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Text', type: 'textarea' },
      ]},
    ],
  },
  {
    key: 'areas',
    label: 'Areas We Serve',
    desc: 'Homepage pe service areas (Jaipur localities).',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'sub', label: 'Subtitle', type: 'textarea' },
      { key: 'items', label: 'Area names', type: 'list', itemLabel: 'area' },
    ],
  },
  {
    key: 'founder',
    label: 'Founder / Owner',
    desc: 'Founder card — trust ke liye (About section ke saath).',
    fields: [
      { key: 'name', label: 'Founder name', type: 'text' },
      { key: 'title', label: 'Designation', type: 'text' },
      { key: 'bio', label: 'Bio / message', type: 'textarea' },
      { key: 'image', label: 'Founder photo', type: 'image' },
      { key: 'since', label: 'Since (year)', type: 'text' },
    ],
  },
  {
    key: 'finder',
    label: 'Find a Home Page (Requirement Form)',
    desc: 'Poore Find-a-Home page ka content — form labels, side card, success message — sab admin se.',
    fields: [
      { key: 'eyebrow', label: 'Hero eyebrow', type: 'text' },
      { key: 'title', label: 'Hero title', type: 'text' },
      { key: 'sub', label: 'Hero subtitle', type: 'textarea' },
      { key: 'formTitle', label: 'Form title', type: 'text' },
      { key: 'typeLabel', label: 'Property type label', type: 'text' },
      { key: 'cityLabel', label: 'City label', type: 'text' },
      { key: 'budgetLabel', label: 'Budget label', type: 'text' },
      { key: 'bedroomsLabel', label: 'Bedrooms label', type: 'text' },
      { key: 'timelineLabel', label: 'Timeline label', type: 'text' },
      { key: 'nameLabel', label: 'Name label', type: 'text' },
      { key: 'phoneLabel', label: 'Phone label', type: 'text' },
      { key: 'whatsappLabel', label: 'WhatsApp label', type: 'text' },
      { key: 'submitLabel', label: 'Submit button text', type: 'text' },
      { key: 'image', label: 'Side image', type: 'image' },
      { key: 'sideTitle', label: 'Side card title', type: 'text' },
      { key: 'sideText', label: 'Side card text', type: 'textarea' },
      { key: 'sideTrust', label: 'Side trust points', type: 'list', itemLabel: 'point' },
      { key: 'helpTitle', label: 'Need help heading', type: 'text' },
      { key: 'successTitle', label: 'Success title', type: 'text' },
      { key: 'successText', label: 'Success message', type: 'textarea' },
    ],
  },
  {
    key: 'pages',
    label: 'Page Headings (Properties / About / Contact)',
    desc: 'Har page ke upar wale headings — admin se poori website control karo.',
    fields: [
      { key: 'properties', label: 'Properties page', type: 'group', fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'sub', label: 'Subtitle', type: 'textarea' },
      ]},
      { key: 'about', label: 'About page', type: 'group', fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'sub', label: 'Subtitle', type: 'textarea' },
      ]},
      { key: 'contact', label: 'Contact page', type: 'group', fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'sub', label: 'Subtitle', type: 'textarea' },
      ]},
    ],
  },
  {
    key: 'extras',
    label: 'Other Pages Content (Detail / 404 / Contact / Footer)',
    desc: 'Bache hue pages ke texts — sab admin se edit hote hain.',
    fields: [
      { key: 'detail', label: 'Property detail page', type: 'group', fields: [
        { key: 'detailsHeading', label: 'Details heading', type: 'text' },
        { key: 'amenitiesHeading', label: 'Amenities heading', type: 'text' },
        { key: 'similarHeading', label: 'Similar homes heading', type: 'text' },
        { key: 'enquiryTitle', label: 'Enquiry card title', type: 'text' },
        { key: 'enquirySub', label: 'Enquiry divider text', type: 'text' },
        { key: 'keyHighlightsHeading', label: 'Key highlights heading', type: 'text' },
      ]},
      { key: 'notFound', label: '404 page', type: 'group', fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'sub', label: 'Subtitle', type: 'textarea' },
      ]},
      { key: 'contactPage', label: 'Contact page texts', type: 'group', fields: [
        { key: 'enquiryHeading', label: 'Enquiry form heading', type: 'text' },
        { key: 'enquirySub', label: 'Enquiry form subtitle', type: 'textarea' },
        { key: 'officeHoursHeading', label: 'Office hours heading', type: 'text' },
        { key: 'visitHeading', label: 'Visit us heading', type: 'text' },
      ]},
      { key: 'footerCities', label: 'Footer cities list', type: 'list', itemLabel: 'city' },
      { key: 'propertyTypes', label: 'Property types (Duplex, Villa, Haveli…)', type: 'list', itemLabel: 'type', desc: 'Yahan jo types hain wahi Add Property form ke Type dropdown me dikhenge.' },
    ],
  },
  {
    key: 'seo',
    label: 'SEO & Browser Tab',
    fields: [
      { key: 'title', label: 'Browser tab title', type: 'text' },
      { key: 'description', label: 'Meta description', type: 'textarea' },
    ],
  },
];
