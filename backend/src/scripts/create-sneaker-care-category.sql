-- Create "Sneaker Care" category and link the 7 requested products
-- Products will belong to both "Shoe Care" and "Sneaker Care"

INSERT INTO product_category (id, name, handle, description, mpath, is_active, is_internal, rank, created_at, updated_at)
VALUES (
  'pcat_sneaker_care',
  'Sneaker Care',
  'sneaker-care',
  'Explore Pro Care premium sneaker cleaning kits, shampoos, power cleaners and wipes designed to keep your sneakers fresh.',
  'pcat_sneaker_care.',
  true,
  false,
  3,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  handle = EXCLUDED.handle,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  rank = EXCLUDED.rank,
  updated_at = NOW();

-- 7 Products marked for Sneaker Care:
-- 1. Pro GOLD Sneaker Wipes Pack of 30 Kit (prod_01KWC2J4SK6QPE0G45PEW_KIT)
-- 2. Pro Gold Sneaker Wipes – Pack of 30 (prod_01KWC2J4SK6QPE0G45PEWQBTBT)
-- 3. Pro Gold Sneaker Cleaning Kit (prod_01KWC2J4SKFAKMSSBDP2FKNY4V)
-- 4. Pro Gold Power Cleaning Shampoo (prod_01KWC2J4SKVWWMWQR68QQJRM7K)
-- 5. Pro Gold Sports & Sneaker Cleaning Kit (prod_01KWC2J4SMEPE3FM8DE64HV6BZ)
-- 6. PRO Sneaker Cleaning Kit – Shoe Shampoo,shoe Freshener & Medium Cleaning Brush (prod_01M1XCT1012H6NJ1FNYNY1RGMY)
-- 7. Pro Premium Sneaker Care Kit (prod_01KWC2J4T2S0G935SZZQGVEVQH)

INSERT INTO product_category_product (product_category_id, product_id) VALUES
('pcat_sneaker_care', 'prod_01KWC2J4SK6QPE0G45PEW_KIT'),
('pcat_sneaker_care', 'prod_01KWC2J4SK6QPE0G45PEWQBTBT'),
('pcat_sneaker_care', 'prod_01KWC2J4SKFAKMSSBDP2FKNY4V'),
('pcat_sneaker_care', 'prod_01KWC2J4SKVWWMWQR68QQJRM7K'),
('pcat_sneaker_care', 'prod_01KWC2J4SMEPE3FM8DE64HV6BZ'),
('pcat_sneaker_care', 'prod_01M1XCT1012H6NJ1FNYNY1RGMY'),
('pcat_sneaker_care', 'prod_01KWC2J4T2S0G935SZZQGVEVQH')
ON CONFLICT DO NOTHING;

-- Rename Foot Care category to 'Hand & Foot Care'
UPDATE product_category 
SET name = 'Hand & Foot Care', updated_at = NOW() 
WHERE id = 'pcat_01KPTT7Z52E4TQR1JG0KAVQ2T6' OR handle = 'foot-care';

