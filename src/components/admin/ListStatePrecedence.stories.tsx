import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Target } from "lucide-react";
import { ListErrorState } from "./ListErrorState";
import { ListEmptyState } from "./ListEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminListResource } from "./list-telemetry";

type StateKind = "error" | "loading" | "empty" | "ready";

interface PrecedenceDemoProps {
  /** Which of the four states to render — matches the branch order in the real pages. */
  state: StateKind;
  /** Resource slug used for telemetry — matches admin-list-states.md contract. */
  resource: AdminListResource;
}

/**
 * Live demonstration of the admin-list precedence rule:
 * **error → loading → empty → ready**. Change the `state` control to walk
 * through each branch; only one state renders at a time, matching the
 * `error ? … : isLoading ? … : empty ? … : <table>` chain used by every
 * admin list page.
 */
function PrecedenceDemo({ state, resource }: PrecedenceDemoProps) {
  // Simulate the values a page would pass into the branch chain.
  const { error, isLoading, data } = useMemo(() => {
    switch (state) {
      case "error":
        return { error: new Error("Simulated: query failed"), isLoading: false, data: undefined };
      case "loading":
        return { error: null as unknown, isLoading: true, data: undefined };
      case "empty":
        return { error: null as unknown, isLoading: false, data: [] as unknown[] };
      case "ready":
        return {
          error: null as unknown,
          isLoading: false,
          data: [
            { id: "1", name: "Acme Corp — Q3 renewal" },
            { id: "2", name: "Globex — pilot expansion" },
            { id: "3", name: "Initech — new logo" },
          ],
        };
    }
  }, [state]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      <header>
        <h1 className="text-lg font-semibold">Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          Precedence demo — current branch: <code>{state}</code>
        </p>
      </header>

      {error ? (
        <ListErrorState
          resource={resource}
          error={error}
          onRetry={() => {}}
          isRetrying={false}
        />
      ) : isLoading ? (
        <div
          data-testid="list-skeleton"
          aria-busy="true"
          aria-live="polite"
          className="space-y-2"
        >
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <ListEmptyState
          icon={Target}
          title="No opportunities yet"
          description="New opportunities will show up here as your team creates them."
          resource={resource}
        />
      ) : (
        <table className="w-full text-sm border rounded-md">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Name</th>
            </tr>
          </thead>
          <tbody>
            {(data as Array<{ id: string; name: string }>).map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2 font-mono text-xs">{row.id}</td>
                <td className="p-2">{row.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const meta: Meta<typeof PrecedenceDemo> = {
  title: "Admin/List States/0 — Precedence (error → loading → empty → ready)",
  component: PrecedenceDemo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The admin-list contract requires exactly **one** state visible at a time, " +
          "chosen in this fixed order:\n\n" +
          "1. **Error** — `ListErrorState` (wins over everything, including loading).\n" +
          "2. **Loading** — three `<Skeleton />` rows (initial `isLoading` only).\n" +
          "3. **Empty** — `ListEmptyState` (only when `data.length === 0`).\n" +
          "4. **Ready** — the data table.\n\n" +
          "Use the `state` control below to walk through each branch and verify " +
          "no two states ever render together.",
      },
    },
  },
  argTypes: {
    state: {
      control: { type: "radio" },
      options: ["error", "loading", "empty", "ready"] satisfies StateKind[],
    },
  },
  args: {
    state: "error",
    resource: "opportunities",
  },
};

export default meta;
type Story = StoryObj<typeof PrecedenceDemo>;

/** Rank 1 — error trumps loading, empty, and ready. */
export const ErrorBeatsAll: Story = { args: { state: "error" } };

/** Rank 2 — with no error, loading trumps empty and ready. */
export const LoadingBeatsEmptyAndReady: Story = { args: { state: "loading" } };

/** Rank 3 — resolved with `[]` → empty card, never a bare table. */
export const EmptyBeatsReady: Story = { args: { state: "empty" } };

/** Rank 4 — data present, table renders. */
export const Ready: Story = { args: { state: "ready" } };
