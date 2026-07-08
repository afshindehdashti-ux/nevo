ALTER TABLE public.proforma_invoices
  ADD COLUMN IF NOT EXISTS subtotal numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Unpaid',
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS incoterms text,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS terms_conditions text,
  ADD COLUMN IF NOT EXISTS bank_details text,
  ADD COLUMN IF NOT EXISTS prepared_by text,
  ADD COLUMN IF NOT EXISTS approved_by text;

ALTER TABLE public.proforma_invoice_items
  ADD COLUMN IF NOT EXISTS item_code text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS quantity numeric(14,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS unit_price numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total numeric(14,2) DEFAULT 0;

NOTIFY pgrst, 'reload schema';