"""
RLS role-matrix integration test.

For each app role (super_admin, management, sales, operations, finance,
read_only), sign in via Supabase Auth REST, then attempt SELECT + write
operations against a fixed set of protected tables through PostgREST.
Assert that:

  * every role gets SELECT on the protected reference tables it should
    see (all six roles read customers/suppliers/products);
  * unauthorized writes are blocked (HTTP 401/403 or empty-array from
    PostgREST when RLS filters the row).

Test users are NOT auto-created. Seed one auth user per role and export
their credentials as env vars:

  RLS_SUPER_ADMIN_EMAIL / RLS_SUPER_ADMIN_PASSWORD
  RLS_MANAGEMENT_EMAIL  / RLS_MANAGEMENT_PASSWORD
  RLS_SALES_EMAIL       / RLS_SALES_PASSWORD
  RLS_OPERATIONS_EMAIL  / RLS_OPERATIONS_PASSWORD
  RLS_FINANCE_EMAIL     / RLS_FINANCE_PASSWORD
  RLS_READ_ONLY_EMAIL   / RLS_READ_ONLY_PASSWORD

Also required:
  VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (already in .env).

Usage:
  python3 scripts/e2e/rls-role-matrix.py

Exit code 0 = matrix matches expectations, 1 = at least one violation.
"""
from __future__ import annotations

import json
import os
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
if ENV_FILE.exists():
    for raw in ENV_FILE.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"].rstrip("/")
ANON_KEY = os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"]

ROLES = [
    "super_admin",
    "management",
    "sales",
    "operations",
    "finance",
    "read_only",
]

# Roles that should be allowed to write each table (INSERT/UPDATE/DELETE).
# Mirrors the RLS policies verified against pg_policies.
WRITE_MATRIX: dict[str, set[str]] = {
    "customers": {"super_admin", "management", "sales", "operations"},
    "suppliers": {"super_admin", "management", "operations"},
    "products":  {"super_admin", "management", "operations"},
}
# All six staff roles read these tables.
READ_TABLES = list(WRITE_MATRIX.keys())


@dataclass
class Session:
    role: str
    email: str
    token: str


def sign_in(role: str) -> Session | None:
    email = os.environ.get(f"RLS_{role.upper()}_EMAIL")
    password = os.environ.get(f"RLS_{role.upper()}_PASSWORD")
    if not email or not password:
        print(f"[skip] {role}: RLS_{role.upper()}_EMAIL/PASSWORD not set")
        return None
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    if r.status_code != 200:
        print(f"[fail] sign-in {role}: {r.status_code} {r.text[:200]}")
        return None
    return Session(role=role, email=email, token=r.json()["access_token"])


def rest(session: Session, method: str, path: str, **kw) -> requests.Response:
    headers = kw.pop("headers", {})
    headers.update({
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {session.token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    })
    return requests.request(
        method, f"{SUPABASE_URL}/rest/v1{path}",
        headers=headers, timeout=15, **kw,
    )


def write_ok(resp: requests.Response) -> bool:
    """True if the write actually persisted a row."""
    if resp.status_code not in (200, 201):
        return False
    try:
        body = resp.json()
    except Exception:
        return False
    return isinstance(body, list) and len(body) > 0


def probe_write(session: Session, table: str) -> tuple[bool, str]:
    """Attempt an insert; if it succeeds, delete it. Returns (wrote?, detail)."""
    marker = f"__rls_probe_{session.role}_{uuid.uuid4().hex[:8]}"
    if table == "customers":
        payload: dict[str, Any] = {"company_name": marker, "is_active": True}
    elif table == "suppliers":
        payload = {"name": marker, "is_active": True}
    else:
        payload = {"name": marker, "hs_code": "0000.00", "is_active": True}

    resp = rest(session, "POST", f"/{table}", data=json.dumps(payload))
    if not write_ok(resp):
        return False, f"HTTP {resp.status_code} {resp.text[:120]}"

    inserted_id = resp.json()[0]["id"]
    # cleanup — best effort
    rest(session, "DELETE", f"/{table}?id=eq.{inserted_id}")
    return True, "insert accepted"


def probe_read(session: Session, table: str) -> tuple[bool, str]:
    resp = rest(session, "GET", f"/{table}?select=id&limit=1")
    return resp.status_code == 200, f"HTTP {resp.status_code}"


def main() -> int:
    sessions: list[Session] = []
    for role in ROLES:
        s = sign_in(role)
        if s:
            sessions.append(s)

    if not sessions:
        print("no sessions signed in — seed test users first")
        return 1

    print("\nRole                READ (c/s/p)   WRITE (c/s/p)")
    print("-" * 60)

    violations: list[str] = []
    for s in sessions:
        row = [f"{s.role:<18}"]
        # reads
        read_marks: list[str] = []
        for t in READ_TABLES:
            ok, why = probe_read(s, t)
            read_marks.append("R" if ok else "-")
            if not ok:
                violations.append(f"{s.role} cannot read {t} ({why})")
        row.append("  " + "".join(read_marks).ljust(13))
        # writes
        write_marks: list[str] = []
        for t in READ_TABLES:
            expected = s.role in WRITE_MATRIX[t]
            wrote, why = probe_write(s, t)
            if wrote and not expected:
                write_marks.append("!")  # RLS breach
                violations.append(f"{s.role} WROTE {t} but should be blocked ({why})")
            elif not wrote and expected:
                write_marks.append("x")  # unexpected block
                violations.append(f"{s.role} blocked from writing {t} ({why})")
            else:
                write_marks.append("W" if wrote else ".")
        row.append("   " + "".join(write_marks))
        print("".join(row))

    print("\nLegend: R=read ok  W=write ok  .=write correctly blocked"
          "  !=RLS BREACH  x=expected write blocked  -=read failed")

    if violations:
        print("\nFAIL:")
        for v in violations:
            print(f"  - {v}")
        return 1
    print("\nPASS: RLS matrix matches expectations")
    return 0


if __name__ == "__main__":
    sys.exit(main())
