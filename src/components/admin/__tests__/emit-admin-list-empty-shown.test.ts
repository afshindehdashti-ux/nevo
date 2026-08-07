import { describe, expect, it, vi } from "vitest";
import { emitAdminListEmptyShown } from "../list-telemetry";

describe("emitAdminListEmptyShown — runtime validation wrapper", () => {
  it("forwards a valid payload as an info-level admin_list_empty_shown event", () => {
    const logger = vi.fn();
    const result = emitAdminListEmptyShown(
      { surface: "admin_list", resource: "opportunities", reason: "no_records" },
      logger,
    );

    expect(result).toEqual({
      ok: true,
      payload: { surface: "admin_list", resource: "opportunities", reason: "no_records" },
      level: "info",
    });
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith(
      "admin_list_empty_shown",
      { surface: "admin_list", resource: "opportunities", reason: "no_records" },
      "info",
    );
  });

  it("escalates seed_missing to warn level", () => {
    const logger = vi.fn();
    emitAdminListEmptyShown(
      { surface: "admin_list", resource: "opportunities", reason: "seed_missing" },
      logger,
    );
    expect(logger).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "warn");
  });

  it("rejects unknown resource slugs and emits a rejection diagnostic instead", () => {
    const logger = vi.fn();
    const result = emitAdminListEmptyShown(
      { surface: "admin_list", resource: "not_a_thing", reason: "no_records" },
      logger,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid_resource");
    expect(result.offending).toBe("not_a_thing");

    // Real event must NOT have been sent.
    expect(logger).not.toHaveBeenCalledWith(
      "admin_list_empty_shown",
      expect.anything(),
      expect.anything(),
    );
    // A rejection diagnostic MUST have been sent, at warn level, with the allowlist.
    expect(logger).toHaveBeenCalledWith(
      "admin_list_empty_shown__rejected",
      expect.objectContaining({
        reason: "invalid_resource",
        offending: "not_a_thing",
        allowed: expect.arrayContaining(["opportunities"]),
      }),
      "warn",
    );
  });

  it("rejects unknown reason values", () => {
    const logger = vi.fn();
    const result = emitAdminListEmptyShown(
      { surface: "admin_list", resource: "opportunities", reason: "bogus" },
      logger,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid_reason");
    expect(logger).not.toHaveBeenCalledWith(
      "admin_list_empty_shown",
      expect.anything(),
      expect.anything(),
    );
    expect(logger).toHaveBeenCalledWith(
      "admin_list_empty_shown__rejected",
      expect.objectContaining({
        reason: "invalid_reason",
        offending: "bogus",
        resource: "opportunities",
      }),
      "warn",
    );
  });

  it("rejects a wrong surface value", () => {
    const logger = vi.fn();
    const result = emitAdminListEmptyShown(
      { surface: "not_admin_list", resource: "opportunities", reason: "no_records" },
      logger,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid_surface");
  });

  it.each([null, undefined, 42, "string", []])("rejects non-object payload: %s", (candidate) => {
    const logger = vi.fn();
    const result = emitAdminListEmptyShown(candidate, logger);
    expect(result.ok).toBe(false);
    expect(logger).not.toHaveBeenCalledWith(
      "admin_list_empty_shown",
      expect.anything(),
      expect.anything(),
    );
  });

  it("never throws when the underlying logger throws", () => {
    const logger = vi.fn(() => {
      throw new Error("transport dead");
    });
    expect(() =>
      emitAdminListEmptyShown(
        { surface: "admin_list", resource: "opportunities", reason: "no_records" },
        logger,
      ),
    ).not.toThrow();
  });
});
