import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const newProducts = [
  {
    sku: 'LX-DR-005',
    title: 'Emerald Satin Cowl-Neck Slip Dress',
    description: 'A midi slip dress in rich emerald green with a dramatic cowl neckline. Cut from premium heavyweight satin weave, draping flawlessly to follow the natural lines of the body. Features adjustable criss-cross back straps and a delicate thigh slit.',
    price: 310.00,
    original_price: null,
    material_composition: '97% Polyester, 3% Spandex — Heavyweight Satin',
    category: 'dresses',
    sub_category: 'slip-dress',
    gender: 'women',
    brand: 'LuxeLabel',
    tags: ['emerald','green','satin','cowl-neck','slip','romantic','evening','cocktail'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['emerald','green'],
    image_urls: ['https://images.unsplash.com/photo-1618932260643-eee4a390c946?w=800'],
    stock_by_size: {"XS":4,"S":9,"M":11,"L":8,"XL":3},
    is_featured: true,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-DR-006',
    title: 'Noir Velvet Evening Gown',
    description: 'A floor-sweeping evening gown in opulent noir velvet. Designed with a structured bodice, subtle sweetheart off-the-shoulder neckline, and a daring side-split. Perfect for black-tie galas and high-profile editorial appearances.',
    price: 580.00,
    original_price: 720.00,
    material_composition: '90% Polyester, 10% Spandex — Silk-Blend Velvet',
    category: 'dresses',
    sub_category: 'evening-dress',
    gender: 'women',
    brand: 'LuxeLabel',
    tags: ['noir','black','velvet','gown','evening','editorial','structured','formal','classic'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['black','noir'],
    image_urls: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
    stock_by_size: {"XS":2,"S":5,"M":8,"L":6,"XL":3},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-OW-004',
    title: 'Sienna Suede Trench Coat',
    description: 'A luxurious interpretation of the classic trench coat in velvet-soft sienna split suede. Unlined for an exceptionally soft, fluid drape. Detailed with storm flaps, a detachable belt, and tortoiseshell-patterned buckles.',
    price: 1100.00,
    original_price: null,
    material_composition: '100% Genuine Calfskin Suede',
    category: 'outerwear',
    sub_category: 'trench-coat',
    gender: 'women',
    brand: 'LuxeLabel',
    tags: ['sienna','suede','trench','classic','outerwear','investment-piece','brown','tan'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['sienna','brown','tan'],
    image_urls: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
    stock_by_size: {"XS":2,"S":4,"M":7,"L":5,"XL":2},
    is_featured: true,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-OW-005',
    title: 'Slate Grey Cashmere Blazer',
    description: 'Precision tailored masculine blazer cut from exceptionally soft, mid-weight cashmere wool. Fully lined with cupro, featuring a soft shoulder profile, notch lapels, and patch pockets. Pairs seamlessly with tailored trousers or premium denim.',
    price: 650.00,
    original_price: null,
    material_composition: '90% Wool, 10% Cashmere',
    category: 'outerwear',
    sub_category: 'blazer',
    gender: 'men',
    brand: 'LuxeLabel',
    tags: ['slate','grey','cashmere','blazer','classic','tailored','masculine','essentials'],
    sizes: ['S','M','L','XL','XXL'],
    colors: ['slate','grey','charcoal'],
    image_urls: ['https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800'],
    stock_by_size: {"S":4,"M":8,"L":10,"XL":6,"XXL":3},
    is_featured: true,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-OW-006',
    title: 'Olive Utility Waxed Jacket',
    description: 'A rugged yet sophisticated utility jacket in weather-resistant waxed organic cotton canvas. Features a corduroy-lined collar, heavy brass front zipper, and multiple spacious bellows pockets. Designed for a relaxed, gender-fluid fit.',
    price: 450.00,
    original_price: null,
    material_composition: '100% Waxed Organic Cotton Canvas; Trim: 100% Cotton Corduroy',
    category: 'outerwear',
    sub_category: 'utility-jacket',
    gender: 'unisex',
    brand: 'LuxeLabel',
    tags: ['olive','waxed','utility','jacket','casual','streetwear','outdoors','gender-fluid'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['olive','green'],
    image_urls: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800'],
    stock_by_size: {"XS":3,"S":7,"M":10,"L":8,"XL":4},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-TP-005',
    title: 'Vanilla Cable-Knit Cashmere Sweater',
    description: 'The quintessential winter luxury. A chunky-weight cable-knit crewneck sweater in pure vanilla-cream cashmere. Exceptionally soft and warm with ribbed cuffs, neck, and hem. Features classic traditional British cabling details.',
    price: 380.00,
    original_price: 480.00,
    material_composition: '100% Pure Grade-A Cashmere',
    category: 'tops',
    sub_category: 'sweater',
    gender: 'women',
    brand: 'LuxeLabel',
    tags: ['vanilla','cashmere','cable-knit','sweater','cozy','winter','capsule','cream','white'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['vanilla','cream','white'],
    image_urls: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
    stock_by_size: {"XS":3,"S":8,"M":12,"L":9,"XL":4},
    is_featured: true,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-TP-006',
    title: 'Alabaster Silk Camisole',
    description: 'A minimalist staple in lustrous silk charmeuse. Designed with a clean straight neckline, thin adjustable straps, and side slits. Perfect as an elegant standalone top or layered under blazers and cardigans.',
    price: 120.00,
    original_price: null,
    material_composition: '100% Silk Charmeuse',
    category: 'tops',
    sub_category: 'camisole',
    gender: 'women',
    brand: 'LuxeLabel',
    tags: ['alabaster','silk','camisole','minimalist','layering','summer','white','essentials'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['alabaster','white','ivory'],
    image_urls: ['https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=800'],
    stock_by_size: {"XS":6,"S":11,"M":14,"L":10,"XL":5},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-TP-007',
    title: 'Merino Wool Crewneck — Espresso',
    description: 'A classic crewneck sweater woven in a fine-gauge knit from extra-fine Italian merino wool. Deep espresso brown shade offers a versatile anchor for layering. Offers an athletic yet comfortable fit.',
    price: 220.00,
    original_price: null,
    material_composition: '100% Extra-Fine Merino Wool',
    category: 'tops',
    sub_category: 'sweater',
    gender: 'men',
    brand: 'LuxeLabel',
    tags: ['espresso','merino','crewneck','sweater','minimalist','masculine','essentials','brown'],
    sizes: ['S','M','L','XL','XXL'],
    colors: ['espresso','brown','dark-brown'],
    image_urls: ['https://images.unsplash.com/photo-1614495473573-2e8e4a1c9c96?w=800'],
    stock_by_size: {"S":5,"M":12,"L":14,"XL":9,"XXL":4},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-TR-004',
    title: 'Oatmeal Pleated Tailored Shorts',
    description: 'High-rise tailored shorts in an oatmeal wool-linen blend. Double pleated front creates a sophisticated volume while maintaining a clean waistband structure. Pairs beautifully with a matching blazer or a tucked linen top.',
    price: 180.00,
    original_price: null,
    material_composition: '55% Linen, 45% Virgin Wool',
    category: 'trousers',
    sub_category: 'shorts',
    gender: 'women',
    brand: 'LuxeLabel',
    tags: ['oatmeal','pleated','tailored','shorts','summer','relaxed','smart-casual','linen','wool'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['oatmeal','beige','tan'],
    image_urls: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800'],
    stock_by_size: {"XS":4,"S":8,"M":10,"L":7,"XL":4},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-TR-005',
    title: 'Navy Wool-Blend Tailored Trousers',
    description: 'Classic flat-front dress trousers tailored from a mid-weight navy wool blend. Slim-straight cut with side-seam pockets, button-through back pockets, and an unhemmed finish for custom length adjustments.',
    price: 310.00,
    original_price: null,
    material_composition: '70% Virgin Wool, 30% Polyester',
    category: 'trousers',
    sub_category: 'straight-leg',
    gender: 'men',
    brand: 'LuxeLabel',
    tags: ['navy','wool','tailored','trousers','formal','masculine','office','business-casual'],
    sizes: ['S','M','L','XL','XXL'],
    colors: ['navy','dark-blue'],
    image_urls: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'],
    stock_by_size: {"S":5,"M":11,"L":13,"XL":8,"XXL":3},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-TR-006',
    title: 'Chalk White Selvedge Denim Jeans',
    description: 'Straight-leg jeans crafted from heavy-gauge Japanese selvedge denim in a clean chalk white wash. Classic 5-pocket design with silver metal hardware and signature selvedge stitching details inside the cuffs.',
    price: 240.00,
    original_price: 295.00,
    material_composition: '100% Cotton — Selvedge Denim',
    category: 'trousers',
    sub_category: 'denim',
    gender: 'unisex',
    brand: 'LuxeLabel',
    tags: ['chalk','white','selvedge','denim','jeans','streetwear','casual','unisex'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['chalk','white','off-white'],
    image_urls: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'],
    stock_by_size: {"XS":3,"S":8,"M":12,"L":9,"XL":5},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-AC-004',
    title: 'The Carryall Duffle Bag — Noir Leather',
    description: 'The ultimate travel companion. Crafted from full-grain pebbled noir leather, featuring high-quality silver hardware, durable reinforced top handles, and a detachable padded shoulder strap. Spacious canvas-lined interior.',
    price: 850.00,
    original_price: null,
    material_composition: '100% Pebbled Leather; Lining: Cotton Canvas',
    category: 'accessories',
    sub_category: 'duffle',
    gender: 'unisex',
    brand: 'LuxeLabel',
    tags: ['noir','black','leather','duffle','travel','bag','investment','artisan','unisex'],
    sizes: ['ONE SIZE'],
    colors: ['black','noir'],
    image_urls: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
    stock_by_size: {"ONE SIZE":8},
    is_featured: true,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-AC-005',
    title: 'Monarch Silk Pocket Square — Emerald Pattern',
    description: 'Add elegance to any suit. A luxurious pure silk pocket square in rich emerald green, featuring a detailed vintage print pattern and hand-rolled, hand-stitched edges.',
    price: 65.00,
    original_price: null,
    material_composition: '100% Mulberry Silk',
    category: 'accessories',
    sub_category: 'pocket-square',
    gender: 'men',
    brand: 'LuxeLabel',
    tags: ['monarch','silk','pocket-square','emerald','pattern','formal','accessories','green'],
    sizes: ['ONE SIZE'],
    colors: ['emerald','green'],
    image_urls: ['https://images.unsplash.com/photo-1620012253295-c05518e99309?w=800'],
    stock_by_size: {"ONE SIZE":25},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-AC-006',
    title: 'The Tortoise Shell Acetate Sunglasses',
    description: 'A classic D-frame silhouette constructed from premium hand-polished tortoise shell acetate. Outfitted with high-quality polarized green-tinted lenses offering full UV protection. Finished with signature gold-tone pins.',
    price: 210.00,
    original_price: null,
    material_composition: '100% Hand-Polished Cellulose Acetate; Lenses: Polarized CR-39',
    category: 'accessories',
    sub_category: 'sunglasses',
    gender: 'unisex',
    brand: 'LuxeLabel',
    tags: ['tortoise','acetate','sunglasses','summer','eyewear','accessories','minimalist','unisex'],
    sizes: ['ONE SIZE'],
    colors: ['tortoise','brown'],
    image_urls: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800'],
    stock_by_size: {"ONE SIZE":18},
    is_featured: false,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-SH-001',
    title: 'Suede Chelsea Boots — Walnut Brown',
    description: 'A sleek, slim-profile Chelsea boot constructed from rich walnut-brown Italian calf suede. Detailed with tonal elastic side panels, front/rear pull tabs, and a Blake-stitched leather sole with a rubber inset for grip.',
    price: 420.00,
    original_price: null,
    material_composition: '100% Italian Calf Suede; Lining: 100% Calf Leather',
    category: 'accessories',
    sub_category: 'boots',
    gender: 'men',
    brand: 'LuxeLabel',
    tags: ['suede','chelsea','boots','walnut','brown','shoes','classic','masculine','footwear'],
    sizes: ['S','M','L','XL','XXL'],
    colors: ['walnut','brown'],
    image_urls: ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800'],
    stock_by_size: {"S":3,"M":8,"L":10,"XL":6,"XXL":3},
    is_featured: true,
    vector_status: 'PENDING'
  },
  {
    sku: 'LX-SH-002',
    title: 'Minimalist Calfskin Sneakers — Chalk White',
    description: 'An understated luxury sneaker crafted from premium full-grain Italian calf leather. Detailed with clean stitching, durable Margom rubber cupsoles, and a luxurious leather lining. Simple, clean, and endlessly versatile.',
    price: 320.00,
    original_price: 395.00,
    material_composition: '100% Full-Grain Calfskin Leather; Sole: 100% Rubber',
    category: 'accessories',
    sub_category: 'sneakers',
    gender: 'unisex',
    brand: 'LuxeLabel',
    tags: ['minimalist','calfskin','sneakers','chalk','white','shoes','streetwear','casual','footwear','unisex'],
    sizes: ['XS','S','M','L','XL'],
    colors: ['chalk','white'],
    image_urls: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
    stock_by_size: {"XS":4,"S":9,"M":12,"L":10,"XL":5},
    is_featured: false,
    vector_status: 'PENDING'
  }
];

async function seed() {
  console.log(`Starting to insert ${newProducts.length} new products...`);

  // Insert one by one to avoid total failure or to log individual SKU successes
  for (const product of newProducts) {
    try {
      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('sku')
        .eq('sku', product.sku)
        .single();

      if (existing) {
        console.log(`Product SKU ${product.sku} already exists, skipping.`);
        continue;
      }

      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select();

      if (error) {
        throw error;
      }
      console.log(`Successfully seeded SKU: ${product.sku}`);
    } catch (err: any) {
      console.error(`Error seeding SKU ${product.sku}:`, err.message || err);
    }
  }

  console.log('Seeding completed!');
}

seed();
