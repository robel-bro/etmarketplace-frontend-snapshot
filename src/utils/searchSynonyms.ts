// ======================================================================
// ULTRA‑COMPREHENSIVE SYNONYM MAP + AUTO‑NORMALISATION
// ======================================================================

// ----------------------------------------------------------
// 1. SYNONYM MAP – every category & subcategory from your seed
// ----------------------------------------------------------
const SYNONYM_MAP: Record<string, string> = {
  // ────────────────────────────────────────────────
  // GENERAL (must be first so specific overrides win)
  // ────────────────────────────────────────────────
  clothes: 'fashion',
  clothing: 'fashion',
  apparel: 'fashion',
  cloth: 'fashion',
  cloths: 'fashion',
  outfit: 'fashion',
  wardrobe: 'fashion',

  // ────────────────────────────────────────────────
  // ELECTRONICS
  // ────────────────────────────────────────────────
  electronics: 'electronics',
  electronic: 'electronics',
  gadgets: 'electronics',
  'electronic device': 'electronics',
  'tech gadgets': 'electronics',
  computers: 'electronics',        // broad – covers all electronics
  computer: 'electronics',
  pc: 'desktops',                  // more specific when alone
  laptop: 'laptops',
  notebook: 'laptops',
  'notebook computer': 'laptops',
  macbook: 'laptops',
  chromebook: 'laptops',
  'gaming laptop': 'laptops',
  phone: 'mobile phones',
  'cell phone': 'mobile phones',
  cellphone: 'mobile phones',
  'mobile phone': 'mobile phones',
  'smart phone': 'mobile phones',
  smartphone: 'mobile phones',
  'android phone': 'mobile phones',
  iphone: 'mobile phones',
  'samsung galaxy': 'mobile phones',
  'google pixel': 'mobile phones',
  oneplus: 'mobile phones',
  xiaomi: 'mobile phones',
  'feature phone': 'mobile phones',
  telephone: 'mobile phones',
  tablet: 'tablets',
  ipad: 'tablets',
  'android tablet': 'tablets',
  'samsung tab': 'tablets',
  desktop: 'desktops',
  'desktop computer': 'desktops',
  'gaming pc': 'desktops',
  imac: 'desktops',
  monitor: 'monitors',
  'computer monitor': 'monitors',
  'gaming monitor': 'monitors',
  display: 'monitors',
  screen: 'monitors',
  camera: 'cameras',
  dslr: 'cameras',
  'mirrorless camera': 'cameras',
  gopro: 'cameras',
  headphones: 'audio & headphones',
  headphone: 'audio & headphones',
  earphones: 'audio & headphones',
  earbuds: 'audio & headphones',
  speaker: 'audio & headphones',
  'bluetooth speaker': 'audio & headphones',
  soundbar: 'audio & headphones',
  airpods: 'audio & headphones',
  smartwatch: 'wearable tech',
  'fitness tracker': 'wearable tech',
  fitbit: 'wearable tech',
  'apple watch': 'wearable tech',
  tv: 'tv & video',
  television: 'tv & video',
  'smart tv': 'tv & video',
  'led tv': 'tv & video',
  'oled tv': 'tv & video',
  projector: 'tv & video',
  'tv set': 'tv & video',
  console: 'gaming consoles',
  playstation: 'gaming consoles',
  xbox: 'gaming consoles',
  nintendo: 'gaming consoles',
  'smart home': 'smart home devices',
  'smart speaker': 'smart home devices',
  'google home': 'smart home devices',
  echo: 'smart home devices',
  alexa: 'smart home devices',
  kindle: 'e-readers',
  'e-reader': 'e-readers',
  router: 'networking devices',
  wifi: 'networking devices',
  modem: 'networking devices',
  switch: 'networking devices',

  // ────────────────────────────────────────────────
  // FASHION (Men, Women, Kids, Shoes, Bags, etc.)
  // ────────────────────────────────────────────────
  // Men – general
  'men cloth': "men's fashion",
  'man cloth': "men's fashion",
  'men clothes': "men's fashion",
  'man clothes': "men's fashion",
  'mens clothing': "men's fashion",
  'men clothing': "men's fashion",
  'men wear': "men's fashion",
  'man wear': "men's fashion",
  'gentleman wear': "men's fashion",
  'for him': "men's fashion",
  'male clothes': "men's fashion",
  // Women – general
  'women cloth': "women's fashion",
  'woman cloth': "women's fashion",
  'women clothes': "women's fashion",
  'woman clothes': "women's fashion",
  'womens clothing': "women's fashion",
  'ladies clothing': "women's fashion",
  'ladies wear': "women's fashion",
  'for her': "women's fashion",
  'girl clothes': "women's fashion",
  'female clothes': "women's fashion",
  // Kids
  'kids cloth': "kids' fashion",
  'kids clothes': "kids' fashion",
  'kids clothing': "kids' fashion",
  'children cloth': "kids' fashion",
  'children wear': "kids' fashion",
  'baby clothes': "kids' fashion",
  'toddler wear': "kids' fashion",
  'infant wear': "kids' fashion",
  // Specific garments (mapped to likely gender but you can edit)
  suit: "men's fashion",
  blazer: "men's fashion",
  'men shirt': "men's fashion",
  'men jeans': "men's fashion",
  'men jacket': "men's fashion",
  'men coat': "men's fashion",
  'men sweater': "men's fashion",
  'men hoodie': "men's fashion",
  'men shorts': "men's fashion",
  'men trousers': "men's fashion",
  'men pants': "men's fashion",
  'men suit': "men's fashion",
  dress: "women's fashion",
  frock: "women's fashion",
  skirt: "women's fashion",
  blouse: "women's fashion",
  'women jeans': "women's fashion",
  'women jacket': "women's fashion",
  'women sweater': "women's fashion",
  'women handbag': "women's fashion",
  'women dress': "women's fashion",
  'women skirt': "women's fashion",
  // Unisex clothing – you can change to 'fashion' if preferred
  't-shirt': "men's fashion",
  tshirt: "men's fashion",
  shirt: "men's fashion",
  jeans: "men's fashion",
  'denim pants': "men's fashion",
  jacket: "men's fashion",
  coat: "men's fashion",
  sweater: "men's fashion",
  hoodie: "men's fashion",
  shorts: "men's fashion",
  trousers: "men's fashion",
  pants: "men's fashion",
  // Shoes
  shoes: 'shoes',
  shoe: 'shoes',
  sneakers: 'shoes',
  trainers: 'shoes',
  'running shoes': 'shoes',
  'sports shoes': 'shoes',
  'formal shoes': 'shoes',
  loafers: 'shoes',
  boots: 'shoes',
  sandals: 'shoes',
  heels: 'shoes',
  flats: 'shoes',
  slippers: 'shoes',
  // Bags & Luggage
  bag: 'bags & luggage',
  handbag: 'bags & luggage',
  purse: 'bags & luggage',
  backpack: 'bags & luggage',
  luggage: 'bags & luggage',
  suitcase: 'bags & luggage',
  wallet: 'bags & luggage',
  'travel bag': 'bags & luggage',
  // Jewelry
  jewelry: 'jewelry',
  jewellery: 'jewelry',
  necklace: 'jewelry',
  bracelet: 'jewelry',
  earrings: 'jewelry',
  ring: 'jewelry',
  pendant: 'jewelry',
  // Watches
  watch: 'watches',
  wristwatch: 'watches',
  'analog watch': 'watches',
  'digital watch': 'watches',
  chronograph: 'watches',
  'smart watch': 'watches',
  // Accessories
  belt: 'accessories',
  hat: 'accessories',
  cap: 'accessories',
  sunglasses: 'accessories',
  scarf: 'accessories',
  shawl: 'accessories',
  gloves: 'accessories',
  tie: 'accessories',
  'bow tie': 'accessories',

  // ────────────────────────────────────────────────
  // HOME & KITCHEN
  // ────────────────────────────────────────────────
  // Kitchen
  kitchenware: 'kitchen',
  cookware: 'kitchen',
  'frying pan': 'kitchen',
  pan: 'kitchen',
  pot: 'kitchen',
  'pressure cooker': 'kitchen',
  'rice cooker': 'kitchen',
  blender: 'kitchen',
  mixer: 'kitchen',
  toaster: 'kitchen',
  kettle: 'kitchen',
  utensil: 'kitchen',
  // Furniture
  furniture: 'furniture',
  sofa: 'furniture',
  couch: 'furniture',
  bed: 'furniture',
  mattress: 'furniture',
  table: 'furniture',
  chair: 'furniture',
  wardrobe: 'furniture',
  cupboard: 'furniture',
  shelf: 'furniture',
  desk: 'furniture',
  dresser: 'furniture',
  // Bedding & Bath
  bedding: 'bedding & bath',
  'bed sheet': 'bedding & bath',
  duvet: 'bedding & bath',
  pillow: 'bedding & bath',
  blanket: 'bedding & bath',
  towel: 'bedding & bath',
  'bathroom accessories': 'bedding & bath',
  // Home Decor
  decor: 'home decor',
  'wall art': 'home decor',
  painting: 'home decor',
  vase: 'home decor',
  clock: 'home decor',
  'picture frame': 'home decor',
  mirror: 'home decor',
  // Kitchen Appliances
  refrigerator: 'kitchen appliances',
  fridge: 'kitchen appliances',
  microwave: 'kitchen appliances',
  oven: 'kitchen appliances',
  'washing machine': 'kitchen appliances',
  dishwasher: 'kitchen appliances',
  'coffee maker': 'kitchen appliances',
  freezer: 'kitchen appliances',
  stove: 'kitchen appliances',
  cooktop: 'kitchen appliances',
  // Cookware & Bakeware
  'baking tray': 'cookware & bakeware',
  bakeware: 'cookware & bakeware',
  // Home Improvement
  'power tool': 'home improvement',
  drill: 'home improvement',
  saw: 'home improvement',
  hammer: 'home improvement',
  screwdriver: 'home improvement',
  // Major Appliances
  appliance: 'major appliances',
  // Small Kitchen Appliances
  'coffee machine': 'small kitchen appliances',
  'food processor': 'small kitchen appliances',
  // Dining & Entertaining
  'dinner set': 'dining & entertaining',
  'cutlery set': 'dining & entertaining',
  glassware: 'dining & entertaining',
  // Lighting
  lamp: 'lighting',
  'table lamp': 'lighting',
  chandelier: 'lighting',
  'floor lamp': 'lighting',
  'ceiling light': 'lighting',
  // Carpets & Rugs
  carpet: 'carpets & rugs',
  rug: 'carpets & rugs',
  mat: 'carpets & rugs',
  // Curtains & Blinds
  curtains: 'curtains & blinds',
  drapes: 'curtains & blinds',
  blinds: 'curtains & blinds',

  // ────────────────────────────────────────────────
  // SPORTS & OUTDOORS
  // ────────────────────────────────────────────────
  // Fitness Equipment
  treadmill: 'fitness equipment',
  'exercise bike': 'fitness equipment',
  dumbbell: 'fitness equipment',
  'gym machine': 'fitness equipment',
  // Camping & Hiking
  camping: 'camping & hiking',
  'sleeping bag': 'camping & hiking',
  tent: 'camping & hiking',
  'hiking boots': 'camping & hiking',
  // Bikes & Cycling
  bicycle: 'bikes & cycling',
  bike: 'bikes & cycling',
  mountainbike: 'bikes & cycling',
  // Team Sports
  football: 'team sports',
  soccer: 'team sports',
  basketball: 'team sports',
  cricket: 'team sports',
  volleyball: 'team sports',
  // Tennis
  tennis: 'tennis',
  'tennis racket': 'tennis',
  'tennis ball': 'tennis',
  // Water Sports
  swimming: 'water sports',
  snorkeling: 'water sports',
  // Winter Sports
  skiing: 'winter sports',
  snowboard: 'winter sports',
  // Yoga & Pilates
  yoga: 'yoga & pilates',
  'yoga mat': 'yoga & pilates',
  pilates: 'yoga & pilates',
  // Golf
  golf: 'golf',
  'golf club': 'golf',
  'golf ball': 'golf',
  // Running
  running: 'running',
  jogging: 'running',

  // ────────────────────────────────────────────────
  // BEAUTY & PERSONAL CARE
  // ────────────────────────────────────────────────
  makeup: 'makeup',
  cosmetics: 'makeup',
  lipstick: 'makeup',
  foundation: 'makeup',
  mascara: 'makeup',
  eyeliner: 'makeup',
  skincare: 'skincare',
  'face cream': 'skincare',
  moisturizer: 'skincare',
  sunscreen: 'skincare',
  serum: 'skincare',
  shampoo: 'hair care',
  conditioner: 'hair care',
  'hair oil': 'hair care',
  'hair gel': 'hair care',
  perfume: 'fragrance',
  deodorant: 'fragrance',
  cologne: 'fragrance',
  'body lotion': 'bath & body',
  soap: 'bath & body',
  'body wash': 'bath & body',
  'hand cream': 'bath & body',
  'makeup brush': 'tools & accessories',
  'hair dryer': 'tools & accessories',
  'hair straightener': 'tools & accessories',

  // ────────────────────────────────────────────────
  // HEALTH & WELLNESS
  // ────────────────────────────────────────────────
  vitamins: 'vitamins & supplements',
  supplement: 'vitamins & supplements',
  protein: 'vitamins & supplements',
  'first aid': 'medical supplies',
  wheelchair: 'mobility aids',
  crutches: 'mobility aids',
  'blood pressure monitor': 'personal care devices',
  thermometer: 'personal care devices',

  // ────────────────────────────────────────────────
  // GROCERIES
  // ────────────────────────────────────────────────
  snack: 'snacks',
  chips: 'snacks',
  biscuit: 'snacks',
  chocolate: 'snacks',
  candy: 'snacks',
  drink: 'beverages',
  'soft drink': 'beverages',
  juice: 'beverages',
  water: 'beverages',
  soda: 'beverages',
  coffee: 'coffee & tea',
  tea: 'coffee & tea',
  'green tea': 'coffee & tea',
  'fresh fruit': 'fresh food',
  vegetable: 'fresh food',
  meat: 'fresh food',
  bread: 'fresh food',
  rice: 'pantry staples',
  flour: 'pantry staples',
  sugar: 'pantry staples',
  oil: 'pantry staples',
  'frozen pizza': 'frozen food',
  'frozen vegetable': 'frozen food',
  'ice cream': 'frozen food',

  // ────────────────────────────────────────────────
  // TOYS & GAMES
  // ────────────────────────────────────────────────
  toy: 'toys & games',
  lego: 'toys & games',
  puzzle: 'toys & games',
  doll: 'toys & games',
  'board game': 'toys & games',
  'action figure': 'toys & games',

  // ────────────────────────────────────────────────
  // BABY PRODUCTS
  // ────────────────────────────────────────────────
  'baby food': 'baby feeding',
  formula: 'baby feeding',
  'baby bottle': 'baby feeding',
  diaper: 'diapering',
  nappy: 'diapering',
  'baby wipes': 'diapering',
  crib: 'nursery',
  stroller: 'nursery',
  'baby monitor': 'nursery',

  // ────────────────────────────────────────────────
  // PET SUPPLIES
  // ────────────────────────────────────────────────
  'dog food': 'dog',
  'dog toy': 'dog',
  'cat food': 'cat',
  'cat litter': 'cat',
  'fish tank': 'fish',
  'bird cage': 'bird',
  'bird food': 'bird',
  hamster: 'small pet',

  // ────────────────────────────────────────────────
  // AUTOMOTIVE
  // ────────────────────────────────────────────────
  'car part': 'car parts',
  'car accessory': 'car accessories',
  tire: 'tires & wheels',
  tyre: 'tires & wheels',
  'car cover': 'car accessories',
  'car seat': 'car accessories',

  // ────────────────────────────────────────────────
  // TOOLS
  // ────────────────────────────────────────────────
  'power drill': 'power tools',
  hammer: 'hand tools',
  screwdriver: 'hand tools',
  wrench: 'hand tools',
  'toolbox': 'tool storage',
  'tool chest': 'tool storage',

  // ────────────────────────────────────────────────
  // OFFICE SUPPLIES
  // ────────────────────────────────────────────────
  stationery: 'stationery',
  pen: 'stationery',
  pencil: 'stationery',
  'paper shredder': 'office supplies',
  'filing cabinet': 'filing & storage',

  // ────────────────────────────────────────────────
  // MUSICAL INSTRUMENTS
  // ────────────────────────────────────────────────
  guitar: 'musical instruments',
  piano: 'musical instruments',
  violin: 'musical instruments',
  drum: 'musical instruments',
  flute: 'musical instruments',

  // ────────────────────────────────────────────────
  // ARTS & CRAFTS
  // ────────────────────────────────────────────────
  painting: 'arts & crafts',
  'sewing machine': 'crafts & sewing',
  fabric: 'fabric',
  yarn: 'art supplies',

  // ────────────────────────────────────────────────
  // BOOKS & MEDIA
  // ────────────────────────────────────────────────
  book: 'books',
  textbook: 'textbooks',
  audiobook: 'audiobooks',
  ebook: 'e-books',

  // ────────────────────────────────────────────────
  // GIFT CARDS
  // ────────────────────────────────────────────────
  'gift card': 'gift cards',
  voucher: 'gift cards',

  // ────────────────────────────────────────────────
  // SOFTWARE
  // ────────────────────────────────────────────────
  software: 'software',
  antivirus: 'software',
};

// ======================================================================
// 2. AUTO‑NORMALISATION – catches irregular forms before synonym lookup
// ======================================================================
function normalizeQuery(query: string): string {
  let q = query.toLowerCase().trim();

  // Word‑level fixes (singular → plural, etc.)
  const wordFixes: Record<string, string> = {
    cloth: 'clothes',
    cloths: 'clothes',
    man: 'men',
    guy: 'men',
    woman: 'women',
    lady: 'women',
    kid: 'kids',
    child: 'children',
    baby: 'babies',
    infant: 'babies',
    toddler: 'toddlers',
    shoe: 'shoes',
    trainer: 'trainers',
    bag: 'bags',
    laptop: 'laptops',
    tablet: 'tablets',
    tv: 'tvs',
    phone: 'mobile phones',
    computer: 'computers',
  };

  const words = q.split(/\s+/);
  const normalized = words.map(w => wordFixes[w] || w).join(' ');

  return normalized;
}

// ======================================================================
// 3. FULL SYNONYM EXPANSION (normalise → lookup)
// ======================================================================
export function expandSynonyms(query: string): string {
  // Step 1: normalise irregular words
  let expanded = normalizeQuery(query);

  // Step 2: apply synonym map (multi‑word phrases first, then single words)
  for (const [synonym, canonical] of Object.entries(SYNONYM_MAP)) {
    const escaped = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    expanded = expanded.replace(regex, canonical);
  }

  // Step 3: clean up extra spaces
  return expanded.replace(/\s+/g, ' ').trim();
}