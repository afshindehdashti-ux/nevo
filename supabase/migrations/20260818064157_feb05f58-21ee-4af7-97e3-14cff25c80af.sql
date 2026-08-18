REVOKE EXECUTE ON FUNCTION public.assign_order_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_payment_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_order_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_payment_number() FROM anon, authenticated;