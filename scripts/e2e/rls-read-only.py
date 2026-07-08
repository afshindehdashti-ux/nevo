"""
Read-only role RLS lockdown test.

Signs in as the read_only user and confirms that:

  * SELECT succeeds on customers / suppliers / products;
  * INSERT is rejected;
  * UPDATE against any existing row is rejected (0 rows affected);
  * DELETE against any existing row is rejected (0 rows affected).

Setup:
  Seed a user with exactly the `read_only` role via /admin/users, then:

    export RLS_READ_ONLY_EMAIL=readonly@nevo.test
    export RLS_READ_ONLY_PASSWORD='...'

  VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are auto-loaded
  from .env.

Run:
  python3 scripts/e2e/rls-read-only.py

Exit code 0 = all writes correctly blocked, 1 = at least one leak.
"""
from __future__ import annotations

import json
import os
import sys
import uuid
from pathlib import Path

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
TABLES = ["customers", "suppliers", "products"]


def sign_in() -> str:
    email = os.environ.get("RLS_READ_ONLY_EMAIL")
    password = os.environ.get("RLS_READ_ONLY_PASSWORD")
    if not email or not password:
        sys.exit("RLS_READ_ONLY_EMAIL and RLS_READ_ONLY_PASSWORD must be set")
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    if r.status_code != 200:
        sys.exit(f"sign-in failed: {r.status_code} {r.text[:200]}")
    return r.json()["access_token"]


def rest(token: str, method: str, path: str, **kw) -> requests.Response:
    headers = kw.pop("headers", {})
    headers.update({
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    })
    return requests.request(
        method, f"{SUPABASE_URL}/rest/v1{path}",
        headers=headers, timeout=15, **kw,
    )


def payload_for(table: str, marker: str) -> dict:
    if table == "customers":
        return {"company_name": marker, "is_active": True}
    if table == "suppliers":
        return {"name": marker, "is_active": True}
    return {"name": marker, "hs_code": "0000.00", "is_active": True}


def check_read(token: str, table: str) -> tuple[bool, str]:
    r = rest(token, "GET", f"/{table}?select=id&limit=1")
    if r.status_code != 200:
        return False, f"SELECT {table} -> HTTP {r.status_code}"
    return True, f"SELECT {table} -> ok ({len(r.json())} row visible)"


def check_insert_blocked(token: str, table: str) -> tuple[bool, str]:
    marker = f"__ro_probe_{uuid.uuid4().hex[:8]}"
    r = rest(token, "POST", f"/{table}", data=json.dumps(payload_for(table, marker)))
    if r.status_code in (401, 403):
        return True, f"INSERT {table} -> blocked ({r.status_code})"
    if r.status_code in (200, 201) and isinstance(r.json(), list) and r.json():
        # cleanup and flag breach
        new_id = r.json()[0]["id"]
        rest(token, "DELETE", f"/{table}?id=eq.{new_id}")
        return False, f"INSERT {table} -> LEAK (row created: {new_id})"
    return True, f"INSERT {table} -> blocked (HTTP {r.status_code})"


def pick_existing_id(token: str, table: str) -> str | None:
    r = rest(token, "GET", f"/{table}?select=id&limit=1")
    if r.status_code == 200 and r.json():
        return r.json()[0]["id"]
    return None


def check_update_blocked(token: str, table: str) -> tuple[bool, str]:
    row_id = pick_existing_id(token, table)
    if not row_id:
        return True, f"UPDATE {table} -> skipped (no rows to target)"
    # A no-op-ish field change: bump is_active to itself + flag. If RLS
    # blocks, PostgREST returns [] with 200, or 401/403.
    body = {"is_active": True}
    r = rest(token, "PATCH", f"/{table}?id=eq.{row_id}",
             data=json.dumps(body))
    if r.status_code in (401, 403):
        return True, f"UPDATE {table} -> blocked ({r.status_code})"
    if r.status_code == 200:
        try:
            affected = len(r.json()) if isinstance(r.json(), list) else 0
        except Exception:
            affected = 0
        if affected == 0:
            return True, f"UPDATE {table} -> blocked (0 rows affected)"
        return False, f"UPDATE {table} -> LEAK ({affected} rows updated on id={row_id})"
    return True, f"UPDATE {table} -> blocked (HTTP {r.status_code})"


def check_delete_blocked(token: str, table: str) -> tuple[bool, str]:
    row_id = pick_existing_id(token, table)
    if not row_id:
        return True, f"DELETE {table} -> skipped (no rows to target)"
    r = rest(token, "DELETE", f"/{table}?id=eq.{row_id}")
    if r.status_code in (401, 403):
        return True, f"DELETE {table} -> blocked ({r.status_code})"
    if r.status_code == 200:
        try:
            affected = len(r.json()) if isinstance(r.json(), list) else 0
        except Exception:
            affected = 0
        if affected == 0:
            return True, f"DELETE {table} -> blocked (0 rows affected)"
        return False, f"DELETE {table} -> LEAK ({affected} rows deleted, id={row_id})"
    return True, f"DELETE {table} -> blocked (HTTP {r.status_code})"


def main() -> int:
    token = sign_in()
    print(f"signed in as read_only ({os.environ['RLS_READ_ONLY_EMAIL']})\n")

    checks = []
    for table in TABLES:
        checks.append(check_read(token, table))
        checks.append(check_insert_blocked(token, table))
        checks.append(check_update_blocked(token, table))
        checks.append(check_delete_blocked(token, table))

    failures = [msg for ok, msg in checks if not ok]
    for ok, msg in checks:
        print(f"  [{'PASS' if ok else 'FAIL'}] {msg}")

    if failures:
        print(f"\nFAIL: {len(failures)} RLS leak(s)")
        return 1
    print("\nPASS: read_only can read but cannot write customers/suppliers/products")
    return 0


if __name__ == "__main__":
    sys.exit(main())
