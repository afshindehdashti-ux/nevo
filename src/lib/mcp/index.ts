import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listCustomersTool from "./tools/list-customers";
import listLeadsTool from "./tools/list-leads";
import listInvoicesTool from "./tools/list-invoices";
import listTasksTool from "./tools/list-tasks";
import createInquiryTool from "./tools/create-inquiry";

// Direct Supabase issuer (never the .lovable.cloud proxy — mcp-js rejects that
// as an RFC 8414 issuer mismatch). VITE_SUPABASE_PROJECT_ID is inlined by Vite
// at build time. The sentinel fallback keeps the issuer well-formed during the
// throwaway manifest-extract eval; a real token never verifies against it.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nevo-industrial-mcp",
  title: "NEVO Industrial ERP",
  version: "0.1.0",
  instructions:
    "Tools for the NEVO Industrial back office (CRM, invoices, tasks). Calls run as the signed-in user; row-level security applies. Use `echo` to verify connectivity.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    echoTool,
    listCustomersTool,
    listLeadsTool,
    listInvoicesTool,
    listTasksTool,
    createInquiryTool,
  ],
});
