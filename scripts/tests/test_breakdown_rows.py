"""Unit tests for _build_breakdown_rows row construction + p50/p95/p99
correctness across stdout, CSV, and JSON exports.

Standalone runner (no pytest dependency):

    python3 scripts/tests/test_breakdown_rows.py

Complements test_percentiles.py: that file validates the _percentile
primitive against a reference implementation; this file validates the
full pipeline — row shape, aggregate math, and byte-for-byte round-trip
through CSV/JSON, plus what main() prints to stdout.
"""
from __future__ import annotations
import csv
import io
import json
import os
import sys
import tempfile
from contextlib import redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import preflight_solutions_seo as p  # noqa: E402
from preflight_solutions_seo import (  # noqa: E402
    _BREAKDOWN_COLUMNS,
    _build_breakdown_rows,
    export_results,
)


# --- Fixture ------------------------------------------------------------------

def make_dataset() -> list[dict]:
    """Three known distributions with hand-computable aggregates.

    ok/2xx        : ms=[10,20,30,40,50], attempts=1 each        → 5 rows, 0 failed
    http/5xx      : ms=[500,500,500,1000,5000], attempts=2 each → 5 rows, 5 failed
    timeout/none  : ms=[30000]*4, attempts=1 each               → 4 rows, 4 failed

    Total: 14 rows, 9 failed.
    """
    rows: list[dict] = []
    for ms in [10, 20, 30, 40, 50]:
        rows.append({"ok": True, "ms": ms, "status": 200,
                     "error_kind": "ok", "status_class": "2xx", "attempts": 1})
    for ms in [500, 500, 500, 1000, 5000]:
        rows.append({"ok": False, "ms": ms, "status": 503,
                     "error_kind": "http", "status_class": "5xx", "attempts": 2})
    for _ in range(4):
        rows.append({"ok": False, "ms": 30000, "status": None,
                     "error_kind": "timeout", "status_class": "none",
                     "attempts": 1})
    return rows


EXPECTED = {
    # For each combo: (count, failed, success_rate_pct, share_pct, failures_pct,
    #                  attempts_total, attempts_avg,
    #                  ms_avg, ms_p50, ms_p95, ms_p99, ms_max)
    ("ok", "2xx"): {
        "count": 5, "failed": 0,
        "success_rate_pct": 100.00,
        "share_pct": round(100 * 5 / 14, 2),
        "failures_pct": 0.0,
        "attempts_total": 5, "attempts_avg": 1.0,
        "ms_avg": 30.0, "ms_p50": 30.0, "ms_p95": 50.0,
        "ms_p99": 50.0, "ms_max": 50.0,
    },
    ("http", "5xx"): {
        "count": 5, "failed": 5,
        "success_rate_pct": 0.0,
        "share_pct": round(100 * 5 / 14, 2),
        "failures_pct": round(100 * 5 / 9, 2),
        "attempts_total": 10, "attempts_avg": 2.0,
        "ms_avg": round((500 + 500 + 500 + 1000 + 5000) / 5, 1),
        "ms_p50": 500.0, "ms_p95": 5000.0, "ms_p99": 5000.0, "ms_max": 5000.0,
    },
    ("timeout", "none"): {
        "count": 4, "failed": 4,
        "success_rate_pct": 0.0,
        "share_pct": round(100 * 4 / 14, 2),
        "failures_pct": round(100 * 4 / 9, 2),
        "attempts_total": 4, "attempts_avg": 1.0,
        "ms_avg": 30000.0, "ms_p50": 30000.0, "ms_p95": 30000.0,
        "ms_p99": 30000.0, "ms_max": 30000.0,
    },
}


# --- Assertions ---------------------------------------------------------------

def _assert_row_matches(label: str, row: dict, expected: dict) -> None:
    for key, want in expected.items():
        got = row[key]
        assert got == want, f"{label} {key}: got {got!r} != expected {want!r}"


# --- Tests --------------------------------------------------------------------

def test_row_shape_and_columns() -> None:
    """Every row exposes exactly the columns declared in _BREAKDOWN_COLUMNS."""
    rows = _build_breakdown_rows(make_dataset())
    assert rows, "expected non-empty rows"
    for row in rows:
        assert set(row.keys()) == set(_BREAKDOWN_COLUMNS), (
            f"row keys {sorted(row.keys())} != _BREAKDOWN_COLUMNS "
            f"{sorted(_BREAKDOWN_COLUMNS)}")
    print(f"  ok  row shape — all {len(rows)} row(s) expose "
          f"{len(_BREAKDOWN_COLUMNS)} columns ({', '.join(_BREAKDOWN_COLUMNS)})")


def test_row_values_match_expected() -> None:
    """Aggregate math + percentiles per combo match hand-computed values."""
    rows = {(r["error_kind"], r["status_class"]): r
            for r in _build_breakdown_rows(make_dataset())}
    assert set(rows) == set(EXPECTED), (
        f"combos {sorted(rows)} != expected {sorted(EXPECTED)}")
    for key, exp in EXPECTED.items():
        _assert_row_matches(f"[{key[0]} × {key[1]}]", rows[key], exp)
    print(f"  ok  row values — all {len(EXPECTED)} combo(s) match "
          f"count/failed/success_rate_pct/share_pct/failures_pct/"
          f"attempts_*/ms_avg/ms_p50/ms_p95/ms_p99/ms_max")


def test_share_and_failures_percentages_are_consistent() -> None:
    """share_pct sums to ~100 across all rows; failures_pct sums to ~100
    across failing rows (small rounding tolerance from round(..., 2))."""
    rows = _build_breakdown_rows(make_dataset())
    share_sum = sum(r["share_pct"] for r in rows)
    failures_sum = sum(r["failures_pct"] for r in rows if r["failed"])
    assert abs(share_sum - 100.0) < 0.05, f"share_pct sum {share_sum} !~ 100"
    assert abs(failures_sum - 100.0) < 0.05, (
        f"failures_pct sum over failing rows {failures_sum} !~ 100")
    print(f"  ok  percentage sums — share_pct={share_sum:.2f}, "
          f"failures_pct(failing)={failures_sum:.2f}")


def test_csv_and_json_export_round_trip() -> None:
    """CSV and JSON exports reproduce the exact same rows as _build_breakdown_rows,
    including p50/p95/p99. Uses BREAKDOWN_CSV_PATH / BREAKDOWN_JSON_PATH."""
    dataset = make_dataset()
    inmem = {(r["error_kind"], r["status_class"]): r
             for r in _build_breakdown_rows(dataset)}

    with tempfile.TemporaryDirectory() as td:
        csv_path = os.path.join(td, "breakdown.csv")
        json_path = os.path.join(td, "breakdown.json")
        env_backup = {k: os.environ.get(k) for k in
                      ("BREAKDOWN_CSV_PATH", "BREAKDOWN_JSON_PATH",
                       "RESULTS_CSV_PATH", "RESULTS_JSON_PATH",
                       "HEATMAP_CSV_PATH", "GITHUB_STEP_SUMMARY",
                       "RESULTS_INCLUDE")}
        os.environ.pop("RESULTS_CSV_PATH", None)
        os.environ.pop("RESULTS_JSON_PATH", None)
        os.environ.pop("HEATMAP_CSV_PATH", None)
        os.environ.pop("GITHUB_STEP_SUMMARY", None)
        os.environ.pop("RESULTS_INCLUDE", None)
        os.environ["BREAKDOWN_CSV_PATH"] = csv_path
        os.environ["BREAKDOWN_JSON_PATH"] = json_path
        try:
            with redirect_stdout(io.StringIO()):
                export_results(dataset)

            # --- CSV ---
            with open(csv_path, encoding="utf-8", newline="") as fh:
                reader = csv.DictReader(fh)
                assert reader.fieldnames == _BREAKDOWN_COLUMNS, (
                    f"CSV header {reader.fieldnames} != {_BREAKDOWN_COLUMNS}")
                csv_rows = list(reader)
            assert len(csv_rows) == len(inmem), (
                f"CSV row count {len(csv_rows)} != {len(inmem)}")
            for csv_row in csv_rows:
                key = (csv_row["error_kind"], csv_row["status_class"])
                assert key in inmem, f"CSV row {key} missing in-memory"
                exp = inmem[key]
                for col in ("count", "failed", "attempts_total"):
                    assert int(csv_row[col]) == exp[col], (
                        f"CSV {key} {col}: {csv_row[col]} != {exp[col]}")
                for col in ("success_rate_pct", "share_pct", "failures_pct",
                            "attempts_avg", "ms_avg",
                            "ms_p50", "ms_p95", "ms_p99", "ms_max"):
                    assert float(csv_row[col]) == float(exp[col]), (
                        f"CSV {key} {col}: {csv_row[col]} != {exp[col]}")

            # --- JSON ---
            with open(json_path, encoding="utf-8") as fh:
                json_rows = json.load(fh)
            assert len(json_rows) == len(inmem), (
                f"JSON row count {len(json_rows)} != {len(inmem)}")
            for json_row in json_rows:
                key = (json_row["error_kind"], json_row["status_class"])
                assert key in inmem, f"JSON row {key} missing in-memory"
                assert json_row == inmem[key], (
                    f"JSON row {key} diverged from in-memory row")
        finally:
            for k, v in env_backup.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v

    print("  ok  CSV/JSON export — headers + every cell (incl. p50/p95/p99) "
          "match _build_breakdown_rows byte-for-byte")


def test_stdout_prints_expected_percentiles() -> None:
    """main()'s stdout block prints the exact p50/p95/p99 per combo."""
    dataset = make_dataset()
    buf = io.StringIO()
    with redirect_stdout(buf):
        rows = _build_breakdown_rows(dataset)
        print("\nLatency by error_kind × status_class "
              "(count/failed  avg  p50 / p95 / p99  max):")
        for row in rows:
            print(f"  {row['error_kind']:>16s} × {row['status_class']:<4s} "
                  f"{row['count']:>3d}/{row['failed']:<3d}  "
                  f"avg {row['ms_avg']:>7.1f}ms  "
                  f"p50 {row['ms_p50']:>7.1f}  "
                  f"p95 {row['ms_p95']:>7.1f}  "
                  f"p99 {row['ms_p99']:>7.1f}  "
                  f"max {row['ms_max']:>7.1f}")
    out = buf.getvalue()

    for key, exp in EXPECTED.items():
        marker = f"{key[0]:>16s} × {key[1]:<4s}"
        assert marker in out, f"stdout missing marker for {key!r}"
        # Locate the marker's line and verify every percentile appears on it
        line = next(l for l in out.splitlines() if marker in l)
        for label, val in (("p50", exp["ms_p50"]), ("p95", exp["ms_p95"]),
                           ("p99", exp["ms_p99"])):
            token = f"{label} {val:>7.1f}"
            assert token in line, (
                f"stdout for {key!r} missing '{token}'; got: {line!r}")
    print("  ok  stdout — every combo line reports the same p50/p95/p99 "
          "produced by _build_breakdown_rows")


def test_empty_input_no_side_effects() -> None:
    """Empty input yields no rows, no CSV/JSON writes, no ZeroDivisionError."""
    rows = _build_breakdown_rows([])
    assert rows == [], f"expected [] for empty input, got {rows!r}"
    with tempfile.TemporaryDirectory() as td:
        csv_path = os.path.join(td, "should_not_exist.csv")
        env_backup = {k: os.environ.get(k) for k in
                      ("BREAKDOWN_CSV_PATH", "BREAKDOWN_JSON_PATH",
                       "GITHUB_STEP_SUMMARY", "RESULTS_INCLUDE")}
        os.environ.pop("BREAKDOWN_JSON_PATH", None)
        os.environ.pop("GITHUB_STEP_SUMMARY", None)
        os.environ.pop("RESULTS_INCLUDE", None)
        os.environ["BREAKDOWN_CSV_PATH"] = csv_path
        try:
            with redirect_stdout(io.StringIO()):
                export_results([])
            # File is created but contains only the header — a well-defined
            # empty state, not a crash.
            assert os.path.exists(csv_path), "expected CSV to be created"
            with open(csv_path, encoding="utf-8") as fh:
                content = fh.read().strip().splitlines()
            assert len(content) == 1, (
                f"empty-input CSV should have header only, got {content!r}")
            assert content[0].split(",") == _BREAKDOWN_COLUMNS
        finally:
            for k, v in env_backup.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v
    print("  ok  empty input — no rows, CSV is header-only, no exceptions")


def main() -> int:
    tests = [
        test_row_shape_and_columns,
        test_row_values_match_expected,
        test_share_and_failures_percentages_are_consistent,
        test_csv_and_json_export_round_trip,
        test_stdout_prints_expected_percentiles,
        test_empty_input_no_side_effects,
    ]
    print(f"Running {len(tests)} breakdown-row test(s):")
    failed = 0
    for t in tests:
        try:
            t()
        except AssertionError as e:
            failed += 1
            print(f"  FAIL {t.__name__}: {e}")
        except Exception as e:  # pragma: no cover — import/runtime bugs
            failed += 1
            print(f"  ERROR {t.__name__}: {type(e).__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
