export function formatMoney(amount: number | string | null | undefined, currency = "USD") {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (!isFinite(n)) return `${currency} 0.00`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}
