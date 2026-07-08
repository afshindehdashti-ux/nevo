-- Idempotent seed for admin list smoke tests.
-- All rows are tagged with the marker below so cleanup is trivial and
-- production data is never touched.
--
-- Marker: rows whose text fields start with 'SMOKE-TEST' belong to this seed.

BEGIN;

-- Customer
INSERT INTO public.customers (id, name, currency, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'SMOKE-TEST Customer', 'EUR', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, currency = EXCLUDED.currency;

-- Partner
INSERT INTO public.partners (id, company_name, country, partner_type, contact_email)
VALUES ('22222222-2222-2222-2222-222222222222', 'SMOKE-TEST Partner', 'ES', 'reseller', 'smoke@example.com')
ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

-- Opportunity
INSERT INTO public.opportunities (id, name, customer_id, partner_id, stage, amount, currency, probability, expected_close_date)
VALUES ('33333333-3333-3333-3333-333333333333',
        'SMOKE-TEST Opportunity',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'qualification', 12500, 'EUR', 60, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Order (PO)
INSERT INTO public.orders (id, order_number, customer_id, status, order_date, requested_delivery, currency, subtotal, vat_amount, total)
VALUES ('44444444-4444-4444-4444-444444444444',
        'SMOKE-TEST-PO-0001',
        '11111111-1111-1111-1111-111111111111',
        'confirmed', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'EUR', 5000, 1050, 6050)
ON CONFLICT (id) DO UPDATE SET order_number = EXCLUDED.order_number;

-- Partner commission
INSERT INTO public.partner_commissions (id, partner_id, customer_id, order_id, amount, currency, status, earned_at)
VALUES ('55555555-5555-5555-5555-555555555555',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        '44444444-4444-4444-4444-444444444444',
        250, 'EUR', 'pending', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount;

COMMIT;
