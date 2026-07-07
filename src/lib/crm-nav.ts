import {
  LayoutDashboard,
  Users,
  Target,
  TrendingUp,
  Package,
  Truck,
  Boxes,
  FileText,
  Receipt,
  Percent,
  ClipboardList,
  Wallet,
  CheckSquare,
  FolderOpen,
  BarChart3,
  Settings,
  UserCog,
  Image as ImageIcon,
  Search,
  ScrollText,
  ShieldCheck,
  ShieldAlert,
  Brain,
  MessagesSquare,
  Mail,
  Upload,
  Activity,
  Bell,
  FileDown,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type CrmNavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresSuperAdmin?: boolean;
  /**
   * Roles allowed to see this module. `super_admin` always sees everything,
   * regardless of this list. Omit to allow every authenticated role.
   */
  allowedRoles?: AppRole[];
};

export type CrmNavGroup = {
  label: string;
  items: CrmNavItem[];
};

// Role visibility matrix. `super_admin` bypasses this filter entirely.
const ALL_STAFF: AppRole[] = ["management", "sales", "operations", "finance", "read_only"];
const SALES_OPS: AppRole[] = ["management", "sales", "operations"];
const OPS_ONLY: AppRole[] = ["management", "operations"];
const FINANCE_ONLY: AppRole[] = ["management", "finance"];

export const CRM_NAV: CrmNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, allowedRoles: ALL_STAFF },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { title: "Customers", url: "/admin/customers", icon: Users, allowedRoles: SALES_OPS },
      { title: "Leads", url: "/admin/leads", icon: Target, allowedRoles: SALES_OPS },
      {
        title: "Opportunities",
        url: "/admin/opportunities",
        icon: TrendingUp,
        allowedRoles: SALES_OPS,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Orders", url: "/admin/orders", icon: Truck, allowedRoles: SALES_OPS },
      { title: "Shipments", url: "/admin/shipments", icon: Package, allowedRoles: OPS_ONLY },
      { title: "Suppliers", url: "/admin/suppliers", icon: Package, allowedRoles: OPS_ONLY },
      { title: "Products", url: "/admin/products", icon: Boxes, allowedRoles: OPS_ONLY },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Quotations", url: "/admin/quotations", icon: FileText, allowedRoles: SALES_OPS },
      {
        title: "Proforma Invoices",
        url: "/admin/proforma-invoices",
        icon: FileText,
        allowedRoles: FINANCE_ONLY,
      },
      { title: "Invoices", url: "/admin/invoices", icon: Receipt, allowedRoles: FINANCE_ONLY },
      {
        title: "Commission Invoices",
        url: "/admin/commission-invoices",
        icon: Percent,
        allowedRoles: FINANCE_ONLY,
      },
      {
        title: "Purchase Orders",
        url: "/admin/purchase-orders",
        icon: ClipboardList,
        allowedRoles: FINANCE_ONLY,
      },
      { title: "Payments", url: "/admin/payments", icon: Wallet, allowedRoles: FINANCE_ONLY },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Tasks", url: "/admin/tasks", icon: CheckSquare, allowedRoles: ALL_STAFF },
      {
        title: "Communications",
        url: "/admin/communications",
        icon: MessagesSquare,
        allowedRoles: ALL_STAFF,
      },
      { title: "Files", url: "/admin/files", icon: FolderOpen, allowedRoles: ALL_STAFF },
      {
        title: "Document Intelligence",
        url: "/admin/document-intelligence",
        icon: Brain,
        allowedRoles: ALL_STAFF,
      },
      {
        title: "Routing Rules",
        url: "/admin/doc-intel-rules",
        icon: ShieldCheck,
        requiresSuperAdmin: true,
      },
      { title: "Reports", url: "/admin/reports", icon: BarChart3, allowedRoles: ALL_STAFF },
    ],
  },
  {
    label: "Telemetry",
    items: [
      { title: "Logo Events", url: "/admin/logo-events", icon: ImageIcon, requiresSuperAdmin: true },
      {
        title: "Solutions SEO",
        url: "/admin/solutions-seo",
        icon: Search,
        requiresSuperAdmin: true,
      },
      {
        title: "Mail Hub",
        url: "/admin/mails",
        icon: Mail,
        allowedRoles: ["management"],
      },
      {
        title: "Email Templates",
        url: "/admin/email-preview",
        icon: Mail,
        requiresSuperAdmin: true,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Control Panel",
        url: "/admin/control-panel",
        icon: ShieldCheck,
        requiresSuperAdmin: true,
      },
      { title: "Users & Roles", url: "/admin/users", icon: UserCog, requiresSuperAdmin: true },
      { title: "Activity Log", url: "/admin/activity", icon: ScrollText, requiresSuperAdmin: true },
      {
        title: "Approvals",
        url: "/admin/approvals",
        icon: ShieldCheck,
        allowedRoles: ["management", "finance"],
      },
      {
        title: "Approvals audit",
        url: "/admin/approvals/audit",
        icon: ScrollText,
        allowedRoles: ["management", "finance"],
      },
      {
        title: "CSV Export History",
        url: "/admin/exports",
        icon: FileDown,
        allowedRoles: ["management", "finance"],
      },
      {
        title: "Import Data",
        url: "/admin/import",
        icon: Upload,
        allowedRoles: ["management", "operations", "finance"],
      },
      { title: "Backend Health", url: "/admin/backend-health", icon: Activity, requiresSuperAdmin: true },
      { title: "Backend Alerts", url: "/admin/alerts", icon: Bell, requiresSuperAdmin: true },
      { title: "Security Alerts", url: "/admin/security-alerts", icon: ShieldAlert, requiresSuperAdmin: true },
      { title: "Security Audit", url: "/admin/security-audit", icon: ShieldCheck, requiresSuperAdmin: true },
      { title: "Settings", url: "/admin/settings", icon: Settings, requiresSuperAdmin: true },
    ],
  },
];

/** Returns true when a user with `roles` can see `item`. */
export function canSeeNavItem(item: CrmNavItem, roles: AppRole[]): boolean {
  const isSuper = roles.includes("super_admin");
  if (isSuper) return true;
  if (item.requiresSuperAdmin) return false;
  if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
  return item.allowedRoles.some((r) => roles.includes(r));
}
