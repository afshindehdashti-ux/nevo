import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The loading skeleton is not a dedicated component — the house style is
 * three `<Skeleton className="h-12 w-full" />` rows wrapped in a container
 * with `data-testid="list-skeleton"` and `aria-busy="true"`. This story
 * documents that shape so it stays consistent across every admin list page.
 */
function ListLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div data-testid="list-skeleton" aria-busy="true" aria-live="polite" className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

const meta: Meta<typeof ListLoadingSkeleton> = {
  title: "Admin/List States/2 — Loading Skeleton",
  component: ListLoadingSkeleton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Rank 2 in the admin-list precedence chain (**error → loading → empty → ready**). " +
          "Renders only on React Query's initial `isLoading`, never on background " +
          "`isFetching`, so it never flashes during refetches. Contract: " +
          '`data-testid="list-skeleton"` + `aria-busy="true"` — tests assert on both.',
      },
    },
  },
  args: { rows: 3 },
};

export default meta;
type Story = StoryObj<typeof ListLoadingSkeleton>;

export const Default: Story = {};

export const DenseTable: Story = { args: { rows: 8 } };
