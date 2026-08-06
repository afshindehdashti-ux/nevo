import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
export type InvoiceType = Database["public"]["Enums"]["invoice_type"];
export type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "confirmed",
  "in_production",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
];

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "void",
];

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "preparing",
  "in_transit",
  "delivered",
  "cancelled",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "bank_transfer",
  "card",
  "cash",
  "letter_of_credit",
  "other",
];

const titleize = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const orderStatusLabel = titleize;
export const invoiceStatusLabel = titleize;
export const shipmentStatusLabel = titleize;
export const paymentMethodLabel = titleize;

export function orderStatusVariant(
  s: OrderStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "delivered":
      return "default";
    case "cancelled":
      return "destructive";
    case "draft":
      return "outline";
    default:
      return "secondary";
  }
}

export function invoiceStatusVariant(
  s: InvoiceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "paid":
      return "default";
    case "overdue":
    case "void":
      return "destructive";
    case "draft":
      return "outline";
    default:
      return "secondary";
  }
}

export function shipmentStatusVariant(
  s: ShipmentStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "delivered":
      return "default";
    case "cancelled":
      return "destructive";
    case "preparing":
      return "outline";
    default:
      return "secondary";
  }
}
