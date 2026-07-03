"""
Single source of truth for the Solutions SEO locale/path matrix.

Both `verify_solutions_seo.py` (full 60-page audit) and
`preflight_solutions_seo.py` (fast smoke test) import from here so their
diffs remain apples-to-apples: adding a locale or a Solutions path in one
place automatically feeds both.

Keep this module dependency-free (stdlib only) and side-effect-free.
"""
from __future__ import annotations

# All active site locales. Order matters for hreflang generation in the app
# — mirror it here so the audit reports pages in the same order the app
# publishes them.
LOCALES: list[str] = ["en", "ar", "tr", "ru", "pt", "de", "es", "fr", "it", "zh"]

# Every Solutions route the site publishes. The audit fans out to
# LOCALES × PATHS (currently 10 × 6 = 60 URLs).
PATHS: list[str] = [
    "/solutions",
    "/solutions/sandwich-panels",
    "/solutions/production-lines",
    "/solutions/raw-materials",
    "/solutions/factory-development",
    "/solutions/engineering-consultancy",
]

# Map each Solutions path → the route file that owns its head() / SEO
# helpers. Used for GitHub workflow-command annotations so a PR failure
# shows up inline on the file a developer can actually edit.
ROUTE_FILES: dict[str, str] = {
    "/solutions": "src/routes/$lang.solutions.index.tsx",
    "/solutions/sandwich-panels": "src/routes/$lang.solutions.sandwich-panels.tsx",
    "/solutions/production-lines": "src/routes/$lang.solutions.production-lines.tsx",
    "/solutions/raw-materials": "src/routes/$lang.solutions.raw-materials.tsx",
    "/solutions/factory-development": "src/routes/$lang.solutions.factory-development.tsx",
    "/solutions/engineering-consultancy": "src/routes/$lang.solutions.engineering-consultancy.tsx",
}


# Non-localized core paths the preflight smoke-tests before spending time
# on the per-locale matrix. Not part of the SEO audit itself.
CORE_PATHS: list[str] = ["/", "/sitemap.xml", "/robots.txt"]


def preflight_sample(
    locales: list[str] | None = None,
    paths: list[str] | None = None,
    max_locales: int = 3,
    max_paths: int = 1,
) -> list[tuple[str, str]]:
    """Return a small (locale, path) sample drawn from the shared matrix.

    Preflight only needs to prove the deploy is serving Solutions pages at
    all — not exercise every combination. Sampling from the shared LOCALES
    / PATHS lists guarantees any newly added locale or path is a valid
    preflight candidate on the next run.
    """
    ls = (locales or LOCALES)[:max_locales]
    ps = (paths or PATHS)[:max_paths]
    return [(l, p) for l in ls for p in ps]
