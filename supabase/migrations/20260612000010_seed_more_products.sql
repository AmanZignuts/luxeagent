-- Migration 010: Seed More Products — 16 Additional Luxury Fashion Products
-- vector_status is 'PENDING' by default. The ingest pipeline will backfill embeddings.

INSERT INTO public.products (
  sku, title, description, price, original_price,
  material_composition, category, sub_category, gender, brand,
  tags, sizes, colors, image_urls, stock_by_size, is_featured, vector_status
) VALUES

-- ── DRESSES ──────────────────────────────────────────────────────────
(
  'LX-DR-005',
  'Emerald Satin Cowl-Neck Slip Dress',
  'A midi slip dress in rich emerald green with a dramatic cowl neckline. Cut from premium heavyweight satin weave, draping flawlessly to follow the natural lines of the body. Features adjustable criss-cross back straps and a delicate thigh slit.',
  310.00, NULL,
  '97% Polyester, 3% Spandex — Heavyweight Satin',
  'dresses', 'slip-dress', 'women', 'LuxeLabel',
  ARRAY['emerald','green','satin','cowl-neck','slip','romantic','evening','cocktail'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['emerald','green'],
  ARRAY['https://images.unsplash.com/photo-1618932260643-eee4a390c946?w=800'],
  '{"XS":4,"S":9,"M":11,"L":8,"XL":3}'::jsonb,
  true, 'PENDING'
),
(
  'LX-DR-006',
  'Noir Velvet Evening Gown',
  'A floor-sweeping evening gown in opulent noir velvet. Designed with a structured bodice, subtle sweetheart off-the-shoulder neckline, and a daring side-split. Perfect for black-tie galas and high-profile editorial appearances.',
  580.00, 720.00,
  '90% Polyester, 10% Spandex — Silk-Blend Velvet',
  'dresses', 'evening-dress', 'women', 'LuxeLabel',
  ARRAY['noir','black','velvet','gown','evening','editorial','structured','formal','classic'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['black','noir'],
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
  '{"XS":2,"S":5,"M":8,"L":6,"XL":3}'::jsonb,
  false, 'PENDING'
),

-- ── OUTERWEAR ─────────────────────────────────────────────────────────
(
  'LX-OW-004',
  'Sienna Suede Trench Coat',
  'A luxurious interpretation of the classic trench coat in velvet-soft sienna split suede. Unlined for an exceptionally soft, fluid drape. Detailed with storm flaps, a detachable belt, and tortoiseshell-patterned buckles.',
  1100.00, NULL,
  '100% Genuine Calfskin Suede',
  'outerwear', 'trench-coat', 'women', 'LuxeLabel',
  ARRAY['sienna','suede','trench','classic','outerwear','investment-piece','brown','tan'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['sienna','brown','tan'],
  ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
  '{"XS":2,"S":4,"M":7,"L":5,"XL":2}'::jsonb,
  true, 'PENDING'
),
(
  'LX-OW-005',
  'Slate Grey Cashmere Blazer',
  'Precision tailored masculine blazer cut from exceptionally soft, mid-weight cashmere wool. Fully lined with cupro, featuring a soft shoulder profile, notch lapels, and patch pockets. Pairs seamlessly with tailored trousers or premium denim.',
  650.00, NULL,
  '90% Wool, 10% Cashmere',
  'outerwear', 'blazer', 'men', 'LuxeLabel',
  ARRAY['slate','grey','cashmere','blazer','classic','tailored','masculine','essentials'],
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['slate','grey','charcoal'],
  ARRAY['https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800'],
  '{"S":4,"M":8,"L":10,"XL":6,"XXL":3}'::jsonb,
  true, 'PENDING'
),
(
  'LX-OW-006',
  'Olive Utility Waxed Jacket',
  'A rugged yet sophisticated utility jacket in weather-resistant waxed organic cotton canvas. Features a corduroy-lined collar, heavy brass front zipper, and multiple spacious bellows pockets. Designed for a relaxed, gender-fluid fit.',
  450.00, NULL,
  '100% Waxed Organic Cotton Canvas; Trim: 100% Cotton Corduroy',
  'outerwear', 'utility-jacket', 'unisex', 'LuxeLabel',
  ARRAY['olive','waxed','utility','jacket','casual','streetwear','outdoors','gender-fluid'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['olive','green'],
  ARRAY['https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800'],
  '{"XS":3,"S":7,"M":10,"L":8,"XL":4}'::jsonb,
  false, 'PENDING'
),

-- ── TOPS ──────────────────────────────────────────────────────────────
(
  'LX-TP-005',
  'Vanilla Cable-Knit Cashmere Sweater',
  'The quintessential winter luxury. A chunky-weight cable-knit crewneck sweater in pure vanilla-cream cashmere. Exceptionally soft and warm with ribbed cuffs, neck, and hem. Features classic traditional British cabling details.',
  380.00, 480.00,
  '100% Pure Grade-A Cashmere',
  'tops', 'sweater', 'women', 'LuxeLabel',
  ARRAY['vanilla','cashmere','cable-knit','sweater','cozy','winter','capsule','cream','white'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['vanilla','cream','white'],
  ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
  '{"XS":3,"S":8,"M":12,"L":9,"XL":4}'::jsonb,
  true, 'PENDING'
),
(
  'LX-TP-006',
  'Alabaster Silk Camisole',
  'A minimalist staple in lustrous silk charmeuse. Designed with a clean straight neckline, thin adjustable straps, and side slits. Perfect as an elegant standalone top or layered under blazers and cardigans.',
  120.00, NULL,
  '100% Silk Charmeuse',
  'tops', 'camisole', 'women', 'LuxeLabel',
  ARRAY['alabaster','silk','camisole','minimalist','layering','summer','white','essentials'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['alabaster','white','ivory'],
  ARRAY['https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=800'],
  '{"XS":6,"S":11,"M":14,"L":10,"XL":5}'::jsonb,
  false, 'PENDING'
),
(
  'LX-TP-007',
  'Merino Wool Crewneck — Espresso',
  'A classic crewneck sweater woven in a fine-gauge knit from extra-fine Italian merino wool. Deep espresso brown shade offers a versatile anchor for layering. Offers an athletic yet comfortable fit.',
  220.00, NULL,
  '100% Extra-Fine Merino Wool',
  'tops', 'sweater', 'men', 'LuxeLabel',
  ARRAY['espresso','merino','crewneck','sweater','minimalist','masculine','essentials','brown'],
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['espresso','brown','dark-brown'],
  ARRAY['https://images.unsplash.com/photo-1614495473573-2e8e4a1c9c96?w=800'],
  '{"S":5,"M":12,"L":14,"XL":9,"XXL":4}'::jsonb,
  false, 'PENDING'
),

-- ── TROUSERS ──────────────────────────────────────────────────────────
(
  'LX-TR-004',
  'Oatmeal Pleated Tailored Shorts',
  'High-rise tailored shorts in an oatmeal wool-linen blend. Double pleated front creates a sophisticated volume while maintaining a clean waistband structure. Pairs beautifully with a matching blazer or a tucked linen top.',
  180.00, NULL,
  '55% Linen, 45% Virgin Wool',
  'trousers', 'shorts', 'women', 'LuxeLabel',
  ARRAY['oatmeal','pleated','tailored','shorts','summer','relaxed','smart-casual','linen','wool'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['oatmeal','beige','tan'],
  ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800'],
  '{"XS":4,"S":8,"M":10,"L":7,"XL":4}'::jsonb,
  false, 'PENDING'
),
(
  'LX-TR-005',
  'Navy Wool-Blend Tailored Trousers',
  'Classic flat-front dress trousers tailored from a mid-weight navy wool blend. Slim-straight cut with side-seam pockets, button-through back pockets, and an unhemmed finish for custom length adjustments.',
  310.00, NULL,
  '70% Virgin Wool, 30% Polyester',
  'trousers', 'straight-leg', 'men', 'LuxeLabel',
  ARRAY['navy','wool','tailored','trousers','formal','masculine','office','business-casual'],
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['navy','dark-blue'],
  ARRAY['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'],
  '{"S":5,"M":11,"L":13,"XL":8,"XXL":3}'::jsonb,
  false, 'PENDING'
),
(
  'LX-TR-006',
  'Chalk White Selvedge Denim Jeans',
  'Straight-leg jeans crafted from heavy-gauge Japanese selvedge denim in a clean chalk white wash. Classic 5-pocket design with silver metal hardware and signature selvedge stitching details inside the cuffs.',
  240.00, 295.00,
  '100% Cotton — Selvedge Denim',
  'trousers', 'denim', 'unisex', 'LuxeLabel',
  ARRAY['chalk','white','selvedge','denim','jeans','streetwear','casual','unisex'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['chalk','white','off-white'],
  ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'],
  '{"XS":3,"S":8,"M":12,"L":9,"XL":5}'::jsonb,
  false, 'PENDING'
),

-- ── ACCESSORIES ───────────────────────────────────────────────────────
(
  'LX-AC-004',
  'The Carryall Duffle Bag — Noir Leather',
  'The ultimate travel companion. Crafted from full-grain pebbled noir leather, featuring high-quality silver hardware, durable reinforced top handles, and a detachable padded shoulder strap. Spacious canvas-lined interior.',
  850.00, NULL,
  '100% Pebbled Leather; Lining: Cotton Canvas',
  'accessories', 'duffle', 'unisex', 'LuxeLabel',
  ARRAY['noir','black','leather','duffle','travel','bag','investment','artisan','unisex'],
  ARRAY['ONE SIZE'],
  ARRAY['black','noir'],
  ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
  '{"ONE SIZE":8}'::jsonb,
  true, 'PENDING'
),
(
  'LX-AC-005',
  'Monarch Silk Pocket Square — Emerald Pattern',
  'Add elegance to any suit. A luxurious pure silk pocket square in rich emerald green, featuring a detailed vintage print pattern and hand-rolled, hand-stitched edges.',
  65.00, NULL,
  '100% Mulberry Silk',
  'accessories', 'pocket-square', 'men', 'LuxeLabel',
  ARRAY['monarch','silk','pocket-square','emerald','pattern','formal','accessories','green'],
  ARRAY['ONE SIZE'],
  ARRAY['emerald','green'],
  ARRAY['https://images.unsplash.com/photo-1620012253295-c05518e99309?w=800'],
  '{"ONE SIZE":25}'::jsonb,
  false, 'PENDING'
),
(
  'LX-AC-006',
  'The Tortoise Shell Acetate Sunglasses',
  'A classic D-frame silhouette constructed from premium hand-polished tortoise shell acetate. Outfitted with high-quality polarized green-tinted lenses offering full UV protection. Finished with signature gold-tone pins.',
  210.00, NULL,
  '100% Hand-Polished Cellulose Acetate; Lenses: Polarized CR-39',
  'accessories', 'sunglasses', 'unisex', 'LuxeLabel',
  ARRAY['tortoise','acetate','sunglasses','summer','eyewear','accessories','minimalist','unisex'],
  ARRAY['ONE SIZE'],
  ARRAY['tortoise','brown'],
  ARRAY['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800'],
  '{"ONE SIZE":18}'::jsonb,
  false, 'PENDING'
),

-- ── SHOES ─────────────────────────────────────────────────────────────
(
  'LX-SH-001',
  'Suede Chelsea Boots — Walnut Brown',
  'A sleek, slim-profile Chelsea boot constructed from rich walnut-brown Italian calf suede. Detailed with tonal elastic side panels, front/rear pull tabs, and a Blake-stitched leather sole with a rubber inset for grip.',
  420.00, NULL,
  '100% Italian Calf Suede; Lining: 100% Calf Leather',
  'accessories', 'boots', 'men', 'LuxeLabel',
  ARRAY['suede','chelsea','boots','walnut','brown','shoes','classic','masculine','footwear'],
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['walnut','brown'],
  ARRAY['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800'],
  '{"S":3,"M":8,"L":10,"XL":6,"XXL":3}'::jsonb,
  true, 'PENDING'
),
(
  'LX-SH-002',
  'Minimalist Calfskin Sneakers — Chalk White',
  'An understated luxury sneaker crafted from premium full-grain Italian calf leather. Detailed with clean stitching, durable Margom rubber cupsoles, and a luxurious leather lining. Simple, clean, and endlessly versatile.',
  320.00, 395.00,
  '100% Full-Grain Calfskin Leather; Sole: 100% Rubber',
  'accessories', 'sneakers', 'unisex', 'LuxeLabel',
  ARRAY['minimalist','calfskin','sneakers','chalk','white','shoes','streetwear','casual','footwear','unisex'],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['chalk','white'],
  ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
  '{"XS":4,"S":9,"M":12,"L":10,"XL":5}'::jsonb,
  false, 'PENDING'
);
