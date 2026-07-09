// Client-safe schema descriptors for the /admin/import wizard.
// Keep in sync with server-side coercion in import-wizard.functions.ts.

export type ImportFieldType = "text" | "email" | "phone" | "number" | "boolean" | "enum";

export interface ImportField {
  key: string;                 // DB column
  label: string;               // Human label
  required?: boolean;
  type?: ImportFieldType;
  aliases?: string[];          // Header names auto-mapped to this column
  enumValues?: string[];       // For type = "enum"
  note?: string;
}

export interface ImportEntitySchema {
  key: string;                 // matches import_jobs.import_type
  label: string;
  table: string;               // target public.<table>
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
      if (h) { out[f.key] = h; break; }
    }
  }
  return out;
}

export const IMPORT_SCHEMAS: Record<string, ImportEntitySchema> = {
  customers: {
    key: "customers",
    label: "Customers",
    table: "customers",
    category: "CRM",
    fields: [
      { key: "name", label: "Company / Name", required: true, aliases: ["customer", "company", "company name", "account"] },
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
      { key: "source", label: "Source", type: "enum",
        enumValues: ["website","referral","cold_outreach","event","marketplace","partner","other"] },
      { key: "status", label: "Status", type: "enum",
        enumValues: ["new","contacted","qualified","proposal","won","lost"] },
      { key: "estimated_value", label: "Estimated value", type: "number", aliases: ["value","amount"] },
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
      { key: "name", label: "Supplier name", required: true, aliases: ["supplier","company","vendor"] },
      { key: "contact_person", label: "Contact person", aliases: ["contact","attn"] },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "whatsapp", label: "WhatsApp", type: "phone" },
      { key: "address", label: "Address" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "vat_number", label: "VAT / Tax ID", aliases: ["vat","tax id","trn"] },
      { key: "currency", label: "Currency" },
      { key: "default_commission_pct", label: "Default commission %", type: "number",
        aliases: ["commission","commission pct","commission percent"] },
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
      { key: "sku", label: "SKU", aliases: ["code","item code","product code"] },
      { key: "name", label: "Product name", required: true, aliases: ["product","description name"] },
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "unit", label: "Unit", aliases: ["uom"] },
      { key: "unit_price", label: "Unit price", type: "number", aliases: ["price"] },
      { key: "currency", label: "Currency" },
      { key: "default_commission_pct", label: "Default commission %", type: "number", aliases: ["commission"] },
      { key: "hs_code", label: "HS code" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
};

export const SUPPORTED_IMPORT_TYPES = Object.keys(IMPORT_SCHEMAS);
