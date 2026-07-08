import type { Meta, StoryObj } from "@storybook/react";
import { Target, Plus } from "lucide-react";
import { ListEmptyState } from "./ListEmptyState";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof ListEmptyState> = {
  title: "Admin/List States/3 — ListEmptyState",
  component: ListEmptyState,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Rank 3 in the admin-list precedence chain (**error → loading → empty → ready**). " +
          "Only renders when there is no error, loading has resolved, and the resulting " +
          "array is empty. Emits `admin_list_empty_shown` once per `(resource, reason)`.",
      },
    },
  },
  args: {
    icon: Target,
    title: "No opportunities yet",
    description: "New opportunities will show up here as your team creates them.",
    resource: "opportunities",
    reason: "no_records",
  },
};

export default meta;
type Story = StoryObj<typeof ListEmptyState>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: (
      <Button size="sm">
        <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
        New opportunity
      </Button>
    ),
  },
};

export const SeedMissing: Story = {
  args: {
    reason: "seed_missing",
    title: "No opportunities loaded",
    description:
      "The seed script did not populate this table — telemetry escalates to `warn` so ops can investigate.",
  },
};

export const FilteredOut: Story = {
  args: {
    reason: "filtered_out",
    title: "No opportunities match your filters",
    description: "Adjust or clear the filters above and results will appear here.",
  },
};
