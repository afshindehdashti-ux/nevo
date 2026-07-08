-- Removes rows created by seed-admin-smoke.sql. Safe to run repeatedly.
BEGIN;
DELETE FROM public.partner_commissions WHERE id = '55555555-5555-5555-5555-555555555555';
DELETE FROM public.orders              WHERE id = '44444444-4444-4444-4444-444444444444';
DELETE FROM public.opportunities       WHERE id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.partners            WHERE id = '22222222-2222-2222-2222-222222222222';
DELETE FROM public.customers           WHERE id = '11111111-1111-1111-1111-111111111111';
COMMIT;
