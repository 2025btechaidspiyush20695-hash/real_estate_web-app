require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const Content = require('./models/Content');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gurukripa_estate';

const defaultContent = {
  hero: {
    brand: 'Gurukripa Estate',
    badge: 'विश्वास से घर खरीदिए • Trusted since 2008',
    titleLine1: 'Apna Ghar,',
    titleLine2: 'Apni Pehchaan',
    subtitle:
      'From cosy 2BHK houses to grand havelis — discover honest homes across Rajasthan with transparent pricing and zero brokerage hassle.',
    primaryCta: { label: 'Explore Homes', to: '/properties' },
    secondaryCta: { label: 'Talk to an Advisor', to: '/contact' },
    image: '/uploads/seed/hero.jpg',
  },
  about: {
    title: 'Ghar wahi, jahan dil bole',
    heading: 'Gurukripa — where every home tells a story',
    paragraphs: [
      'Gurukripa Estate was born in the pink lanes of Jaipur with one simple belief — a home is not just brick and mortar, it is the courtyard where your children learn their first steps and your parents pour their first chai.',
      'For over 15 years we have helped 2,500+ families find homes that fit their budget and their dreams — no hidden charges, no exaggerated listings, just honest deals.',
    ],
    highlights: [
      'Zero brokerage for buyers',
      'Legal verification on every property',
      'Local agents across 9 cities',
      'Post-sale support for 3 years',
    ],
    image: '/uploads/seed/about.jpg',
    since: '2008',
  },
  stats: {
    items: [
      { value: 2500, suffix: '+', label: 'Families Housed' },
      { value: 15, suffix: '+', label: 'Years of Trust' },
      { value: 9, suffix: '+', label: 'Locations Served' },
      { value: 98, suffix: '%', label: 'Happy Clients' },
    ],
  },
  features: {
    title: 'Why families choose Gurukripa',
    items: [
      { icon: 'shield', title: 'Verified Titles', text: 'Every property is legally vetted with clear ownership documents.' },
      { icon: 'rupee', title: 'Honest Pricing', text: 'Market-based fair prices. No inflated listings, no hidden charges.' },
      { icon: 'handshake', title: 'Transparent Process', text: 'Clear documentation, honest pricing and a smooth transaction process — no surprises.' },
      { icon: 'home', title: 'Local Expertise', text: 'Agents who know each mohalla, market and metro station by heart.' },
    ],
  },
  testimonials: {
    title: 'Kya kehte hain hamare parivaar',
    items: [
      { name: 'Rakesh & Sunita Sharma', city: 'Vaishali Nagar, Jaipur', property: '3 BHK Bungalow Buyer', rating: 5, text: 'We searched for months. Gurukripa found us a 3BHK within our budget and handled all the paperwork. Felt like family, not agents.' },
      { name: 'Priya Menon', city: 'Udaipur', property: 'Haveli Home Buyer', rating: 5, text: 'As a single woman buying her first home, I was nervous. Their team was patient, transparent and never pushy. Highly recommend!' },
      { name: 'Amit Verma', city: 'Ajmer', property: 'Plot + House Builder', rating: 4, text: 'Bought a plot and built my dream house. They even connected me with a trusted local contractor. Wonderful experience.' },
      { name: 'Farhan & Nazia Qureshi', city: 'Jodhpur', property: '2 BHK Rental Tenant', rating: 5, text: 'Rented our first flat through Gurukripa. Zero brokerage, genuine listing, and the owner was verified. Shukriya Gurukripa!' },
    ],
  },
  trust: {
    items: [
      { icon: 'check', label: 'Verified Properties' },
      { icon: 'clock', label: '15+ Years Experience' },
      { icon: 'pin', label: 'Jaipur Specialist' },
    ],
  },
  selected: {
    title: 'Hamari Selected Properties',
    sub: 'Jaipur mein hamare handpicked residential properties — har ek verified aur site-visit ready.',
  },
  services: {
    title: 'Hum sirf ghar nahi, poora solution dete hain',
    items: [
      { icon: 'home', title: 'Residential Properties', text: 'Verified houses, flats, bungalows aur villas — budget ke hisaab se.' },
      { icon: 'land', title: 'Plots & Land', text: 'Residential plots aur agricultural land, clear title ke saath.' },
      { icon: 'rupee', title: 'Property Investment', text: 'High-growth areas me investment options, ROI analysis ke saath.' },
      { icon: 'doc', title: 'Legal & Documentation', text: 'Title verification, registration aur paperwork — hum sambhalte hain.' },
    ],
  },
  areas: {
    title: 'Jaipur mein hum kahan available hain?',
    sub: 'Har area me local experts — jo mohalla, market aur metro ko by heart jaante hain.',
    items: ['Vaishali Nagar', 'Mansarovar', 'Jagatpura', 'Malviya Nagar', 'Ajmer Road', 'Bani Park', 'Sitapura', 'Civil Lines'],
  },
  founder: {
    name: 'Rajesh Sharma',
    title: 'Founder & Director, Gurukripa Estate',
    bio: 'Ghar ka business sirf deal nahi, rishta hai — ye soch ke saath 2008 me Gurukripa Estate ki shuruaat hui. Aaj bhi har deal me khud involved hoon, kyunki har ghar ke saath ek parivaar ki kahani judi hoti hai.',
    image: '/uploads/seed/about.jpg',
    since: '2008',
  },
  marquee: {
    items: ['जयपुर', 'Jaipur', 'उदयपुर', 'Udaipur', 'जोधपुर', 'Jodhpur', 'अजमेर', 'Ajmer', 'कोटा', 'Kota', 'बीकानेर', 'Bikaner', 'पुष्कर', 'Pushkar', 'टोंक', 'Tonk'],
  },
  contact: {
    // 👉 Ye saari values ADMIN PANEL se change hoti hain:
    //    Site Content → Contact Details. Jo yahan daaloge wahi website pe dikhega.
    phone: '+91 98290 12345',
    whatsapp: '+91 98290 12345',
    email: 'namaste@gurukripa.in',
    address: 'B-42, Madhyam Marg, Mansarovar, Jaipur, Rajasthan 302020',
    hours: 'Mon – Sat, 9:30 AM – 7:00 PM',
  },
  footer: {
    company: 'Gurukripa Estate',
    tagline: 'Trusted Real Estate Since 2008',
    about: 'Gurukripa Estate is a Rajasthan-based real estate advisory helping families buy, sell and rent homes with honesty since 2008.',
    rera: '',
    gstin: '',
    facebook: '',
    instagram: '',
  },
  banner: {
    title: 'Sapno ka ghar dhoondh rahe hain?',
    text: 'Book a free site visit this weekend — chai aur site visit, dono humari taraf se!',
    cta: { label: 'Book Free Visit', to: '/contact' },
  },
  finder: {
    eyebrow: 'Personal Property Finder',
    title: 'Apna Perfect Ghar Dhoondhiye',
    sub: 'Aapki zaroorat humein batayein, hum aapke liye suitable properties shortlist karenge — free aur bina kisi commitment ke.',
    formTitle: 'Aap kya dhoondh rahe hain?',
    typeLabel: 'Property type',
    cityLabel: 'Kahan chahiye?',
    budgetLabel: 'Aapka budget?',
    bedroomsLabel: 'Kitne bedrooms?',
    timelineLabel: 'Kab tak lena hai?',
    nameLabel: 'Aapka naam',
    phoneLabel: 'Phone number',
    whatsappLabel: 'WhatsApp number (optional)',
    submitLabel: 'Find My Home',
    sideTitle: "Can't find what you're looking for?",
    sideText: 'Tell us what you need. Our property advisor will personally help you find suitable options.',
    sideTrust: [
      'Verified properties',
      'Local Jaipur expertise',
      'Transparent pricing',
      'Personal assistance',
    ],
    helpTitle: 'Need help now?',
    image: '/uploads/seed/hero.jpg',
    successTitle: 'Dhanyavaad!',
    successText: 'Aapki requirement mil gayi. Humari team 2 working hours ke andar aapse contact karegi aur suitable properties shortlist karegi.',
  },
  pages: {
    properties: {
      eyebrow: 'Apni Manzil Chuniye',
      title: 'Homes for Every Family',
      sub: 'Verified houses, flats, bungalows aur havelis — honest prices ke saath, zero brokerage.',
    },
    about: {
      eyebrow: 'Hamari Kahani',
      title: 'The Gurukripa Story',
      sub: 'From a small office in Mansarovar to thousands of families across Rajasthan.',
    },
    contact: {
      eyebrow: 'Baatein Karte Hain',
      title: 'Talk to Our Team',
      sub: 'Free consultation, honest advice — aur haan, chai humari taraf se.',
    },
  },
  extras: {
    detail: {
      detailsHeading: 'Property Details',
      amenitiesHeading: 'Amenities & Features',
      similarHeading: 'Similar Homes',
      enquiryTitle: 'Interested? Call us',
      enquirySub: 'or send an enquiry',
      keyHighlightsHeading: 'Key Highlights',
    },
    notFound: {
      title: 'Yeh rasta kahin nahi jaata',
      sub: 'The page you are looking for has moved or never existed.',
    },
    contactPage: {
      enquiryHeading: 'Send an Enquiry',
      enquirySub: 'We reply within 2 working hours, usually faster.',
      officeHoursHeading: 'Office Hours',
      visitHeading: 'Visit Us',
    },
    footerCities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Ajmer', 'Kota'],
    propertyTypes: ['House', 'Bungalow', 'Flat', 'Villa', 'Haveli', 'Duplex', 'Townhouse'],
  },
  seo: {
    title: 'Gurukripa Estate — Buy, Sell & Rent Homes in Rajasthan',
    description: 'Find verified houses, bungalows, flats and havelis across Jaipur, Udaipur, Jodhpur and more. Zero brokerage, honest pricing.',
  },
};

const seedProperties = [
  {
    title: 'Gulmohar Bungalow — 4BHK with Garden',
    description:
      'A beautiful standalone bungalow in the heart of Vaishali Nagar. This 4-bedroom home features a private garden with gulmohar trees, a pooja room, marble flooring and a modern modular kitchen. Vaastu-aligned with east-facing entrance. Walking distance to Central Park and major schools.',
    price: 18500000, type: 'Bungalow', status: 'sale', city: 'Jaipur', locality: 'Vaishali Nagar',
    address: 'Plot 12, Gulmohar Lane, Vaishali Nagar, Jaipur',
    area: 2400, plotArea: 450, bedrooms: 4, bathrooms: 4, floors: 2, parking: 2,
    yearBuilt: 2019, possession: 'Ready to move', furnishing: 'Semi-furnished',
    amenities: ['Garden', 'Modular Kitchen', 'Power Backup', 'CCTV', 'Parking', 'Vaastu Aligned', 'Pooja Room', 'Water 24x7'],
    images: ['/uploads/seed/prop-1.jpg'], featured: true,
  },
  {
    title: 'Sunrise Heights — 3BHK Flat, 12th Floor',
    description:
      'Spacious 3BHK apartment in a gated society with clubhouse, swimming pool and children’s play area. Corner flat with 270° city views, covered parking, and 24x7 security. Just 5 minutes from the metro station and 10 minutes from the airport.',
    price: 9500000, type: 'Flat', status: 'sale', city: 'Jaipur', locality: 'Jagatpura',
    address: 'Sunrise Heights, Jagatpura, Jaipur',
    area: 1650, plotArea: 0, bedrooms: 3, bathrooms: 3, floors: 1, parking: 1,
    yearBuilt: 2022, possession: 'Ready to move', furnishing: 'Semi-furnished',
    amenities: ['Gym', 'Swimming Pool', 'Clubhouse', 'Lift', '24x7 Security', 'Children Play Area', 'Power Backup', 'CCTV'],
    images: ['/uploads/seed/prop-2.jpg'], featured: true, availability: 'sold',
  },
  {
    title: 'Haveli Heritage Home — Jharokha Architecture',
    description:
      'A restored heritage haveli with carved jharokhas, traditional arches and a central courtyard. Ideal for a boutique stay, homestay or a family that loves history. Original sandstone carvings preserved, modern plumbing and wiring newly done.',
    price: 42000000, type: 'Haveli', status: 'sale', city: 'Udaipur', locality: 'Lal Ghat',
    address: 'Near Gangaur Ghat, Lal Ghat, Udaipur',
    area: 5200, plotArea: 900, bedrooms: 6, bathrooms: 5, floors: 3, parking: 2,
    yearBuilt: 1948, possession: 'Ready to move', furnishing: 'Fully furnished',
    amenities: ['Courtyard', 'Heritage Design', 'Water 24x7', 'Parking', 'Garden', 'Vaastu Aligned'],
    images: ['/uploads/seed/prop-3.jpg'], featured: true,
  },
  {
    title: 'Aakash Duplex — Rooftop Terrace + Solar',
    description:
      'Modern duplex with an open rooftop terrace perfect for evening chai and family gatherings. Comes with 5kW solar panels, a home automation setup and a beautifully designed staircase with skylight.',
    price: 14800000, type: 'Duplex', status: 'sale', city: 'Jaipur', locality: 'Malviya Nagar',
    address: 'C-89, Shipra Path, Malviya Nagar, Jaipur',
    area: 2100, plotArea: 320, bedrooms: 4, bathrooms: 3, floors: 3, parking: 1,
    yearBuilt: 2021, possession: 'Ready to move', furnishing: 'Semi-furnished',
    amenities: ['Rooftop Terrace', 'Solar Panels', 'Home Automation', 'Parking', 'Power Backup', 'Water 24x7'],
    images: ['/uploads/seed/prop-4.jpg'], featured: true,
  },
  {
    title: 'Chhotu Ghar — Cozy 2BHK, Perfect Starter Home',
    description:
      'A compact and well-maintained 2BHK house in a quiet colony. Tulsi planter in the front yard, tiled roof, and a small store room. Great first home for a young family. Priced well below market.',
    price: 5200000, type: 'House', status: 'sale', city: 'Ajmer', locality: 'Shastri Nagar',
    address: 'House 23, Shastri Nagar, Ajmer',
    area: 1100, plotArea: 180, bedrooms: 2, bathrooms: 2, floors: 1, parking: 1,
    yearBuilt: 2015, possession: 'Ready to move', furnishing: 'Unfurnished',
    amenities: ['Garden', 'Parking', 'Water 24x7', 'CCTV'],
    images: ['/uploads/seed/prop-5.jpg'],
  },
  {
    title: 'Gurukripa Villa — Courtyard Living at its Best',
    description:
      'This modern villa wraps around a beautiful central courtyard — diya niches, a small fountain and a mehendi corner. Sliding glass walls open the living room to the court. True Rajasthani-modern living on the city fringe.',
    price: 27500000, type: 'Villa', status: 'sale', city: 'Jaipur', locality: 'Sitapura',
    address: 'Villa 7, Gurukripa Greens, Sitapura, Jaipur',
    area: 3200, plotArea: 600, bedrooms: 4, bathrooms: 4, floors: 2, parking: 2,
    yearBuilt: 2023, possession: 'Ready to move', furnishing: 'Semi-furnished',
    amenities: ['Courtyard', 'Garden', 'Swimming Pool', 'Power Backup', 'CCTV', 'Vaastu Aligned', 'Modular Kitchen'],
    images: ['/uploads/seed/prop-6.jpg'], featured: true, availability: 'limited',
  },
  {
    title: 'Sunrise Courtyard Home — 5BHK Luxury',
    description:
      'A grand modern home with traditional haveli touches — jharokha balconies, sandstone facade and a courtyard fountain. Perfect for a large joint family. Two independent wings, servant quarter and a triple-car porch.',
    price: 38000000, type: 'Villa', status: 'sale', city: 'Jaipur', locality: 'Bani Park',
    address: 'Sunrise Estate, Bani Park, Jaipur',
    area: 4800, plotArea: 800, bedrooms: 5, bathrooms: 6, floors: 3, parking: 3,
    yearBuilt: 2020, possession: 'Ready to move', furnishing: 'Fully furnished',
    amenities: ['Courtyard', 'Servant Quarter', 'Garden', 'Power Backup', 'CCTV', 'Water 24x7', 'Vaastu Aligned'],
    images: ['/uploads/seed/hero.jpg'],
  },
  {
    title: 'Duskview Bungalow — Rent in Civil Lines',
    description:
      'Beautiful semi-furnished bungalow available on rent for a family or corporate lease. Wooden flooring in bedrooms, landscaped lawn, and a driver room. Ideal for executives relocating to the city.',
    price: 45000, type: 'Bungalow', status: 'rent', city: 'Jodhpur', locality: 'Civil Lines',
    address: '12, High Court Colony, Civil Lines, Jodhpur',
    area: 2300, plotArea: 400, bedrooms: 3, bathrooms: 3, floors: 2, parking: 2,
    yearBuilt: 2018, possession: 'Immediate', furnishing: 'Semi-furnished',
    amenities: ['Garden', 'Parking', 'Water 24x7', 'Power Backup', 'Servant Room'],
    images: ['/uploads/seed/prop-10.jpg'],
  },
  {
    title: 'Sunrise Garden Flat — 2BHK on Rent',
    description:
      'Bright 2BHK on the 4th floor with lift. Vaastu-friendly layout, modular kitchen and a balcony facing the sunrise. Rent includes society maintenance. Suitable for bachelors or small families.',
    price: 18000, type: 'Flat', status: 'rent', city: 'Kota', locality: 'Aerodrome Circle',
    address: 'Sunrise Residency, Aerodrome Circle, Kota',
    area: 1050, plotArea: 0, bedrooms: 2, bathrooms: 2, floors: 1, parking: 1,
    yearBuilt: 2021, possession: 'Immediate', furnishing: 'Semi-furnished',
    amenities: ['Lift', 'Parking', '24x7 Security', 'Power Backup', 'Children Play Area'],
    images: ['/uploads/seed/prop-9.jpg'],
  },
];

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('[seed] connected');

  // Admin user — SIRF fresh install par banao (jab koi admin hi na ho).
  // Ownership transfer ke baad purana email kabhi wapas NAHI banta (real owner preserve hota hai).
  // Fresh install default admin = ADMIN_EMAIL ya SMTP_USER (jo .env me real hai) — koi hardcode nahi
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'owner@gurukripa.in').toLowerCase();
  const anyAdmin = await User.findOne({ role: 'admin' });
  if (anyAdmin) {
    console.log(`[seed] admin already exists (${anyAdmin.email}) — skipping admin creation`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || 'Gurukripa Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
    });
    console.log(`[seed] admin created -> ${adminEmail}`);
  }

  // Content blocks
  for (const [key, data] of Object.entries(defaultContent)) {
    await Content.findOneAndUpdate(
      { key },
      { $setOnInsert: { data, label: key } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  // Migration: naye fields ko existing blocks me merge karo (admin edits overwrite NAHI hote)
  for (const [key, defData] of Object.entries(defaultContent)) {
    const doc = await Content.findOne({ key });
    if (!doc) continue;
    let changed = false;
    for (const [k, v] of Object.entries(defData)) {
      if (doc.data[k] === undefined) {
        doc.data[k] = v;
        changed = true;
      }
    }
    if (changed) await doc.save();
  }
  console.log(`[seed] content blocks ready (${Object.keys(defaultContent).length})`);

  // Properties (skip if any exist — keeps admin edits intact)
  const count = await Property.countDocuments();
  if (count === 0) {
    const withSlugs = seedProperties.map((p, i) => ({
      ...p,
      slug: slugify(p.title) || `property-${i + 1}`,
    }));
    await Property.insertMany(withSlugs);
    console.log(`[seed] ${seedProperties.length} properties inserted`);
  } else {
    console.log(`[seed] ${count} properties already present, skipping insert`);
  }

  await mongoose.disconnect();
  console.log('[seed] done');
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
