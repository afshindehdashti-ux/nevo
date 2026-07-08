import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ListErrorState } from "@/components/admin/ListErrorState";
import { ListEmptyState } from "@/components/admin/ListEmptyState";
import { classifyListState } from "@/components/admin/list-state";
import type { AdminListResource } from "@/components/admin/list-telemetry";

/**
 * Shared props for every AdminListPage variant. The `expectSeed` /
 * `filtersActive` split lives on `AdminListPageProps` (below) as a
 * discriminated union so the two flags can't be set at the same time.
 */
interface AdminListPageBaseProps<T> {
  /**
   * Registered telemetry slug — used by BOTH error and empty telemetry.
   * Must be a member of `ADMIN_LIST_RESOURCES`; unknown slugs won't
   * compile.
   */
  resource: AdminListResource;
  /** Human page title, e.g. "Opportunities". */
  title: string;
  /** One-line subtitle under the title. Optional. */
  subtitle?: string;
  /** Small uppercase eyebrow, e.g. "CRM". Optional. */
  eyebrow?: string;

  /** React Query result triple — pass through directly. */
  isLoading: boolean;
  error: unknown;
  data: T[] | null | undefined;

  /** From `useQuery` — used by the error card's Retry button. */
  refetch: () => void;
  /** From `useQuery` — disables Retry while a refetch is in flight. */
  isFetching?: boolean;

  /** Empty-state config (only these props — everything else is enforced). */
  empty: {
    icon: LucideIcon;
    title: string;
    /** Keep the phrase "will show up here" or "will appear here" per contract. */
    description: string;
    action?: ReactNode;
  };

  /** Render function for the ready state — receives the guaranteed non-empty rows. */
  children: (rows: T[]) => ReactNode;

  /**
   * How many skeleton rows to render while loading. Defaults to 3 to match
   * the house style documented in `docs/admin-list-states.md`.
   */
  skeletonRows?: number;

  /** Optional slot rendered above the state region (filters, tabs, etc.). */
  toolbar?: ReactNode;
}

/**
 * `expectSeed` and `filtersActive` describe *why* an empty result is
 * expected in this environment and drive the emitted `reason`. They are
 * mutually exclusive — set at most one. Invalid combinations (both true)
 * fail to compile.
 */
export type AdminListPageProps<T> = AdminListPageBaseProps<T> &
  (
    | { expectSeed?: false; filtersActive?: false }
    | { expectSeed: true; filtersActive?: never }
    | { expectSeed?: never; filtersActive: true }
  );

/**
 * Canonical admin list page shell. Enforces the contract from
 * `docs/admin-list-states.md`:
 *
 *   error → loading → empty → ready
 *
 * Wired via `classifyListState`, so schema drift (non-array response) is
 * routed through `ListErrorState` and telemetry — never rendered as an
 * unexplained empty card. `ListErrorState` and `ListEmptyState` handle
 * their own telemetry once the classifier picks a branch, so pages get
 * consistent `admin_list_empty_shown` / `reportClientError` events for
 * free — nothing to remember at the call site.
 */
export function AdminListPage<T>(props: AdminListPageProps<T>) {
  const {
    resource,
    title,
    subtitle,
    eyebrow,
    isLoading,
    error,
    data,
    refetch,
    isFetching,
    empty,
    children,
    skeletonRows = 3,
    toolbar,
  } = props;

  // Re-narrow the discriminated union for classifyListState — passing
  // `props` directly loses the mutual-exclusivity refinement.
  const view = props.expectSeed
    ? classifyListState<T>({ isLoading, error, data, expectSeed: true })
    : props.filtersActive
      ? classifyListState<T>({ isLoading, error, data, filtersActive: true })
      : classifyListState<T>({ isLoading, error, data });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <header>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        ) : null}
      </header>

      {toolbar}

      {view.kind === "error" ? (
        <ListErrorState
          resource={resource}
          error={view.error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : view.kind === "loading" ? (
        <div
          data-testid="list-skeleton"
          aria-busy="true"
          aria-live="polite"
          className="space-y-2"
        >
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : view.kind === "empty" ? (
        <ListEmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={empty.action}
          resource={resource}
          reason={view.reason}
        />
      ) : (
        children(view.rows)
      )}
    </div>
  );
}
