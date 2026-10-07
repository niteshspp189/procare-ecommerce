-- Migration script: Clean up duplicate collections and clear old products
-- Target: product_collection, product

-- 1. Clear products from all collections so store admin can curate them freshly
UPDATE product SET collection_id = NULL WHERE collection_id IS NOT NULL;

-- 2. Remove any duplicate rows in product_collection (preserving single row per id)
DELETE FROM product_collection
WHERE ctid NOT IN (
    SELECT min(ctid)
    FROM product_collection
    GROUP BY id
);

-- 3. Ensure primary key constraint exists on product_collection(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_collection_pkey'
    ) THEN
        ALTER TABLE product_collection ADD CONSTRAINT product_collection_pkey PRIMARY KEY (id);
    END IF;
END $$;
