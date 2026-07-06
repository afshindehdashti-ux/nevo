
REVOKE ALL ON FUNCTION public.orders_status_change_log() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.invoices_assign_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_invoice_totals() FROM PUBLIC, anon, authenticated;
