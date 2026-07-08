-- Step 2: Extend quotation_items with optional trade fields for a real quotation engine.
-- These are additive; existing rows remain valid. The recalc trigger for
-- quotation totals continues to use line_total (subtotal), so header vat_rate
-- still governs tax — per-line tax is out of scope for Step 2.

ALTER TABLE public.quotation_items
  ADD COLUMN IF NOT EXISTS item_code text,
  ADD COLUMN IF NOT EXISTS hs_code text;

COMMENT ON COLUMN public.quotation_items.item_code IS 'Optional product / SKU code shown on the quotation line';
COMMENT ON COLUMN public.quotation_items.hs_code IS 'Optional HS (harmonized system) code for export documents';