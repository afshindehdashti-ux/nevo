import { describe, expect, it } from "vitest";
import {
  customerBillingAddress,
  customerDisplayName,
  customerVatNumber,
  financeBalanceDue,
  financePaidAmount,
  financeTotalAmount,
} from "@/lib/finance-normalization";

describe("customerDisplayName", () => {
  it("prefers company_name over name and email", () => {
    expect(
      customerDisplayName({
        company_name: "Acme Corp",
        name: "John Doe",
        email: "john@acme.test",
      }),
    ).toBe("Acme Corp");
  });

  it("falls back to name when company_name is missing or blank", () => {
    expect(customerDisplayName({ name: "John Doe" })).toBe("John Doe");
    expect(customerDisplayName({ company_name: "   ", name: "John Doe" })).toBe(
      "John Doe",
    );
  });

  it("falls back to email when company and name are blank", () => {
    expect(
      customerDisplayName({
        company_name: null,
        name: "",
        email: "john@acme.test",
      }),
    ).toBe("john@acme.test");
  });

  it("returns an em-dash when nothing is available", () => {
    expect(customerDisplayName(null)).toBe("—");
    expect(customerDisplayName(undefined)).toBe("—");
    expect(customerDisplayName({})).toBe("—");
    expect(
      customerDisplayName({ company_name: "  ", name: "  ", email: "  " }),
    ).toBe("—");
  });

  it("trims surrounding whitespace on the winning field", () => {
    expect(customerDisplayName({ company_name: "  Acme  " })).toBe("Acme");
  });
});

describe("customerBillingAddress", () => {
  it("prefers billing_address over address", () => {
    expect(
      customerBillingAddress({
        billing_address: "1 Billing Rd",
        address: "2 Street Ave",
      }),
    ).toBe("1 Billing Rd");
  });

  it("falls back to address when billing_address is blank", () => {
    expect(
      customerBillingAddress({ billing_address: "   ", address: "2 Street" }),
    ).toBe("2 Street");
    expect(customerBillingAddress({ address: "2 Street" })).toBe("2 Street");
  });

  it("returns null when nothing is available", () => {
    expect(customerBillingAddress(null)).toBeNull();
    expect(customerBillingAddress(undefined)).toBeNull();
    expect(customerBillingAddress({})).toBeNull();
    expect(
      customerBillingAddress({ billing_address: "", address: "   " }),
    ).toBeNull();
  });
});

describe("customerVatNumber", () => {
  it("returns the trimmed vat number when present", () => {
    expect(customerVatNumber({ vat_number: "  IT12345  " })).toBe("IT12345");
  });

  it("returns null for missing or blank values", () => {
    expect(customerVatNumber(null)).toBeNull();
    expect(customerVatNumber(undefined)).toBeNull();
    expect(customerVatNumber({})).toBeNull();
    expect(customerVatNumber({ vat_number: "   " })).toBeNull();
    expect(customerVatNumber({ vat_number: null })).toBeNull();
  });
});

describe("financePaidAmount", () => {
  it("prefers amount_paid over paid_amount", () => {
    expect(financePaidAmount({ amount_paid: 100, paid_amount: 50 })).toBe(100);
  });

  it("falls back to paid_amount when amount_paid is missing", () => {
    expect(financePaidAmount({ paid_amount: 75 })).toBe(75);
  });

  it("coerces numeric strings", () => {
    expect(financePaidAmount({ amount_paid: "42.5" })).toBe(42.5);
  });

  it("returns 0 for null, undefined, empty, or invalid values", () => {
    expect(financePaidAmount(null)).toBe(0);
    expect(financePaidAmount(undefined)).toBe(0);
    expect(financePaidAmount({})).toBe(0);
    expect(financePaidAmount({ amount_paid: null, paid_amount: null })).toBe(0);
    expect(financePaidAmount({ amount_paid: "not-a-number" })).toBe(0);
  });
});

describe("financeTotalAmount", () => {
  it("prefers grand_total over total", () => {
    expect(financeTotalAmount({ grand_total: 999, total: 100 })).toBe(999);
  });

  it("falls back to total when grand_total is missing", () => {
    expect(financeTotalAmount({ total: 250 })).toBe(250);
  });

  it("coerces numeric strings", () => {
    expect(financeTotalAmount({ grand_total: "1200.75" })).toBe(1200.75);
  });

  it("returns 0 for null, undefined, or invalid values", () => {
    expect(financeTotalAmount(null)).toBe(0);
    expect(financeTotalAmount(undefined)).toBe(0);
    expect(financeTotalAmount({})).toBe(0);
    expect(financeTotalAmount({ grand_total: "abc" })).toBe(0);
  });
});

describe("financeBalanceDue", () => {
  it("uses the stored balance_due when present (preferred over balance)", () => {
    expect(
      financeBalanceDue({
        balance_due: 33,
        balance: 99,
        grand_total: 1000,
        amount_paid: 900,
      }),
    ).toBe(33);
  });

  it("falls back to the stored balance when balance_due is missing", () => {
    expect(
      financeBalanceDue({
        balance: 44,
        grand_total: 1000,
        amount_paid: 900,
      }),
    ).toBe(44);
  });

  it("accepts numeric-string stored balances, including zero", () => {
    expect(financeBalanceDue({ balance_due: "0" })).toBe(0);
    expect(financeBalanceDue({ balance_due: "12.5" })).toBe(12.5);
  });

  it("computes total - paid when no stored balance is provided", () => {
    expect(
      financeBalanceDue({ grand_total: 1000, amount_paid: 250 }),
    ).toBe(750);
    expect(financeBalanceDue({ total: 500, paid_amount: 200 })).toBe(300);
  });

  it("never returns a negative balance", () => {
    expect(
      financeBalanceDue({ grand_total: 100, amount_paid: 250 }),
    ).toBe(0);
  });

  it("treats empty-string stored balance as unset and computes from total/paid", () => {
    expect(
      financeBalanceDue({
        balance_due: "",
        grand_total: 500,
        amount_paid: 100,
      }),
    ).toBe(400);
  });

  it("returns 0 for null/undefined/empty rows", () => {
    expect(financeBalanceDue(null)).toBe(0);
    expect(financeBalanceDue(undefined)).toBe(0);
    expect(financeBalanceDue({})).toBe(0);
  });
});
