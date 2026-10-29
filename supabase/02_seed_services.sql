-- ============================================================================
-- LinenLuxe Portal — Phase 1: Seed the 22 services
-- Values copied verbatim from the website (js/services-data.js).
-- Run AFTER 01_schema.sql. Re-running updates existing rows (upsert on slug).
-- ============================================================================

insert into public.services
  (slug, name, tagline, description, image_path, unit, base_price, price_label, is_quote_only, category, sort_order)
values
  ('dry-cleaning',     'Dry Cleaning Service',
   'Expert care for your finest fabrics.',
   'Expert dry cleaning for your finest fabrics. Fabric-safe solvents, professional stain removal, and crisp finishing for suits, dresses and delicates.',
   'assets/images/all-services/dry-cleaning-v2.jpg', 'piece', 15, 'From AED 15', false, 'garments', 1),

  ('steam-press',      'Steam Press / Ironing Service',
   'Crisp, wrinkle-free pressing for every garment.',
   'Crisp, wrinkle-free pressing for every garment. Professional steam finishing that keeps clothes sharp, fresh and ready to wear.',
   'assets/images/all-services/steam-press.jpg', 'piece', 8, 'From AED 8', false, 'garments', 2),

  ('wash-fold',        'Wash & Fold Service',
   'Everyday laundry, washed and neatly folded.',
   'Convenient wash, dry and neat folding for your everyday laundry, hygienically cleaned and perfectly packed.',
   'assets/images/all-services/wash-fold.jpg', 'bag', 70, 'From AED 70 per bag (1 bag = up to 20 items)', false, 'garments', 3),

  ('suit-blazer',      'Suit & Blazer Cleaning Services',
   'Specialist care for suits and blazers.',
   'Specialist care for suits and blazers. Gentle cleaning, shape retention and sharp pressing for a polished, professional look.',
   'assets/images/all-services/suit-blazer.jpg', 'piece', 55, 'From AED 55', false, 'garments', 4),

  ('designer-wear',    'Designer Wear Cleaning',
   'Expert cleaning for designer & couture pieces.',
   'Delicate, expert cleaning for designer and couture pieces, with careful handling and inspection for every detail.',
   'assets/images/all-services/designer-wear.jpg', 'piece', 60, 'From AED 60', false, 'garments', 5),

  ('wedding-dress',    'Wedding Dress Cleaning Services',
   'Cleaning & preservation for bridal gowns.',
   'Specialist cleaning and preservation for bridal gowns. Gentle stain treatment and careful finishing to keep your dress flawless.',
   'assets/images/all-services/wedding-dress.jpg', 'piece', 200, 'From AED 200', false, 'garments', 6),

  ('abaya-kandura',    'Abaya & Kandura Cleaning Services',
   'Premium care for abayas and kanduras.',
   'Premium care for abayas and kanduras. Gentle cleaning, crisp pressing and special attention to embroidery and delicate fabrics.',
   'assets/images/all-services/abaya-kandura.jpg', 'piece', 25, 'From AED 25', false, 'garments', 7),

  ('premium-garment',  'Premium Garment Care Service',
   'White-glove care for your finest pieces.',
   'White-glove garment care for your most valued pieces, with fabric-safe cleaning and meticulous finishing.',
   'assets/images/all-services/premium-garment.jpg', 'piece', 25, 'From AED 25', false, 'garments', 8),

  ('curtain',          'Curtain Cleaning Service',
   'Deep cleaning for all curtain fabrics.',
   'Deep cleaning for all curtain fabrics. Dust and stain removal, odour elimination and steam hygiene with perfect finishing.',
   'assets/images/all-services/curtain.jpg', 'sq. cm', 25, 'AED 25 per sq. cm', false, 'home', 9),

  ('carpet',           'Carpet Cleaning Service',
   'Professional carpet & rug deep wash.',
   'Professional carpet and rug wash. Removes embedded dirt, stains and odours while protecting fibres and reviving colours.',
   'assets/images/all-services/carpet.jpg', 'sq. cm', 45, 'AED 45 per sq. cm', false, 'home', 10),

  ('sofa',             'Sofa Cleaning Service',
   'Deep upholstery cleaning for sofas.',
   'Deep upholstery cleaning for sofas. Removes dirt, stains and allergens, leaving your furniture fresh and hygienic.',
   'assets/images/all-services/sofa.jpg', 'seat', 80, 'From AED 80', false, 'home', 11),

  ('bedding',          'LinenLuxe Bedding Care',
   'Fresh, hygienic care for bedding & duvets.',
   'Fresh, hygienic cleaning for bed sheets, duvets, blankets and comforters, gently washed and neatly finished.',
   'assets/images/all-services/bedding.jpg', 'piece', 30, 'From AED 30', false, 'home', 12),

  ('sanitization',     'Sanitization & Hygiene Wash',
   'Kills 99.9% germs — hospital-grade hygiene.',
   'Advanced sanitization that kills 99.9% of germs. Hospital-grade hygiene, safe for all fabrics.',
   'assets/images/all-services/sanitization.jpg', 'piece', 20, 'From AED 20', false, 'specialty', 13),

  ('stain-removal',    'Stain Removal Service',
   'Targeted treatment for tough, set-in stains.',
   'Targeted treatment for tough and set-in stains, using specialised methods safe for every fabric type.',
   'assets/images/all-services/stain-removal.jpg', 'piece', 30, 'From AED 30', false, 'specialty', 14),

  ('baby-clothes',     'Baby Clothes Special Care',
   'Gentle, hypoallergenic care for baby items.',
   'Gentle, hypoallergenic cleaning for baby clothes and items, free from harsh chemicals — soft and safe for delicate skin.',
   'assets/images/all-services/baby-clothes.jpg', 'piece', 12, 'From AED 12', false, 'specialty', 15),

  ('office-uniform',   'Office Uniform Laundry',
   'Crisp, reliable laundry for staff uniforms.',
   'Reliable, crisp laundry for office and staff uniforms, with consistent quality and quick turnaround.',
   'assets/images/all-services/office-uniform.jpg', 'piece', 12, 'From AED 12', false, 'business', 16),

  ('bag-cleaning',     'Bag Cleaning & Care',
   'Cleaning & restoration for luxury bags.',
   'Specialist cleaning and restoration for luxury and designer bags — leather care, colour touch-up and structure repair.',
   'assets/images/services/bag-cleaning.jpg', 'piece', 100, 'From AED 100', false, 'restoration', 17),

  ('jacket-leather',   'Jacket / Leather & Suede Cleaning',
   'Premium leather & suede care.',
   'Premium leather and suede care — deep cleaning, conditioning, colour revival and long-lasting protection.',
   'assets/images/services/jacket-leather.jpg', 'piece', 60, 'From AED 60', false, 'restoration', 18),

  ('shoes-cleaning',   'Shoes Cleaning & Restoration',
   'Deep cleaning & shoe restoration.',
   'Complete shoe care — deep cleaning, colour restoration, sole care and final polish for a like-new finish.',
   'assets/images/services/shoes-cleaning.jpg', 'piece', 100, 'From AED 100', false, 'restoration', 19),

  -- Quote-only (B2B): shown in catalog with a "Request a quote" button, never added to cart
  ('restaurant-linen', 'Restaurant Linen Laundry',
   'Spotless linen care for restaurants.',
   'Professional linen care for restaurants — tablecloths, napkins and more, kept spotless and presentable.',
   'assets/images/all-services/restaurant-linen.jpg', null, null, 'Custom quote', true, 'business', 20),

  ('hotel-laundry',    'Hotel Laundry Service',
   'Premium laundry for hotels & hospitality.',
   'Premium laundry solutions for hotels and hospitality, with reliable quality and timely delivery.',
   'assets/images/all-services/hotel-laundry.jpg', null, null, 'Custom quote', true, 'business', 21),

  ('commercial',       'Commercial Laundry Solutions',
   'Tailored bulk laundry for businesses.',
   'Tailored bulk laundry solutions for businesses, with dependable quality and flexible scheduling.',
   'assets/images/all-services/commercial.jpg', null, null, 'Custom quote', true, 'business', 22)

on conflict (slug) do update set
  name          = excluded.name,
  tagline       = excluded.tagline,
  description   = excluded.description,
  image_path    = excluded.image_path,
  unit          = excluded.unit,
  base_price    = excluded.base_price,
  price_label   = excluded.price_label,
  is_quote_only = excluded.is_quote_only,
  category      = excluded.category,
  sort_order    = excluded.sort_order;

-- Quick check
-- select sort_order, name, unit, base_price, price_label, is_quote_only from public.services order by sort_order;
