import type { Meta, StoryObj } from "@storybook/react";
import { Target, Plus } from "lucide-react";
import { AdminListPage } from "./AdminListPage";
import { Button } from "@/components/ui/button";

type Row = { id: string; name: string; stage: string };

const READY_ROWS: Row[] = [
  { id: "opp_1", name: "Acme — Q3 renewal", stage: "Negotiation" },
  { id: "opp_2", name: "Globex — pilot expansion", stage: "Proposal" },
  { id: "opp_3", name: "Initech — new logo", stage: "Discovery" },
];

interface DemoArgs {
  state: "error" | "loading" | "empty" | "ready" | "schema-drift";
  expectSeed: boolean;
}

function Demo({ state, expectSeed }: DemoArgs) {
  const props = (() => {
    switch (state) {
      case "error":
        return { isLoading: false, error: new Error("relation does not exist"), data: undefined };
      case "loading":
        return { isLoading: true, error: null, data: undefined };
      case "empty":
        return { isLoading: false, error: null, data: [] as Row[] };
      case "schema-drift":
        // Non-array response → classifier routes to error automatically.
        return { isLoading: false, error: null, data: { oops: true } as unknown as Row[] };
      case "ready":
        return { isLoading: false, error: null, data: READY_ROWS };
    }
  })();

  return (
    <AdminListPage<Row>
      resource="opportunities"
      eyebrow="CRM"
      title="Opportunities"
      subtitle="Pipeline of open and closed deals across NEVO Industrial."
      {...props}
      refetch={() => {}}
      isFetching={false}
      expectSeed={expectSeed}
      empty={{
        icon: Target,
        title: "No opportunities yet",
        description: "New opportunities will show up here as your team creates them.",
        action: (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            New opportunity
          </Button>
        ),
      }}
    >
      {(rows) => (
        <table className="w-full text-sm border rounded-md">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2 font-mono text-xs">{row.id}</td>
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminListPage>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Admin/List States/4 — AdminListPage template",
  component: Demo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Reusable shell that wires `classifyListState` and both telemetry " +
          "streams (`admin_list_empty_shown`, `reportClientError`) automatically. " +
          "Pages pass the React Query triple + an `empty` config and a `children` " +
          "renderer for the ready state — precedence and a11y are enforced.",
      },
    },
  },
  argTypes: {
    state: {
      control: { type: "radio" },
      options: ["error", "loading", "empty", "ready", "schema-drift"],
    },
    expectSeed: { control: { type: "boolean" } },
  },
  args: { state: "ready", expectSeed: false },
};

export default meta;
type Story = StoryObj<typeof Demo>;

export const Ready: Story = { args: { state: "ready" } };
export const Loading: Story = { args: { state: "loading" } };
export const Empty: Story = { args: { state: "empty" } };
export const EmptyWithSeedExpected: Story = {
  args: { state: "empty", expectSeed: true },
  parameters: {
    docs: {
      description: {
        story:
          "`expectSeed` flips the empty reason to `seed_missing` and escalates telemetry to `warn`.",
      },
    },
  },
};
export const Errored: Story = { args: { state: "error" } };
export const SchemaDrift: Story = {
  args: { state: "schema-drift" },
  parameters: {
    docs: {
      description: {
        story:
          "Non-array response → `classifyListState` returns `{ kind: 'error' }`, so the " +
          "shell renders `ListErrorState` and fires error telemetry instead of a bare empty card.",
      },
    },
  },
};
