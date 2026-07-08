import type { Meta, StoryObj } from "@storybook/react";
import { ListErrorState } from "./ListErrorState";

const meta: Meta<typeof ListErrorState> = {
  title: "Admin/List States/1 — ListErrorState",
  component: ListErrorState,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Rank 1 in the admin-list precedence chain (**error → loading → empty → ready**). " +
          "When the query throws, this replaces the table area regardless of whether data " +
          "is still loading or would resolve to empty. Non-destructive: cached data stays.",
      },
    },
  },
  args: {
    resource: "opportunities",
    error: new Error("relation \"public.opportunities\" does not exist"),
    onRetry: () => {},
    isRetrying: false,
  },
};

export default meta;
type Story = StoryObj<typeof ListErrorState>;

export const Default: Story = {};

export const Retrying: Story = {
  args: { isRetrying: true },
  parameters: {
    docs: { description: { story: "Retry button disabled + spinner while the refetch is in flight." } },
  },
};

export const NetworkError: Story = {
  args: { error: new Error("Failed to fetch") },
};

export const NonErrorThrown: Story = {
  args: { error: "unexpected string thrown from loader" },
  parameters: {
    docs: { description: { story: "Defensive path — non-Error values are coerced to a readable message." } },
  },
};
