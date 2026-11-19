#!/usr/bin/env python3
"""Build docs/control-ledger.md from the crawler output (test-evidence/ledger/*.json).

Run after:
  E2E_PORT=3100 LEDGER_LABEL=after pnpm exec playwright test -c playwright.ledger.config.ts tests/ledger/ledger.spec.ts
  (optionally the same with LEDGER_LABEL=before against an older build on another port)
"""
import json
import os
from collections import Counter, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "test-evidence", "ledger")
OUT = os.path.join(ROOT, "docs", "control-ledger.md")


def load(label):
    p = os.path.join(SRC, f"ledger-{label}.json")
    if not os.path.exists(p):
        return None
    with open(p) as f:
        return json.load(f)


def key(r):
    return (r["who"], r["route"], r["tag"], r["name"], r.get("href") or "")


def effect_text(r):
    e = r.get("effect")
    if not e:
        if r["tag"] == "page":
            return r["name"]
        if r.get("inDialog"):
            return "inside a closed sheet (covered by the targeted tests)"
        if r.get("disabled"):
            return "disabled until its form is ready"
        if not r.get("visible"):
            return "not visible on this screen state"
        return "text field (filled by the targeted tests)"
    return f"{e['kind']}: {e['detail']}"


def esc(s):
    return (s or "").replace("|", "\\|").replace("\n", " ")


def main():
    after = load("after")
    before = load("before")
    if not after:
        raise SystemExit("no test-evidence/ledger/ledger-after.json: run the crawler first")
    prev = {key(r): r for r in (before or {}).get("rows", [])}
    rows = after["rows"]

    counts = Counter(r["status"] for r in rows)
    lines = [
        "# Control ledger",
        "",
        "Every control on every screen, for each kind of visitor, as found by the crawler in",
        "`tests/ledger/ledger.spec.ts` on the local stack (synthetic accounts only). Rebuild with",
        "`python3 scripts/ledger-report.py`.",
        "",
        f"- Crawled: {after['when']} (fixed build). Earlier build for comparison: {before['when'] if before else 'not run'}.",
        "- **pass**: the control did what it should (opened its screen, a sheet, sent its request, or changed what is shown).",
        "- **fail**: it did nothing visible, threw an error, could not be clicked, or sat under another element.",
        "- **check**: deliberately not clicked by the crawler (destructive, or an outside link); each is covered by a named test below.",
        "- **listed**: a text field, a disabled button, or a control inside a closed sheet; the targeted tests fill and use these.",
        "",
        f"Totals (fixed build): pass {counts.get('pass', 0)}, fail {counts.get('fail', 0)}, check {counts.get('check', 0)}, listed {counts.get('listed', 0)}.",
    ]
    if before:
        bc = Counter(r["status"] for r in before["rows"])
        lines.append(f"Totals (earlier build, same crawler): pass {bc.get('pass', 0)}, fail {bc.get('fail', 0)}, check {bc.get('check', 0)}, listed {bc.get('listed', 0)}.")
    if after.get("pageErrors"):
        lines += ["", "## Page errors", ""] + [f"- {e['who']} {e['route']}: {esc(e['error'])}" for e in after["pageErrors"]]

    changed = []
    for r in rows:
        p = prev.get(key(r))
        if p and p["status"] != r["status"]:
            changed.append((r, p))
    if changed:
        lines += ["", "## Changed since the earlier build", "", "| Visitor | Screen | Control | Before | After |", "|---|---|---|---|---|"]
        for r, p in changed:
            lines.append(f"| {r['who']} | `{r['route']}` | {esc(r['name'])} | {p['status']}: {esc(effect_text(p))} | {r['status']}: {esc(effect_text(r))} |")

    fails = [r for r in rows if r["status"] == "fail"]
    lines += ["", "## Still failing in the fixed build", ""]
    lines += [f"- {r['who']} `{r['route']}` {esc(r['name'])}: {esc(effect_text(r))}" for r in fails] or ["- None."]

    lines += [
        "",
        "## Controls the crawler does not click, and the test that covers each",
        "",
        "| Control | Covered by |",
        "|---|---|",
        "| Delete (an entry on a day) | `tests/e2e/core.spec.ts` \"log bloating ... see it in History and day detail\" |",
        "| Sign out | `tests/e2e/core.spec.ts` \"Q91 ... Q39 sign-out\" and `tests/hosted/preview.spec.ts` (session revoked) |",
        "| Delete account | `tests/e2e/navigation.spec.ts` \"Pro plan actions, the photo setting and account deletion\" |",
        "| Pause Pro, Resume Pro, Cancel Pro | `tests/e2e/navigation.spec.ts` \"Pro plan actions ...\" |",
        "| Keep my meal photos | `tests/e2e/navigation.spec.ts` \"Pro plan actions ...\" and `core.spec.ts` Q102 |",
        "| Withdraw (a consent), Remove (a medicine) | `tests/e2e/navigation.spec.ts` \"withdrawing a consent and removing a medicine ask first\" |",
        "| Mock purchase (local test mode only; hidden on the preview) | `tests/e2e/core.spec.ts` Pro tests |",
        "| Outside source links (NHS, NIDDK, BDA, CDC, PMC) | Each returned HTTP 200 on 19 Nov 2026 and opens in a new tab |",
        "| Controls inside sheets (Save, Close, choices) | `tests/e2e/core.spec.ts` and `tests/e2e/navigation.spec.ts` |",
    ]

    groups = OrderedDict()
    for r in rows:
        groups.setdefault((r["who"], r["route"]), []).append(r)
    lines += ["", "## Every control, by screen", ""]
    for (who, route), items in groups.items():
        lines += [f"### {who} · `{route}`", "", "| # | Control | Kind | Result | What happened |", "|---|---|---|---|---|"]
        for n, r in enumerate(items):
            lines.append(f"| {n} | {esc(r['name'])[:70]} | {r['role']} | {r['status']} | {esc(effect_text(r))[:140]} |")
        lines.append("")

    with open(OUT, "w") as f:
        f.write("\n".join(lines) + "\n")
    print(f"wrote {OUT}: {len(rows)} rows, {len(fails)} failing, {len(changed)} changed")


if __name__ == "__main__":
    main()
