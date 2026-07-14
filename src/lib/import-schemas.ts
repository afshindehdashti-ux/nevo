// Client-safe schema descriptors for the /admin/import wizard.
// Keep in sync with server-side coercion in import-wizard.functions.ts.

export type ImportFieldType = "text" | "email" | "phone" | "number" | "boolean" | "enum" | "date";

export interface ImportField {
  key: string; // logical schema key (used by mapping + coerce)
  label: string; // Human label
  required?: boolean;
  type?: ImportFieldType;
  aliases?: string[]; // Header names auto-mapped to this column
  enumValues?: string[]; // For type = "enum"
  note?: string;
}

export interface ImportEntitySchema {
  key: string; // matches import_jobs.import_type
  label: string;
  table: string; // target public.<table>
  category: string;
  supportsUpsert?: boolean;
  /**
   * If set, rows sharing the same value of this field key are grouped into
   * one parent record (e.g. quotations header) with the remaining rows
   * appended as children (e.g. quotation_items). Server-side code owns the
   * split; the mapping UI still asks the user to map each field once.
   */
  groupBy?: string;
  /** Field keys that belong to the parent header (only the first row of a group is used). */
  headerFields?: string[];
  /** Field keys that belong to child line items (all rows of a group contribute). */
  itemFields?: string[];
  fields: ImportField[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export function autoMap(headers: string[], fields: ImportField[]): Record<string, string> {
  const out: Record<string, string> = {};
  const byNorm = new Map<string, string>();
  headers.forEach((h) => byNorm.set(norm(h), h));
  for (const f of fields) {
    const candidates = [f.key, f.label, ...(f.aliases ?? [])];
    for (const c of candidates) {
      const h = byNorm.get(norm(c));
      if (h) {
        out[f.key] = h;
        break;
      }
    }
  }
  return out;
}

// Shared line-item field definitions reused across doc-type schemas.
const commonItemFields: ImportField[] = [
  { key: "item_code", label: "Item code", aliases: ["sku", "code", "product code"] },
  {
    key: "description",
    label: "Item description",
    required: true,
    aliases: ["item", "product", "line description", "desc"],
  },
  { key: "quantity", label: "Quantity", type: "number", aliases: ["qty"] },
  { key: "unit", label: "Unit", aliases: ["uom"] },
  { key: "unit_price", label: "Unit price", type: "number", aliases: ["price", "rate"] },
  { key: "discount_pct", label: "Discount %", type: "number", aliases: ["discount", "disc"] },
  { key: "hs_code", label: "HS code" },
];

export const IMPORT_SCHEMAS: Record<string, ImportEntitySchema> = {
  customers: {
    key: "customers",
    label: "Customers",
    table: "customers",
    category: "CRM",
    fields: [
      {
        key: "name",
        label: "Company / Name",
        required: true,
        aliases: ["customer", "company", "company name", "account"],
      },
      { key: "contact_person", label: "Contact person", aliases: ["contact", "attention", "attn"] },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "whatsapp", label: "WhatsApp", type: "phone" },
      { key: "address", label: "Address" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "vat_number", label: "VAT / Tax ID", aliases: ["vat", "tax id", "trn"] },
      { key: "currency", label: "Currency", aliases: ["ccy"] },
      { key: "payment_terms", label: "Payment terms" },
      { key: "notes", label: "Notes" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  contacts: {
    key: "contacts",
    label: "Contacts",
    table: "contacts",
    category: "CRM",
    fields: [
      { key: "full_name", label: "Full name", required: true, aliases: ["name", "contact"] },
      { key: "title", label: "Title", aliases: ["job title", "position"] },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "whatsapp", label: "WhatsApp", type: "phone" },
      { key: "is_primary", label: "Primary contact", type: "boolean" },
      { key: "notes", label: "Notes" },
    ],
  },
  leads: {
    key: "leads",
    label: "Leads",
    table: "leads",
    category: "CRM",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "company", label: "Company", aliases: ["organization"] },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "whatsapp", label: "WhatsApp", type: "phone" },
      { key: "country", label: "Country" },
      { key: "industry", label: "Industry" },
      {
        key: "source",
        label: "Source",
        type: "enum",
        enumValues: [
          "website",
          "referral",
          "cold_outreach",
          "event",
          "marketplace",
          "partner",
          "other",
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "enum",
        enumValues: ["new", "contacted", "qualified", "proposal", "won", "lost"],
      },
      {
        key: "estimated_value",
        label: "Estimated value",
        type: "number",
        aliases: ["value", "amount"],
      },
      { key: "currency", label: "Currency" },
      { key: "notes", label: "Notes" },
    ],
  },
  suppliers: {
    key: "suppliers",
    label: "Suppliers",
    table: "suppliers",
    category: "Operations",
    fields: [
      {
        key: "name",
        label: "Supplier name",
        required: true,
        aliases: ["supplier", "company", "vendor"],
      },
      { key: "contact_person", label: "Contact person", aliases: ["contact", "attn"] },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "whatsapp", label: "WhatsApp", type: "phone" },
      { key: "address", label: "Address" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "vat_number", label: "VAT / Tax ID", aliases: ["vat", "tax id", "trn"] },
      { key: "currency", label: "Currency" },
      {
        key: "default_commission_pct",
        label: "Default commission %",
        type: "number",
        aliases: ["commission", "commission pct", "commission percent"],
      },
      { key: "payment_terms", label: "Payment terms" },
      { key: "notes", label: "Notes" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  products: {
    key: "products",
    label: "Products",
    table: "products",
    category: "Operations",
    fields: [
      { key: "sku", label: "SKU", aliases: ["code", "item code", "product code"] },
      {
        key: "name",
        label: "Product name",
        required: true,
        aliases: ["product", "description name"],
      },
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "unit", label: "Unit", aliases: ["uom"] },
      { key: "unit_price", label: "Unit price", type: "number", aliases: ["price"] },
      { key: "currency", label: "Currency" },
      {
        key: "default_commission_pct",
        label: "Default commission %",
        type: "number",
        aliases: ["commission"],
      },
      { key: "hs_code", label: "HS code" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  quotations: {
    key: "quotations",
    label: "Quotations",
    table: "quotations",
    category: "Finance",
    groupBy: "quotation_number",
    headerFields: [
      "quotation_number",
      "customer_name",
      "issue_date",
      "valid_until",
      "currency",
      "vat_rate",
      "status",
      "terms",
      "notes",
    ],
    itemFields: [
      "item_code",
      "description",
      "quantity",
      "unit",
      "unit_price",
      "discount_pct",
      "hs_code",
    ],
    fields: [
      {
        key: "quotation_number",
        label: "Quotation #",
        required: true,
        aliases: ["quote", "quote number", "quotation no", "quote no", "ref", "reference"],
        note: "Rows sharing this value merge into one quotation as line items.",
      },
      {
        key: "customer_name",
        label: "Customer name",
        required: true,
        aliases: ["customer", "company", "account", "client"],
        note: "Matched to existing customer by name; created if missing.",
      },
      { key: "issue_date", label: "Issue date", type: "date", aliases: ["date", "quote date"] },
      { key: "valid_until", label: "Valid until", type: "date", aliases: ["expiry", "expires"] },
      { key: "currency", label: "Currency", aliases: ["ccy"] },
      {
        key: "vat_rate",
        label: "VAT %",
        type: "number",
        aliases: ["vat", "tax", "tax %", "tax rate"],
      },
      {
        key: "status",
        label: "Status",
        type: "enum",
        enumValues: ["draft", "sent", "approved", "accepted", "rejected", "expired"],
      },
      { key: "terms", label: "Terms" },
      { key: "notes", label: "Notes" },
      ...commonItemFields,
    ],
  },

  // === Finance: doc-type schemas (hierarchical: header + line items) ===

  proforma_invoices: {
    key: "proforma_invoices",
    label: "Proforma invoices",
    table: "proforma_invoices",
    category: "Finance",
    groupBy: "proforma_number",
    headerFields: [
      "proforma_number",
      "customer_name",
      "issue_date",
      "valid_until",
      "currency",
      "vat_rate",
      "status",
      "payment_terms",
      "delivery_terms",
      "incoterms",
      "notes",
    ],
    itemFields: ["item_code", "description", "quantity", "unit", "unit_price", "discount_pct"],
    fields: [
      {
        key: "proforma_number",
        label: "Proforma #",
        required: true,
        aliases: ["pi", "pi number", "pi no", "proforma", "proforma no", "ref"],
      },
      {
        key: "customer_name",
        label: "Customer name",
        required: true,
        aliases: ["customer", "company", "client", "account"],
      },
      { key: "issue_date", label: "Issue date", type: "date", aliases: ["date", "pi date"] },
      { key: "valid_until", label: "Valid until", type: "date", aliases: ["expiry"] },
      { key: "currency", label: "Currency", aliases: ["ccy"] },
      { key: "vat_rate", label: "VAT %", type: "number", aliases: ["vat", "tax rate"] },
      {
        key: "status",
        label: "Status",
        type: "enum",
        enumValues: ["draft", "sent", "approved", "converted", "cancelled", "expired"],
      },
      { key: "payment_terms", label: "Payment terms" },
      { key: "delivery_terms", label: "Delivery terms" },
      { key: "incoterms", label: "Incoterms" },
      { key: "notes", label: "Notes" },
      ...commonItemFields,
    ],
  },

  invoices: {
    key: "invoices",
    label: "Invoices",
    table: "invoices",
    category: "Finance",
    groupBy: "invoice_number",
    headerFields: [
      "invoice_number",
      "customer_name",
      "issue_date",
      "due_date",
      "currency",
      "vat_rate",
      "status",
      "payment_terms",
      "notes",
    ],
    itemFields: ["item_code", "description", "quantity", "unit", "unit_price", "discount_pct"],
    fields: [
      {
        key: "invoice_number",
        label: "Invoice #",
        required: true,
        aliases: ["inv", "inv number", "inv no", "invoice no", "ref"],
      },
      {
        key: "customer_name",
        label: "Customer name",
        required: true,
        aliases: ["customer", "company", "client", "account"],
      },
      { key: "issue_date", label: "Issue date", type: "date", aliases: ["date", "invoice date"] },
      { key: "due_date", label: "Due date", type: "date", aliases: ["due"] },
      { key: "currency", label: "Currency", aliases: ["ccy"] },
      { key: "vat_rate", label: "VAT %", type: "number", aliases: ["vat", "tax rate"] },
      {
        key: "status",
        label: "Status",
        type: "enum",
        enumValues: ["draft", "issued", "paid", "partially_paid", "overdue", "cancelled"],
      },
      { key: "payment_terms", label: "Payment terms" },
      { key: "notes", label: "Notes" },
      ...commonItemFields,
    ],
  },

  orders: {
    key: "orders",
    label: "Projects / Orders",
    table: "orders",
    category: "Operations",
    groupBy: "order_number",
    headerFields: [
      "order_number",
      "customer_name",
      "order_date",
      "requested_delivery",
      "currency",
      "incoterm",
      "status",
      "notes",
    ],
    itemFields: ["item_code", "description", "quantity", "unit", "unit_price", "discount_pct"],
    fields: [
      {
        key: "order_number",
        label: "Order #",
        required: true,
        aliases: ["po", "po number", "order no", "ref"],
      },
      {
        key: "customer_name",
        label: "Customer name",
        required: true,
        aliases: ["customer", "company", "client", "account"],
      },
      { key: "order_date", label: "Order date", type: "date", aliases: ["date"] },
      {
        key: "requested_delivery",
        label: "Requested delivery",
        type: "date",
        aliases: ["delivery date", "eta"],
      },
      { key: "currency", label: "Currency", aliases: ["ccy"] },
      { key: "incoterm", label: "Incoterm", aliases: ["incoterms"] },
      {
        key: "status",
        label: "Status",
        type: "enum",
        enumValues: [
          "draft",
          "confirmed",
          "in_production",
          "ready",
          "shipped",
          "delivered",
          "cancelled",
        ],
      },
      { key: "notes", label: "Notes" },
      ...commonItemFields,
    ],
  },

  shipments: {
    key: "shipments",
    label: "Shipments",
    table: "shipments",
    category: "Operations",
    groupBy: "shipment_number",
    headerFields: [
      "shipment_number",
      "order_number",
      "status",
      "carrier",
      "tracking_no",
      "incoterm",
      "container_no",
      "bl_number",
      "shipped_at",
      "delivered_at",
      "notes",
    ],
    itemFields: ["description", "quantity", "unit"],
    fields: [
      {
        key: "shipment_number",
        label: "Shipment #",
        required: true,
        aliases: ["shp", "shipment no", "ref"],
      },
      {
        key: "order_number",
        label: "Order # (required)",
        required: true,
        aliases: ["order", "po", "po number"],
        note: "Matched to existing order by order_number.",
      },
      {
        key: "status",
        label: "Status",
        type: "enum",
        enumValues: ["pending", "in_transit", "delivered", "cancelled"],
      },
      { key: "carrier", label: "Carrier" },
      { key: "tracking_no", label: "Tracking #", aliases: ["tracking", "awb"] },
      { key: "incoterm", label: "Incoterm" },
      { key: "container_no", label: "Container #", aliases: ["container"] },
      { key: "bl_number", label: "BL #", aliases: ["bl", "bill of lading"] },
      { key: "shipped_at", label: "Shipped at", type: "date", aliases: ["ship date"] },
      { key: "delivered_at", label: "Delivered at", type: "date", aliases: ["delivery date"] },
      { key: "notes", label: "Notes" },
      {
        key: "description",
        label: "Item description",
        required: true,
        aliases: ["item", "product"],
      },
      { key: "quantity", label: "Quantity", type: "number", aliases: ["qty"] },
      { key: "unit", label: "Unit", aliases: ["uom"] },
    ],
  },

  // === Finance: flat schemas (single row = single record) ===

  payments: {
    key: "payments",
    label: "Payments",
    table: "payments",
    category: "Finance",
    fields: [
      {
        key: "invoice_number",
        label: "Invoice # (required)",
        required: true,
        aliases: ["invoice", "inv", "inv no"],
        note: "Matched to existing invoice by invoice_number.",
      },
      {
        key: "amount",
        label: "Amount",
        type: "number",
        required: true,
        aliases: ["paid", "value"],
      },
      { key: "currency", label: "Currency", aliases: ["ccy"] },
      {
        key: "method",
        label: "Method",
        type: "enum",
        enumValues: ["bank_transfer", "cash", "cheque", "card", "wire", "other"],
        aliases: ["payment method", "type"],
      },
      {
        key: "received_at",
        label: "Received at",
        type: "date",
        required: true,
        aliases: ["date", "payment date"],
      },
      { key: "reference", label: "Reference", aliases: ["ref", "txn", "transaction"] },
      { key: "notes", label: "Notes" },
    ],
  },

  commission_invoices: {
    key: "commission_invoices",
    label: "Commission invoices",
    table: "partner_commissions",
    category: "Finance",
    fields: [
      {
        key: "partner_name",
        label: "Partner / Supplier name",
        required: true,
        aliases: ["partner", "supplier", "vendor"],
        note: "Matched to existing partner or supplier by name.",
      },
      { key: "commission_number", label: "Commission #", aliases: ["com", "com number", "ref"] },
      { key: "amount", label: "Amount", type: "number", required: true, aliases: ["value"] },
      { key: "currency", label: "Currency", aliases: ["ccy"] },
      { key: "invoice_number", label: "Related invoice #", aliases: ["invoice", "inv"] },
      { key: "order_number", label: "Related order #", aliases: ["order", "po"] },
      {
        key: "earned_at",
        label: "Earned at",
        type: "date",
        required: true,
        aliases: ["date", "earned date"],
      },
      { key: "invoice_date", label: "Invoice date", type: "date" },
      { key: "due_date", label: "Due date", type: "date" },
      {
        key: "status",
        label: "Status",
        type: "enum",
        enumValues: ["pending", "approved", "paid", "cancelled"],
      },
      { key: "description", label: "Description" },
      { key: "notes", label: "Notes" },
    ],
  },
};

export const SUPPORTED_IMPORT_TYPES = Object.keys(IMPORT_SCHEMAS);
