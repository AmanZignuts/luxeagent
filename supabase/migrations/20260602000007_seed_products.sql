-- Migration 007: Seed Data — 20 Luxury Fashion Products
-- vector_status is 'PENDING' by default. The ingest pipeline will set to 'ACTIVE'.
-- image_urls point to curated Unsplash fashion images (no auth required, stable URLs).

INSERT INTO public.products (
  sku, title, description, price, original_price,
  material_composition, category, sub_category, gender, brand,
  tags, sizes, colors, image_urls, stock_by_size, is_featured, vector_status
) VALUES

-- ── DRESSES ──────────────────────────────────────────────────────────
(
  'LX-DR-001',
  'Obsidian Silk Bias-Cut Midi Dress',
  'A fluid bias-cut midi dress in pure 100% mulberry silk. The obsidian colorway commands presence through restraint — a dress that moves with you rather than against you. Invisible side zipper, double-lined bodice.',
  485.00, NULL,
  '100% Mulberry Silk',
  'dresses', 'midi-dress', 'women', 'LuxeLabel',
  ARRAY['minimalist','silk','bias-cut','evening','editorial','monochrome'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['obsidian'],
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800','https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800'],
  '{"XS":3,"S":8,"M":12,"L":7,"XL":4}'::jsonb,
  true, 'PENDING'
),
(
  'LX-DR-002',
  'Ivory Column Dress with Asymmetric Hem',
  'Architectural simplicity in stretch crépe. The asymmetric hem creates visual tension, drawing the eye in a spiral across a clean ivory canvas. Structured boning at the waist. Ideal for formal editorial occasions.',
  360.00, NULL,
  '78% Polyester, 20% Viscose, 2% Elastane — Stretch Crépe',
  'dresses', 'column-dress', 'women', 'LuxeLabel',
  ARRAY['ivory','architectural','formal','asymmetric','editorial','structured'],
  ARRAY['XS','S','M','L'],
  ARRAY['ivory','cream'],
  ARRAY['https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800','https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800'],
  '{"XS":5,"S":9,"M":11,"L":6}'::jsonb,
  true, 'PENDING'
),
(
  'LX-DR-003',
  'Champagne Slip Dress — Lace Trim Edition',
  'A whisper of a dress in champagne satin with delicate Chantilly lace trim at the neckline and hem. Adjustable spaghetti straps. The understated glamour of old-world couture, re-imagined for modern wardrobes.',
  295.00, 380.00,
  '95% Satin Weave Polyester, 5% Spandex; Lace: 100% Nylon',
  'dresses', 'slip-dress', 'women', 'LuxeLabel',
  ARRAY['champagne','satin','lace','romantic','delicate','slip','evening','bridal-adjacent'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['champagne','blush'],
  ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800','https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800'],
  '{"XS":2,"S":7,"M":10,"L":8,"XL":3}'::jsonb,
  false, 'PENDING'
),
(
  'LX-DR-004',
  'Merlot Wrap Dress in Brushed Cashmere Jersey',
  'Warmth that drapes. A wrap construction in fine-gauge brushed cashmere jersey that ties at a natural waist. The deep merlot is rich without being loud — an autumn capsule essential.',
  520.00, NULL,
  '70% Cashmere, 30% Merino Wool — Brushed Jersey',
  'dresses', 'wrap-dress', 'women', 'LuxeLabel',
  ARRAY['merlot','cashmere','wrap','autumn','warm','cozy','capsule','editorial'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['merlot','burgundy','deep-red'],
  ARRAY['https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=800'],
  '{"XS":4,"S":6,"M":9,"L":5,"XL":2}'::jsonb,
  false, 'PENDING'
),

-- ── OUTERWEAR ─────────────────────────────────────────────────────────
(
  'LX-OW-001',
  'Camel Double-Breasted Wool Overcoat',
  'The benchmark of Parisian dressing. A precision-tailored double-breasted overcoat in 100% pure virgin wool. Set-in sleeves, structured shoulders, back vent. Timeless camel — the shade that never leaves.',
  890.00, NULL,
  '100% Pure Virgin Wool; Lining: 100% Viscose',
  'outerwear', 'overcoat', 'women', 'LuxeLabel',
  ARRAY['camel','wool','tailored','overcoat','classic','parisian','structured','investment-piece'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['camel','tan'],
  ARRAY['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800','https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800'],
  '{"XS":3,"S":7,"M":10,"L":6,"XL":3}'::jsonb,
  true, 'PENDING'
),
(
  'LX-OW-002',
  'Charcoal Cocoon Coat — Oversized Silhouette',
  'Sculptural volume in motion. The cocoon silhouette breaks from traditional tailoring to create a dramatic, gender-fluid statement. Mid-weight double-faced wool. Drop shoulders, three button closures. Charcoal grey.',
  740.00, 920.00,
  '80% Wool, 20% Polyamide — Double-faced',
  'outerwear', 'cocoon-coat', 'women', 'LuxeLabel',
  ARRAY['charcoal','oversized','cocoon','sculptural','editorial','gender-fluid','statement','grey'],
  ARRAY['S','M','L','XL'],
  ARRAY['charcoal','grey','anthracite'],
  ARRAY['https://images.unsplash.com/photo-1548624313-0396c75e4b1e?w=800'],
  '{"S":5,"M":8,"L":7,"XL":4}'::jsonb,
  false, 'PENDING'
),
(
  'LX-OW-003',
  'Ivory Shearling Aviator Jacket',
  'A contemporary take on the aviator in genuine Spanish shearling. The exterior is soft suede-finish lamb leather, the interior a dense natural cream shearling. Ribbed cuffs, asymmetric zip.',
  1250.00, NULL,
  'Shell: 100% Lambskin; Lining: 100% Natural Shearling',
  'outerwear', 'aviator-jacket', 'women', 'LuxeLabel',
  ARRAY['ivory','shearling','aviator','leather','luxury','winter','statement','cream'],
  ARRAY['XS','S','M','L'],
  ARRAY['ivory','cream','natural'],
  ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
  '{"XS":2,"S":4,"M":6,"L":4}'::jsonb,
  true, 'PENDING'
),

-- ── TOPS ──────────────────────────────────────────────────────────────
(
  'LX-TP-001',
  'Bone White Structured Bustier Top',
  'An architectural exploration of the corset form. Internal boning creates structure without stiffness. Strapless, with a subtle sweetheart cut hidden beneath a straight-line finish. Pairs with everything from wide-leg trousers to eveningwear.',
  195.00, NULL,
  '52% Cotton, 45% Polyester, 3% Elastane',
  'tops', 'bustier', 'women', 'LuxeLabel',
  ARRAY['white','structured','bustier','corset','strapless','architectural','versatile'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['bone-white','ivory'],
  ARRAY['https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800'],
  '{"XS":6,"S":12,"M":15,"L":10,"XL":5}'::jsonb,
  false, 'PENDING'
),
(
  'LX-TP-002',
  'Slate Grey Cashmere Turtleneck',
  'The essential base layer for the considered wardrobe. A fine-gauge Grade-A Mongolian cashmere turtleneck in slate grey. Ribbed at cuffs and collar. Worn alone or as a precision layer beneath outerwear.',
  285.00, NULL,
  '100% Grade-A Mongolian Cashmere — Fine Gauge 12gg',
  'tops', 'turtleneck', 'women', 'LuxeLabel',
  ARRAY['grey','cashmere','turtleneck','minimalist','capsule','layering','cozy','essential'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['slate-grey','grey','heather'],
  ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'],
  '{"XS":8,"S":15,"M":18,"L":12,"XL":6}'::jsonb,
  true, 'PENDING'
),
(
  'LX-TP-003',
  'Champagne Puff-Sleeve Blouse',
  'Romantic volume at the shoulder, precision at the cuff. A champagne silk-blend blouse with bishop sleeves and mother-of-pearl button detailing. Tucks cleanly into high-waisted trousers or skirts.',
  175.00, 220.00,
  '70% Silk, 30% Polyester',
  'tops', 'blouse', 'women', 'LuxeLabel',
  ARRAY['champagne','silk','blouse','romantic','puff-sleeve','feminine','bishop-sleeve'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['champagne','gold','pale-yellow'],
  ARRAY['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800'],
  '{"XS":4,"S":9,"M":13,"L":8,"XL":3}'::jsonb,
  false, 'PENDING'
),
(
  'LX-TP-004',
  'Obsidian Wrap Silk Blouse',
  'Clean lines meet fluid movement. A wrap construction in 100% Charmeuse silk creates a V-neckline that is both elegant and adjustable. The obsidian is a deep near-black with a subtle lustre under light.',
  245.00, NULL,
  '100% Charmeuse Silk',
  'tops', 'blouse', 'women', 'LuxeLabel',
  ARRAY['obsidian','silk','wrap','minimalist','monochrome','charmeuse','lustrous'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['obsidian','black','near-black'],
  ARRAY['https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=800'],
  '{"XS":5,"S":10,"M":14,"L":9,"XL":4}'::jsonb,
  false, 'PENDING'
),

-- ── TROUSERS ──────────────────────────────────────────────────────────
(
  'LX-TR-001',
  'High-Waisted Wide-Leg Trousers — Chalk Crépe',
  'The trouser that defines modern femininity. A high-waisted, wide-leg silhouette in chalk-white crépe that drapes cleanly to the floor. Side zip, no pleats. Wear with a tucked turtleneck or cropped blazer.',
  320.00, NULL,
  '70% Polyester, 28% Rayon, 2% Elastane — Crépe Weave',
  'trousers', 'wide-leg', 'women', 'LuxeLabel',
  ARRAY['chalk','wide-leg','high-waist','trousers','minimalist','editorial','flowy','formal'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['chalk','white','off-white'],
  ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
  '{"XS":5,"S":10,"M":14,"L":9,"XL":5}'::jsonb,
  true, 'PENDING'
),
(
  'LX-TR-002',
  'Charcoal Straight-Leg Tailored Trousers',
  'The trouser that anchors a wardrobe. Precision-tailored in a charcoal wool-blend with a medium-high rise, flat front, and straight leg. Belt loops, side and back pockets. A non-negotiable capsule piece.',
  295.00, NULL,
  '60% Wool, 38% Polyester, 2% Elastane',
  'trousers', 'straight-leg', 'women', 'LuxeLabel',
  ARRAY['charcoal','tailored','straight-leg','capsule','formal','office','wool','grey'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['charcoal','grey','dark-grey'],
  ARRAY['https://images.unsplash.com/photo-1602573991155-21f0143bb18f?w=800'],
  '{"XS":6,"S":12,"M":14,"L":10,"XL":5}'::jsonb,
  false, 'PENDING'
),
(
  'LX-TR-003',
  'Ivory Linen Wide-Leg Trousers',
  'Summer''s most essential silhouette. A relaxed wide-leg in washed Belgian linen. The ivory has a lived-in softness that improves with washing. Elasticated back waistband, two deep front pockets.',
  195.00, NULL,
  '100% Belgian Linen — Washed',
  'trousers', 'wide-leg', 'women', 'LuxeLabel',
  ARRAY['ivory','linen','wide-leg','summer','relaxed','casual','breathable','minimalist'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['ivory','natural','ecru'],
  ARRAY['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'],
  '{"XS":7,"S":14,"M":18,"L":12,"XL":6}'::jsonb,
  false, 'PENDING'
),

-- ── ACCESSORIES ───────────────────────────────────────────────────────
(
  'LX-AC-001',
  'The Meridian Tote — Tan Vegetable-Tanned Leather',
  'A tote built for a lifetime. Constructed from full-grain vegetable-tanned Italian leather that patinas beautifully with use. Open-top design, interior zip pocket, detachable canvas pouch. Width 40cm.',
  695.00, NULL,
  'Full-Grain Vegetable-Tanned Italian Leather; Hardware: Brushed Brass',
  'accessories', 'tote', 'women', 'LuxeLabel',
  ARRAY['tan','leather','tote','investment','artisan','italian','patina','everyday','structured'],
  ARRAY['ONE SIZE'],
  ARRAY['tan','cognac','caramel'],
  ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800','https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
  '{"ONE SIZE":15}'::jsonb,
  true, 'PENDING'
),
(
  'LX-AC-002',
  'The Silhouette Clutch — Obsidian Patent',
  'An obsidian patent leather envelope clutch. Structured, minimal, magnetic fold-over closure. Interior card slot and lipstick loop. Dimensions: 28cm x 14cm. The punctuation mark on an evening look.',
  285.00, NULL,
  '100% Patent Leather; Interior: Suede Lining',
  'accessories', 'clutch', 'women', 'LuxeLabel',
  ARRAY['obsidian','patent','clutch','evening','minimal','structured','monochrome','formal'],
  ARRAY['ONE SIZE'],
  ARRAY['obsidian','black'],
  ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800'],
  '{"ONE SIZE":20}'::jsonb,
  false, 'PENDING'
),
(
  'LX-AC-003',
  'Merino Wool Scarf — Ivory Fringe',
  'A generous 200cm x 70cm scarf in fine-gauge 100% merino wool. The ivory ground is framed by a 8cm hand-knotted fringe on both ends. Drapes as a wrap, a shawl, or a head covering.',
  125.00, NULL,
  '100% Extra-Fine Merino Wool — 18.5 Micron',
  'accessories', 'scarf', 'women', 'LuxeLabel',
  ARRAY['ivory','merino','scarf','wrap','fringe','soft','winter','capsule','cozy'],
  ARRAY['ONE SIZE'],
  ARRAY['ivory','cream','white'],
  ARRAY['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800'],
  '{"ONE SIZE":30}'::jsonb,
  false, 'PENDING'
),

-- ── MEN'S ─────────────────────────────────────────────────────────────
(
  'LX-MN-001',
  'Chalk Linen Relaxed-Fit Shirt',
  'The masculine equivalent of ease. A relaxed-fit shirt in 100% Irish linen with a camp collar, single chest patch pocket, and a straight hem. The chalk colorway is clean without being clinical.',
  165.00, NULL,
  '100% Irish Linen',
  'tops', 'shirt', 'men', 'LuxeLabel',
  ARRAY['chalk','linen','shirt','camp-collar','relaxed','summer','minimalist','masculine'],
  ARRAY['XS','S','M','L','XL','XXL'],
  ARRAY['chalk','white','off-white'],
  ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'],
  '{"XS":4,"S":10,"M":18,"L":15,"XL":8,"XXL":4}'::jsonb,
  false, 'PENDING'
),
(
  'LX-MN-002',
  'Charcoal Merino Rollneck Sweater',
  'Understated precision. A fine-gauge 100% merino wool rollneck in deep charcoal. The roll construction sits high without restricting movement. A single-seam shoulder, minimal ribbing. The definitive cold-weather layer.',
  245.00, NULL,
  '100% Extra-Fine Merino Wool — 18.5 Micron, Fine Gauge',
  'tops', 'sweater', 'men', 'LuxeLabel',
  ARRAY['charcoal','merino','rollneck','minimalist','grey','capsule','winter','masculine','essentials'],
  ARRAY['XS','S','M','L','XL','XXL'],
  ARRAY['charcoal','grey','dark'],
  ARRAY['https://images.unsplash.com/photo-1614495473573-2e8e4a1c9c96?w=800'],
  '{"XS":3,"S":8,"M":14,"L":12,"XL":7,"XXL":3}'::jsonb,
  true, 'PENDING'
),
(
  'LX-MN-003',
  'The Atelier Blazer — Navy Hopsack',
  'A blazer that bridges casual and formal without apology. Woven in Italian hopsack — open-weave for breathability — in a midnight navy. Three-roll-two button, patch pockets, soft canvas construction.',
  595.00, NULL,
  '100% Wool Hopsack — Italian Loomed; Lining: 100% Cupro',
  'outerwear', 'blazer', 'men', 'LuxeLabel',
  ARRAY['navy','blazer','tailored','italian','hopsack','smart-casual','versatile','classic'],
  ARRAY['XS','S','M','L','XL','XXL'],
  ARRAY['navy','midnight','dark-blue'],
  ARRAY['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'],
  '{"XS":2,"S":6,"M":10,"L":9,"XL":6,"XXL":3}'::jsonb,
  true, 'PENDING'
);
