-- Add flexible custom attributes column to products table.
-- Stores supplier-defined attributes as JSONB: [{name: string, values: string[]}]
-- Informational only — not indexed or filtered, so JSONB is the right choice.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '[]'::jsonb;
