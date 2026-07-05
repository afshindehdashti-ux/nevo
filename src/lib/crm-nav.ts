import {
  LayoutDashboard, Users, Target, TrendingUp, Package, Truck, Boxes,
  FileText, Receipt, Percent, ClipboardList, Wallet, CheckSquare,
  FolderOpen, BarChart3, Settings, UserCog, Image as ImageIcon, Search,
} from "lucide-react";

export type CrmNavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresSuperAdmin?: boolean;
};

export type CrmNavGroup = {
  label: string;
  items: CrmNavItem[];
};

export const CRM_NAV: CrmNavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Sales & CRM",
    items: [
      { title: "Customers", url: "/admin/customers", icon: Users },
      { title: "Leads", url: "/admin/leads", icon: Target },
      { title: "Opportunities", url: "/admin/opportunities", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Orders", url: "/admin/orders", icon: Truck },
      { title: "Suppliers", url: "/admin/suppliers", icon: Package },
      { title: "Products", url: "/admin/products", icon: Boxes },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Proforma Invoices", url: "/admin/proforma-invoices", icon: FileText },
      { title: "Invoices", url: "/admin/invoices", icon: Receipt },
      { title: "Commission Invoices", url: "/admin/commission-invoices", icon: Percent },
      { title: "Purchase Orders", url: "/admin/purchase-orders", icon: ClipboardList },
      { title: "Payments", url: "/admin/payments", icon: Wallet },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Tasks", url: "/admin/tasks", icon: CheckSquare },
      { title: "Files", url: "/admin/files", icon: FolderOpen },
      { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Telemetry",
    items: [
      { title: "Logo Events", url: "/admin/logo-events", icon: ImageIcon },
      { title: "Solutions SEO", url: "/admin/solutions-seo", icon: Search },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Users & Roles", url: "/admin/users", icon: UserCog, requiresSuperAdmin: true },
      { title: "Settings", url: "/admin/settings", icon: Settings, requiresSuperAdmin: true },
    ],
  },
];
