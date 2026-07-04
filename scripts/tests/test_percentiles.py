"""Validation of p50/p95/p99 for the error_kind × status_class breakdown.

Runs standalone (no pytest dependency):

    python3 scripts/tests/test_percentiles.py

Checks:
  1. `_percentile` matches a reference nearest-rank implementation on
     hand-computed samples covering the edge cases (empty, single value,
     even/odd length, duplicates, unsorted -> sorted contract).
  2. `_build_breakdown_rows` groups by (error_kind, status_class) and
     produces the same p50/p95/p99 the reference computes bucket-by-bucket
     against a synthetic dataset with known distributions.
  3. `_build_breakdown_rows` on empty input returns no rows and never
     divides by zero.
"""
from __future__ import annotations
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from preflight_solutions_seo import _percentile, _build_breakdown_rows  # noqa: E402


# --- Reference implementation --------------------------------------------------

def ref_nearest_rank(values: list[float], pct: float) -> float:
    """Reference nearest-rank percentile — mirrors the script's contract.

    Uses the same rank formula (`round(pct/100 * (N-1))`) so any drift in
    the production helper surfaces as a diff against this function, not
    against a different percentile *definition*.
    """
    if not values:
        return 0.0
    s = sorted(values)
    if len(s) == 1:
        return s[0]
    k = max(0, min(len(s) - 1, int(round((pct / 100.0) * (len(s) - 1)))))
    return s[k]


def approx(a: float, b: float, tol: float = 1e-6) -> bool:
    return math.isclose(a, b, rel_tol=tol, abs_tol=tol)


# --- Test cases ---------------------------------------------------------------

def test_percentile_known_samples() -> None:
    cases: list[tuple[list[float], float, float]] = [
        # (values, pct, expected)
        ([], 50, 0.0),
        ([42.0], 99, 42.0),
        ([10, 20, 30, 40, 50], 50, 30.0),   # exact middle
        ([10, 20, 30, 40, 50], 95, 50.0),   # top nearest-rank
        ([10, 20, 30, 40, 50], 99, 50.0),
        # 100 evenly spaced values 1..100: nearest-rank -> p50=50, p95=95, p99=99
        # 100 evenly spaced values 1..100 with the (N-1)*p rounding used by
        # the helper: p50 -> round(49.5)=50 -> values[50]=51; p95 and p99
        # land on 95 and 99 respectively.
        (list(range(1, 101)), 50, 51.0),
        (list(range(1, 101)), 95, 95.0),
        (list(range(1, 101)), 99, 99.0),

        # duplicates: p50 must be one of the observed samples
        ([1, 1, 1, 1, 100], 50, 1.0),
        ([1, 1, 1, 1, 100], 95, 100.0),
        # unsorted input (should be pre-sorted by caller — verify contract)
        (sorted([5, 3, 8, 1, 9, 2]), 50, 3.0),
    ]
    for values, pct, expected in cases:
        got = _percentile(sorted(values), pct)
        ref = ref_nearest_rank(values, pct)
        assert approx(got, expected), f"expected p{pct}({values})={expected}, got {got}"
        assert approx(got, ref), f"drift from reference for p{pct}({values}): {got} vs {ref}"
    print(f"  ok  _percentile — {len(cases)} known-sample cases")


def test_breakdown_percentiles_against_reference() -> None:
    # Synthetic dataset with three known distributions:
    #   ok/2xx      : 1..100 ms
    #   http/5xx    : 500, 500, 500, 1000, 5000
    #   timeout/none: 30000 repeated 4x  (all identical)
    results: list[dict] = []
    for ms in range(1, 101):
        results.append({"ok": True, "ms": ms, "status": 200,
                        "error_kind": "ok", "status_class": "2xx", "attempts": 1})
    for ms in [500, 500, 500, 1000, 5000]:
        results.append({"ok": False, "ms": ms, "status": 503,
                        "error_kind": "http", "status_class": "5xx", "attempts": 2})
    for _ in range(4):
        results.append({"ok": False, "ms": 30000, "status": None,
                        "error_kind": "timeout", "status_class": "none",
                        "attempts": 1})

    rows = {(r["error_kind"], r["status_class"]): r
            for r in _build_breakdown_rows(results)}

    expected = {
        ("ok", "2xx"):        {"count": 100, "failed": 0,
                                "p50": 51.0, "p95": 95.0, "p99": 99.0},

        ("http", "5xx"):      {"count": 5,   "failed": 5,
                                "p50": 500.0, "p95": 5000.0, "p99": 5000.0},
        ("timeout", "none"):  {"count": 4,   "failed": 4,
                                "p50": 30000.0, "p95": 30000.0, "p99": 30000.0},
    }
    for key, exp in expected.items():
        assert key in rows, f"missing breakdown row for {key}"
        row = rows[key]
        assert row["count"] == exp["count"], f"{key}: count {row['count']} != {exp['count']}"
        assert row["failed"] == exp["failed"], f"{key}: failed {row['failed']} != {exp['failed']}"
        for pct_key, pct in (("p50", 50), ("p95", 95), ("p99", 99)):
            got = row[f"ms_{pct_key}"]
            ref = round(ref_nearest_rank(
                [r["ms"] for r in results
                 if r["error_kind"] == key[0] and r["status_class"] == key[1]],
                pct), 1)
            assert approx(got, exp[pct_key]), (
                f"{key} {pct_key}: expected {exp[pct_key]}, got {got}")
            assert approx(got, ref), (
                f"{key} {pct_key}: drift from reference — {got} vs {ref}")
    print(f"  ok  _build_breakdown_rows — {len(expected)} bucket(s), "
          f"p50/p95/p99 match reference & hand-computed values")


def test_breakdown_empty_input() -> None:
    rows = _build_breakdown_rows([])
    assert rows == [], f"expected [] for empty input, got {rows!r}"
    print("  ok  _build_breakdown_rows — empty input returns [] without ZeroDivisionError")


def test_percentile_monotonic() -> None:
    # For any dataset, p50 <= p95 <= p99 (nearest-rank preserves ordering).
    import random
    random.seed(0)
    for _ in range(50):
        n = random.randint(1, 200)
        values = sorted(random.uniform(0, 60000) for _ in range(n))
        p50 = _percentile(values, 50)
        p95 = _percentile(values, 95)
        p99 = _percentile(values, 99)
        assert p50 <= p95 <= p99, f"non-monotonic: p50={p50} p95={p95} p99={p99}"
    print("  ok  _percentile — monotonic p50 <= p95 <= p99 over 50 random samples")


def main() -> int:
    tests = [
        test_percentile_known_samples,
        test_breakdown_percentiles_against_reference,
        test_breakdown_empty_input,
        test_percentile_monotonic,
    ]
    print(f"Running {len(tests)} percentile validation test(s):")
    failed = 0
    for t in tests:
        try:
            t()
        except AssertionError as e:
            failed += 1
            print(f"  FAIL {t.__name__}: {e}")
        except Exception as e:  # pragma: no cover — surfaces import/runtime bugs
            failed += 1
            print(f"  ERROR {t.__name__}: {type(e).__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
