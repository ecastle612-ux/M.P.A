#!/usr/bin/env python3
"""BUG-011.1 — apply approved COM-002 Production migrations only.

Uses SUPABASE_DB_URL. Does not modify migration files or invent SQL DDL.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("FAIL: psycopg2 not installed", file=sys.stderr)
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = [
    ROOT / "supabase/migrations/20260806010000_phase1_commercial_subscriptions.sql",
    ROOT / "supabase/migrations/20260808010000_com_002_slice_c_saas_checkout.sql",
    ROOT / "supabase/migrations/20260808020000_com_002_slice_d_provisioning.sql",
    ROOT / "supabase/migrations/20260808030000_com_002_slice_e_lifecycle.sql",
]

REQUIRED_TABLES = [
    "product_skus",
    "organization_subscriptions",
    "organization_setup_state",
    "platform_operators",
    "saas_checkout_sessions",
    "saas_stripe_webhook_events",
    "provisioning_jobs",
    "saas_customers",
    "saas_lifecycle_events",
]


def connect():
    url = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
    if not url:
        print("FAIL: SUPABASE_DB_URL not set", file=sys.stderr)
        sys.exit(2)
    return psycopg2.connect(url)


def fetchall(cur, sql: str, params=None):
    cur.execute(sql, params or ())
    return cur.fetchall()


def verify_after(cur, label: str) -> None:
    print(f"\n=== verify after {label} ===")
    tables = {
        r["tablename"]
        for r in fetchall(
            cur,
            """
            select tablename from pg_tables
            where schemaname = 'public'
              and tablename = any(%s)
            """,
            (REQUIRED_TABLES,),
        )
    }
    for t in REQUIRED_TABLES:
        print(f"  table {t}: {'PRESENT' if t in tables else 'absent'}")

    indexes = fetchall(
        cur,
        """
        select indexname from pg_indexes
        where schemaname = 'public'
          and (
            indexname like 'saas_%'
            or indexname like 'organization_subscriptions%'
            or indexname like 'provisioning_%'
            or indexname like 'product_skus%'
          )
        order by indexname
        """,
    )
    print("  indexes:")
    for row in indexes:
        print(f"    - {row['indexname']}")

    constraints = fetchall(
        cur,
        """
        select c.conname, rel.relname as table_name
        from pg_constraint c
        join pg_class rel on rel.oid = c.conrelid
        join pg_namespace n on n.oid = rel.relnamespace
        where n.nspname = 'public'
          and rel.relname = any(%s)
        order by rel.relname, c.conname
        """,
        (REQUIRED_TABLES,),
    )
    print("  constraints:")
    for row in constraints:
        print(f"    - {row['table_name']}.{row['conname']}")

    policies = fetchall(
        cur,
        """
        select tablename, policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = any(%s)
        order by tablename, policyname
        """,
        (REQUIRED_TABLES,),
    )
    print("  rls policies:")
    for row in policies:
        print(f"    - {row['tablename']}.{row['policyname']}")

    rls = fetchall(
        cur,
        """
        select c.relname, c.relrowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = any(%s)
        order by c.relname
        """,
        (REQUIRED_TABLES,),
    )
    print("  rls enabled:")
    for row in rls:
        print(f"    - {row['relname']}: {bool(row['relrowsecurity'])}")

    functions = fetchall(
        cur,
        """
        select p.proname
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('is_platform_operator', 'set_updated_at')
        order by p.proname
        """,
    )
    print("  functions:")
    for row in functions:
        print(f"    - {row['proname']}")

    triggers = fetchall(
        cur,
        """
        select tgname, rel.relname as table_name
        from pg_trigger t
        join pg_class rel on rel.oid = t.tgrelid
        join pg_namespace n on n.oid = rel.relnamespace
        where n.nspname = 'public'
          and not t.tgisinternal
          and rel.relname = any(%s)
        order by rel.relname, tgname
        """,
        (REQUIRED_TABLES,),
    )
    print("  triggers:")
    for row in triggers:
        print(f"    - {row['table_name']}.{row['tgname']}")


def final_audit(cur) -> bool:
    print("\n=== FINAL SCHEMA AUDIT ===")
    present = {
        r["tablename"]
        for r in fetchall(
            cur,
            """
            select tablename from pg_tables
            where schemaname = 'public'
              and tablename = any(%s)
            """,
            (REQUIRED_TABLES,),
        )
    }
    ok = True
    for t in REQUIRED_TABLES:
        status = "PASS" if t in present else "FAIL"
        if status == "FAIL":
            ok = False
        print(f"  {status} {t}")

    # schema version markers if available
    for marker_sql, label in [
        (
            "select version_num from supabase_migrations.schema_migrations order by version_num",
            "supabase_migrations.schema_migrations",
        ),
        (
            "select version from schema_migrations order by version",
            "public.schema_migrations",
        ),
    ]:
        try:
            rows = fetchall(cur, marker_sql)
            print(f"  {label}: {[list(r.values())[0] for r in rows]}")
        except Exception as exc:
            cur.connection.rollback()
            print(f"  {label}: unavailable ({exc.__class__.__name__})")
    return ok


def main() -> int:
    for path in MIGRATIONS:
        if not path.is_file():
            print(f"FAIL: missing migration file {path}", file=sys.stderr)
            return 2

    conn = connect()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)
    applied: list[str] = []

    try:
        for path in MIGRATIONS:
            sql = path.read_text(encoding="utf-8")
            print(f"\n=== APPLY {path.name} ===")
            try:
                cur.execute(sql)
                print(f"OK applied {path.name}")
                applied.append(path.name)
            except Exception as exc:
                print(f"FAIL applying {path.name}: {exc}", file=sys.stderr)
                print("Applied so far:", applied)
                return 1
            verify_after(cur, path.name)

        ok = final_audit(cur)
        print("\nApplied migrations:")
        for name in applied:
            print(f"  - {name}")
        return 0 if ok else 1
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
