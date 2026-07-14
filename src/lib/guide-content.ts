/**
 * NEVO CRM — Guide Mode content
 *
 * Static training content for internal users. Each section covers one CRM area
 * with a short description, required fields, step-by-step instructions,
 * common mistakes, and a best-practice note.
 */

export type GuideCategory = "sales" | "finance" | "operations" | "management" | "admin";

export type GuideSection = {
  id: string;
  title: string;
  category: GuideCategory;
  description: string;
  steps: string[];
  requiredFields?: string[];
  commonMistakes?: string[];
  bestPractice?: string;
  relatedRoute?: { label: string; to: string };
};

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  sales: "Sales Guides",
  finance: "Finance Guides",
  operations: "Operations Guides",
  management: "Management Guides",
  admin: "Admin Guides",
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "crm-basics",
    title: "CRM Basics",
    category: "management",
    description:
      "The NEVO CRM manages customers, suppliers, leads, orders, invoices, commission invoices, payments, files and reports.",
    steps: [
      "Log in from /admin/login.",
      "Open the Dashboard to see the business overview.",
      "Use Customers to create or manage client companies.",
      "Use Leads to register new business opportunities.",
      "Use Orders to track confirmed business.",
      "Use Proforma Invoices before final sale confirmation.",
      "Use Commercial Invoices for official customer billing.",
      "Use Commission Invoices to invoice suppliers for NEVO commission.",
      "Use Payments to track paid, unpaid and overdue amounts.",
      "Use Reports to review sales, orders and commission income.",
    ],
    commonMistakes: [
      "Creating an invoice before customer data is complete.",
      "Forgetting to assign a customer or supplier to an order.",
      "Using the wrong currency.",
      "Forgetting payment terms.",
      "Marking an invoice as paid without a payment reference.",
    ],
    bestPractice:
      "Keep records complete and up to date — every module depends on clean customer, supplier and order data.",
    relatedRoute: { label: "Open Dashboard", to: "/admin" },
  },
  {
    id: "customers",
    title: "Customer Management",
    category: "sales",
    description:
      "Add and maintain client companies. Every order, invoice and shipment must link back to a customer record.",
    steps: [
      "Go to Customers.",
      "Click Add Customer.",
      "Enter the company name.",
      "Enter the contact person.",
      "Add email and phone / WhatsApp.",
      "Select country and city.",
      "Select customer type.",
      "Select lead source.",
      "Assign the responsible user.",
      "Add notes if needed.",
      "Click Save.",
    ],
    requiredFields: [
      "Company Name",
      "Contact Person",
      "Email or Phone",
      "Country",
      "Customer Type",
      "Status",
    ],
    commonMistakes: [
      "Adding a customer without a contact person.",
      "Creating duplicate customers.",
      "Wrong country or phone format.",
      "Forgetting the assigned user.",
    ],
    bestPractice: "Always add a next follow-up date after creating a customer.",
    relatedRoute: { label: "Open Customers", to: "/admin/customers" },
  },
  {
    id: "leads",
    title: "Leads & Opportunities",
    category: "sales",
    description:
      "Track new business from first contact through to Won or Lost. Move a lead only when a real action has happened.",
    steps: [
      "Go to Leads or Opportunities.",
      "Click New Lead.",
      "Select an existing customer or create a new one.",
      "Enter the project name.",
      "Select the interested solution.",
      "Add estimated value and currency.",
      "Select expected closing date.",
      "Set probability.",
      "Assign a user.",
      "Save the lead.",
    ],
    requiredFields: [
      "Customer",
      "Project Name",
      "Estimated Value",
      "Currency",
      "Expected Closing Date",
      "Assigned User",
    ],
    commonMistakes: [
      "Marking a lead as Won before the order is confirmed.",
      "No estimated value.",
      "No follow-up date.",
      "Missing customer contact information.",
    ],
    bestPractice:
      "Pipeline: New → Qualified → Technical Review → Quotation Required → Quotation Sent → Proforma Sent → Negotiation → Won / Lost.",
    relatedRoute: { label: "Open Leads", to: "/admin/leads" },
  },
  {
    id: "orders",
    title: "Orders & Shipment Tracking",
    category: "operations",
    description:
      "Track confirmed business from order placement through production, shipment, customs and delivery.",
    steps: [
      "Go to Orders.",
      "Create a new order or open an existing one.",
      "Select the customer.",
      "Select the supplier if applicable.",
      "Link the related proforma invoice.",
      "Add products or services.",
      "Add order value and currency.",
      "Select order status.",
      "Add expected delivery date.",
      "Add shipment information when available.",
      "Upload related documents.",
      "Save updates.",
    ],
    requiredFields: [
      "Customer",
      "Order Value",
      "Currency",
      "Order Status",
      "Expected Delivery Date",
    ],
    commonMistakes: [
      "Changing order status without evidence.",
      "Missing supplier information.",
      "Missing payment status.",
      "Missing BL / AWB / container number for shipment.",
    ],
    bestPractice:
      "Order status: Draft → Confirmed → Waiting for Payment → Payment Received → Supplier Order Placed → In Production → Ready for Shipment → In Transit → Customs Clearance → Delivered → Completed. Every status change must include a note.",
    relatedRoute: { label: "Open Orders", to: "/admin/orders" },
  },
  {
    id: "products",
    title: "Product / Item Master",
    category: "operations",
    description:
      "The item master holds reusable product and service records used across quotations, proforma invoices, commercial invoices and orders.",
    steps: [
      "Go to Products.",
      "Click Add Product.",
      "Enter product name and short description.",
      "Select category / solution family.",
      "Enter unit (pcs, ton, m³, container).",
      "Enter default unit price and currency.",
      "Add HS code and origin if applicable.",
      "Save.",
    ],
    requiredFields: ["Name", "Unit", "Currency"],
    commonMistakes: [
      "Duplicating products with slightly different names.",
      "Missing unit or currency.",
      "Wrong HS code on export items.",
    ],
    bestPractice: "Keep product names short and consistent so they render cleanly on PDFs.",
    relatedRoute: { label: "Open Products", to: "/admin/products" },
  },
  {
    id: "suppliers",
    title: "Supplier Management",
    category: "operations",
    description:
      "Maintain supplier records used by orders, purchase orders and commission invoices.",
    steps: [
      "Go to Suppliers.",
      "Click Add Supplier.",
      "Enter company name and contact person.",
      "Add email and phone.",
      "Select country.",
      "Add product categories they supply.",
      "Add payment terms and bank details if available.",
      "Save.",
    ],
    requiredFields: ["Company Name", "Contact Person", "Country"],
    commonMistakes: [
      "Creating supplier without a contact person.",
      "Missing bank details for commission settlement.",
      "Duplicate supplier records.",
    ],
    bestPractice:
      "Attach signed supplier agreements to the supplier record so Finance can reference them from commission invoices.",
    relatedRoute: { label: "Open Suppliers", to: "/admin/suppliers" },
  },
  {
    id: "proforma-invoice",
    title: "Proforma Invoice",
    category: "sales",
    description:
      "A proforma invoice is issued before final sale confirmation. Always run AI Check before sending.",
    steps: [
      "Go to Proforma Invoices.",
      "Click New Proforma Invoice.",
      "Select the customer.",
      "Select currency.",
      "Select incoterms.",
      "Select payment terms.",
      "Add item rows.",
      "Enter quantity, unit and unit price.",
      "Check subtotal, VAT and grand total.",
      "Add delivery terms.",
      "Add bank details.",
      "Preview the PDF.",
      "Run AI Check.",
      "Save as Draft or Mark as Sent.",
    ],
    requiredFields: [
      "Customer",
      "Date",
      "Currency",
      "Items",
      "Quantity",
      "Unit Price",
      "Payment Terms",
      "Bank Details",
    ],
    commonMistakes: [
      "Wrong currency.",
      "Missing validity date.",
      "Wrong VAT calculation.",
      "Sending the PDF before running AI Check.",
    ],
    bestPractice:
      "AI Check verifies missing customer details, missing items, wrong totals, missing VAT, missing payment terms and missing bank details.",
    relatedRoute: { label: "Open Proforma Invoices", to: "/admin/proforma-invoices" },
  },
  {
    id: "commercial-invoice",
    title: "Commercial Invoice",
    category: "finance",
    description:
      "The commercial invoice is the official billing document to the customer. Create it from an accepted proforma or a confirmed order.",
    steps: [
      "Go to Commercial Invoices.",
      "Create the invoice from an accepted proforma or order.",
      "Check customer details.",
      "Check item details.",
      "Check invoice date and due date.",
      "Check currency.",
      "Check subtotal, VAT and grand total.",
      "Add payment terms.",
      "Add bank details.",
      "Preview the PDF.",
      "Run AI Check.",
      "Mark as Sent.",
      "Track payment status.",
    ],
    requiredFields: [
      "Customer",
      "Invoice Date",
      "Due Date",
      "Currency",
      "Items",
      "Payment Terms",
      "Bank Details",
    ],
    commonMistakes: [
      "Creating a commercial invoice before order confirmation.",
      "Marking paid without a payment reference.",
      "Missing due date.",
      "Wrong balance due.",
    ],
    bestPractice:
      "Payment status: Unpaid → Partially Paid → Paid, with Overdue flagged automatically when the due date passes.",
    relatedRoute: { label: "Open Commercial Invoices", to: "/admin/invoices" },
  },
  {
    id: "commission-invoice",
    title: "Commission Invoice",
    category: "finance",
    description:
      "A Commission Invoice is issued by NEVO to a supplier when NEVO earns commission for business development, sourcing coordination, commercial support or project facilitation.",
    steps: [
      "Go to Commission Invoices.",
      "Click New Commission Invoice.",
      "Select the supplier.",
      "Select the related customer.",
      "Link the related order.",
      "Enter the order value.",
      "Select commission basis.",
      "Enter commission rate or fixed amount.",
      "Check commission subtotal.",
      "Check VAT.",
      "Check total commission due.",
      "Add payment terms.",
      "Add bank details.",
      "Preview the PDF.",
      "Run AI Check.",
      "Mark as Sent.",
    ],
    requiredFields: [
      "Supplier",
      "Related Customer",
      "Related Order",
      "Order Value",
      "Commission Basis",
      "Commission Rate or Fixed Amount",
      "Payment Terms",
      "Bank Details",
    ],
    commonMistakes: [
      "No related order.",
      "Wrong commission basis.",
      "Wrong percentage.",
      "Missing supplier invoice reference.",
      "Marking paid without a payment reference.",
    ],
    bestPractice:
      "Commission basis: Percentage of order value, Fixed commission, Per ton, Per container, or Per project. Default service description: “Commission fee for business development, sourcing coordination, commercial support, and project facilitation.”",
    relatedRoute: { label: "Open Commission Invoices", to: "/admin/commission-invoices" },
  },
  {
    id: "purchase-order",
    title: "Purchase Order",
    category: "operations",
    description:
      "Purchase orders are issued to suppliers to formalise NEVO-side procurement for a confirmed customer order.",
    steps: [
      "Go to Purchase Orders.",
      "Click New Purchase Order.",
      "Select the supplier.",
      "Link the related customer order.",
      "Add items with quantity and unit price.",
      "Add incoterms and delivery terms.",
      "Add payment terms to the supplier.",
      "Preview the PDF.",
      "Send to the supplier and store their acknowledgement.",
    ],
    requiredFields: ["Supplier", "Items", "Currency", "Delivery Terms"],
    commonMistakes: [
      "Issuing a PO before the customer order is confirmed.",
      "Missing incoterms.",
      "Wrong delivery address.",
    ],
    bestPractice:
      "Attach the signed supplier acknowledgement to the PO record so Operations can reference it.",
    relatedRoute: { label: "Open Purchase Orders", to: "/admin/purchase-orders" },
  },
  {
    id: "payments",
    title: "Payments",
    category: "finance",
    description: "Track paid, unpaid and overdue amounts across invoices and commissions.",
    steps: [
      "Go to Payments.",
      "Click Add Payment.",
      "Select the payment type.",
      "Link the invoice or commission invoice.",
      "Select the customer or supplier.",
      "Enter amount and currency.",
      "Enter payment date.",
      "Add the payment reference.",
      "Upload the receipt if available.",
      "Save the payment.",
    ],
    requiredFields: [
      "Payment Type",
      "Linked Invoice",
      "Amount",
      "Currency",
      "Payment Date",
      "Payment Reference",
    ],
    commonMistakes: [
      "Payment not linked to an invoice.",
      "Wrong currency.",
      "Missing bank reference.",
      "Marking as fully paid when only a partial payment was received.",
    ],
    bestPractice:
      "Payment types: Customer Payment Received, Supplier Commission Payment Received, Supplier Payment Made, Refund, Advance Payment, Partial Payment.",
    relatedRoute: { label: "Open Payments", to: "/admin/payments" },
  },
  {
    id: "reports",
    title: "Reports",
    category: "management",
    description:
      "Reports summarise sales, orders, commission income and outstanding payments across the business.",
    steps: [
      "Go to Reports.",
      "Select the report type (Sales, Orders, Commission, Payments).",
      "Choose the date range.",
      "Filter by customer, supplier or user if needed.",
      "Review totals and trends.",
      "Export to CSV if required.",
    ],
    commonMistakes: [
      "Comparing reports across different currencies without conversion.",
      "Exporting without setting a date range.",
    ],
    bestPractice: "Always confirm the currency and date range before sharing a report externally.",
    relatedRoute: { label: "Open Reports", to: "/admin/reports" },
  },
  {
    id: "file-uploads",
    title: "File Uploads",
    category: "operations",
    description:
      "Attach documents (contracts, BL/AWB, packing lists, datasheets, photos) to the correct customer, supplier, order or invoice.",
    steps: [
      "Open the customer, supplier, order or invoice record.",
      "Go to Files / Attachments.",
      "Click Upload File.",
      "Choose the document category.",
      "Add a document title.",
      "Upload the file.",
      "Save.",
    ],
    bestPractice:
      "Categories: Customer documents, Supplier agreements, Invoices, Commission invoices, Packing lists, BL / AWB, Datasheets, Photos, Technical drawings, Contracts. Always link uploaded documents to the correct record.",
    relatedRoute: { label: "Open Files", to: "/admin/files" },
  },
  {
    id: "ai-assistant",
    title: "AI Assistant Usage",
    category: "management",
    description:
      "The AI Assistant can explain CRM workflows, check invoices and summarise uploaded documents. It never approves, sends, deletes or marks paid without user confirmation.",
    steps: [
      "Open AI Assistant from the sidebar.",
      "Ask a question about CRM, invoices, orders or documents.",
      "Upload documents to the Knowledge Base when needed.",
      "Ask AI to summarise documents.",
      "Use AI Check before sending invoices.",
      "Review the AI answer and its sources.",
      "Do not rely on AI if the source is missing.",
    ],
    bestPractice:
      "Common questions: How do I create a customer? How do I generate a proforma invoice? How do I create a commission invoice? What is missing in this invoice? Which customers need follow-up? Which invoices are overdue?",
    relatedRoute: { label: "Open AI Assistant", to: "/admin/ai-assistant" },
  },
  {
    id: "roles",
    title: "User Roles & Permissions",
    category: "admin",
    description:
      "Role-based access controls what each user can see and do. Roles are enforced by database policies.",
    steps: [
      "Super Admin: full access to every module and setting.",
      "Management: view all modules, approve documents and see reports.",
      "Sales: manage customers, leads, opportunities, quotations and proforma invoices.",
      "Operations: manage orders, shipment status and delivery documents.",
      "Finance: manage invoices, commission invoices, payments and financial reports.",
      "Read Only: view allowed records only.",
    ],
    commonMistakes: [
      "Giving Finance access to Sales users.",
      "Giving Admin access to normal users.",
      "Allowing users to see documents outside their role.",
    ],
    bestPractice:
      "Assign the least-privileged role that lets the user do their job. Escalate temporarily and revoke afterwards.",
    relatedRoute: { label: "Open User Roles", to: "/admin/user-roles" },
  },
  {
    id: "common-mistakes",
    title: "Common Mistakes",
    category: "management",
    description: "A checklist of the mistakes that most often cause rework in the CRM.",
    steps: [
      "Creating invoices before customer data is complete.",
      "Missing supplier on an order.",
      "Wrong currency on invoice or payment.",
      "Marking an invoice paid without a payment reference.",
      "Skipping AI Check before sending a PDF.",
      "Skipping the follow-up date on a new lead or customer.",
      "Uploading a document without linking it to a record.",
    ],
    bestPractice:
      "When in doubt, run AI Check and re-read the required fields for the module you are working in.",
  },
  {
    id: "daily-workflow",
    title: "Daily Workflow",
    category: "management",
    description: "Recommended daily rhythm for internal NEVO users.",
    steps: [
      "Start on the Dashboard — check today's tasks and follow-ups.",
      "Review overdue invoices and payments.",
      "Update lead stages that changed since yesterday.",
      "Process new orders and update order statuses.",
      "Issue any pending proforma, commercial or commission invoices — run AI Check before sending.",
      "Log payments received against their invoices.",
      "Upload the day's documents to the correct records.",
      "End the day with a quick Reports check.",
    ],
    bestPractice:
      "A consistent daily rhythm keeps customers, suppliers, invoices and payments in sync — and keeps AI answers accurate.",
    relatedRoute: { label: "Open Dashboard", to: "/admin" },
  },
];

export function getGuideSection(id: string): GuideSection | undefined {
  return GUIDE_SECTIONS.find((s) => s.id === id);
}
