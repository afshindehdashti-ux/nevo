export type CustomerDisplay = {
  name?: string | null;
  company_name?: string | null;
  email?: string | null;
  address?: string | null;
  billing_address?: string | null;
  city?: string | null;
  country?: string | null;
  vat_number?: string | null;
  phone?: string | null;
};

export type FinanceBalance = {
  total?: number | string | null;
  grand_total?: number | string | null;
  amount_paid?: number | string | null;
  paid_amount?: number | string | null;
  balance?: number | string | null;
  balance_due?: number | string | null;
};

export function customerDisplayName(customer: CustomerDisplay | null | undefined) {
  return (
    customer?.company_name?.trim() ||
    customer?.name?.trim() ||
    customer?.email?.trim() ||
    "—"
  );
}

export function customerBillingAddress(customer: CustomerDisplay | null | undefined) {
  return customer?.billing_address?.trim() || customer?.address?.trim() || null;
}

export function customerVatNumber(customer: CustomerDisplay | null | undefined) {
  return customer?.vat_number?.trim() || null;
}

function moneyNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function financePaidAmount(row: FinanceBalance | null | undefined) {
  return moneyNumber(row?.amount_paid ?? row?.paid_amount);
}

export function financeTotalAmount(row: FinanceBalance | null | undefined) {
  return moneyNumber(row?.grand_total ?? row?.total);
}

export function financeBalanceDue(row: FinanceBalance | null | undefined) {
  const stored = row?.balance_due ?? row?.balance;
  if (stored !== null && stored !== undefined && stored !== "") return moneyNumber(stored);
  return Math.max(financeTotalAmount(row) - financePaidAmount(row), 0);
}
