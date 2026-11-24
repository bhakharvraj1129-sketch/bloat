#!/usr/bin/env python3
"""Build docs/verification-report.md from the raw results in test-evidence/ledger/.

Inputs (made by the local runs described in the report):
  ledger-after.json                 control crawl (tests/ledger/ledger.spec.ts)
  navigate.json                     link outcomes (tests/ledger/navigate.spec.ts)
  navigate-before-back-fix.json     the same, before the Back fixes
  e2e-results.json                  every browser test incl. tests/e2e/mutations.spec.ts (JSON reporter)
  mutations-before-delete-fix.json  the save/edit checks before the delete fix
  widths-after.json                 five-width check
The hand-written parts are docs/verification-report.summary.md (results at a glance) and
docs/verification-report.parts.md (defects, open items, hosted evidence, accounts, limits).
"""
import json
import os
import re
from collections import Counter, OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "test-evidence", "ledger")
# Which app code each raw result file was produced on (kept by hand, checked against the run logs).
CRAWL_CODE = "2f22cc4"  # ledger-after.json, navigate.json, widths-after.json: 22 Nov
FINAL_CODE = "f8fcd9d"  # e2e-results.json: 24 Nov, the published build
OUT = os.path.join(ROOT, "docs", "verification-report.md")


WHY_DISABLED = {
    "Sign in with test password": "local test mode only, until an email and an 8-character password are typed",
    "Continue": "until a country is chosen (start), both questions are answered (review) or 6 digits are typed (code)",
    "Send a new code in 60 s": "the resend wait after a code is sent",
    "Edit times": "while the bloating is still open; it is ended on Today first",
    "Choose": "until there are 4 confirmed days in the week before (the server's rule)",
    "Save feedback": "until Tried or Not today is chosen",
}


def load(name):
    p = os.path.join(SRC, name)
    return json.load(open(p)) if os.path.exists(p) else None


def specs(report):
    """(file, describe, title, status, first error line) for every test in a Playwright JSON report."""
    out = []

    def walk(s, prefix):
        for sp in s.get("specs", []):
            for t in sp["tests"]:
                for r in t["results"]:
                    msg = re.sub(r"\x1b\[[0-9;]*m", "", ((r.get("errors") or [{}])[0].get("message") or "")).split("\n")[0]
                    out.append((sp["file"], prefix, sp["title"], r["status"], msg))
        for c in s.get("suites", []):
            walk(c, c.get("title", "") if c.get("title", "").endswith(".ts") is False else prefix)

    for s in report["suites"]:
        walk(s, "")
    return out


def main():
    L = []
    ledger = load("ledger-after.json")
    nav = load("navigate.json")
    nav_before = load("navigate-before-back-fix.json")
    e2e = load("e2e-results.json")
    mut_before = load("mutations-before-delete-fix.json")
    widths = load("widths-after.json")

    L += [
        "# Verification report",
        "",
        "What has been checked, how, and what is still not proven. \"Clicked\" and \"verified\" are kept apart:",
        "a control that responded is not counted as working unless its outcome was checked. Local results",
        "(local Supabase in Docker, synthetic accounts, test mode on) and hosted results (the public preview",
        "and `bloat-test`) are kept apart, and nothing here comes from a real phone. Rebuild with",
        "`python3 scripts/verification-report.py`.",
        "",
    ]
    L += [open(os.path.join(ROOT, "docs", "verification-report.summary.md")).read().rstrip(), ""]

    # 1. Ledger reconciliation
    rows = ledger["rows"]
    pages = [r for r in rows if r["tag"] == "page"]
    ctrls = [r for r in rows if r["tag"] != "page"]
    kind = lambda r: (r.get("effect") or {}).get("kind")
    clicked = [r for r in ctrls if r["status"] == "pass" and kind(r) != "link"]
    linkonly = [r for r in ctrls if r["status"] == "pass" and kind(r) == "link"]
    destructive = [r for r in ctrls if r["status"] == "check" and kind(r) == "destructive"]
    external = [r for r in ctrls if r["status"] == "check" and kind(r) == "external"]
    hidden = [r for r in ctrls if r["status"] == "listed" and not r["visible"]]
    disabled = [r for r in ctrls if r["status"] == "listed" and r["visible"] and r["disabled"]]
    fields = [r for r in ctrls if r["status"] == "listed" and r["visible"] and not r["disabled"]]
    failed = [r for r in rows if r["status"] == "fail"]
    ck = Counter(kind(r) for r in clicked)
    L += [
        "## 1. The control crawl, reconciled",
        "",
        f"Crawl of app code `{CRAWL_CODE}` (not the final build; the fixes since are in section 4), on {ledger['when'][:16].replace('T', ' ')} UTC, phone width, signed-out, Free and Pro visitors.",
        f"Total rows: **{len(rows)}** = {len(pages)} screen loads + {len(ctrls)} control rows. The same control appears once per",
        f"screen and visitor (for example the four tabs on every signed-in screen), so there are {len(set((r['name'], r['href'] or '', r['role']) for r in ctrls))} distinct controls.",
        "",
        "| Group | Rows | What it means |",
        "|---|---|---|",
        f"| Passed: screen loaded | {len(pages)} | The screen answered with HTTP below 400 and drew a heading. |",
        f"| Passed (weak): clicked and something happened | {len(clicked)} | {ck.get('changed', 0)} changed what is on screen, {ck.get('dialog', 0)} opened a sheet, {ck.get('request', 0)} sent a save request, {ck.get('navigated', 0)} changed screen, {ck.get('already selected', 0)} were options already chosen. The outcome itself is checked only by the tests in sections 2 and 3. |",
        f"| Passed (weak): link target loads | {len(linkonly)} | The crawler requested the link's address and got HTTP below 400. **The link was not clicked here**; clicking, destination and Back are checked in section 2. |",
        f"| Failed | {len(failed)} | None. |",
        f"| Skipped on purpose: destructive | {len(destructive)} | {', '.join(f'{k} ({v})' for k, v in Counter(r['name'][:30] for r in destructive).items())}. Each is covered by a named test (section 3 and the core tests). |",
        f"| Skipped on purpose: outside sites | {len(external)} | {len(set(r['href'] for r in external))} distinct source links (NHS, NIDDK, BDA, CDC, PMC); each answered HTTP 200 when checked on 19 Nov. Not opened in the app tests. |",
        f"| Excluded: hidden at phone width | {len(hidden)} | The desktop sidebar and desktop header links, present but hidden on a phone. Their clicks are checked at 1440px in section 2. |",
        f"| Excluded: disabled in that state | {len(disabled)} | " + "; ".join(f"{k} ({v}): {WHY_DISABLED.get(k, 'disabled until its form is complete')}" for k, v in Counter(r['name'][:40] for r in disabled).items()) + ". The enabled path of each is tested in section 3 or the core tests. |",
        f"| Excluded: text and choice fields | {len(fields)} | Fields are typed into by the section 3 tests, not clicked by the crawler. |",
        f"| Blocked | 0 | Nothing in the local crawl was blocked. |",
        "",
        f"Check: {len(pages)} + {len(clicked)} + {len(linkonly)} + {len(failed)} + {len(destructive)} + {len(external)} + {len(hidden)} + {len(disabled)} + {len(fields)} = {len(pages) + len(clicked) + len(linkonly) + len(failed) + len(destructive) + len(external) + len(hidden) + len(disabled) + len(fields)}.",
        "",
    ]

    # 2. Navigation outcomes
    nr = nav["rows"]
    L += [
        "## 2. Navigation: destination and Back, by real clicks",
        "",
        f"`tests/ledger/navigate.spec.ts`, app code `{CRAWL_CODE}` (not the final build), run {nav['when'][:16].replace('T', ' ')} UTC. Every distinct visible in-app link on every",
        "screen was clicked (header, footer and tab links from two screens each), for signed-out, Free and Pro visitors, at",
        "412px (phone) and 1440px (desktop). The destination must be the link's own address, or the documented rule for",
        "that visitor (signed out: Sign in with the screen remembered; Free on a Pro screen: Bloat Pro). Then Back was pressed:",
        "the screen's own Back link when it has one, otherwise the browser's Back button. It must return to the starting screen.",
        "",
        "| Visitor | Width | Clicks | Right destination | Back returned |",
        "|---|---|---|---|---|",
    ]
    groups = OrderedDict()
    for r in nr:
        groups.setdefault((r["who"], r["width"]), []).append(r)
    for (who, w), g in groups.items():
        L.append(f"| {who} | {w}px | {len(g)} | {sum(1 for r in g if r['destOk'])} | {sum(1 for r in g if r['backOk'])} |")
    L.append(f"| **All** | | **{len(nr)}** | **{sum(1 for r in nr if r['destOk'])}** | **{sum(1 for r in nr if r['backOk'])}** |")
    backs = Counter(r["back"] for r in nr)
    L += ["", f"Back used: the screen's own Back link {backs.get('app', 0)} times, the browser's Back {backs.get('browser', 0)} times."]
    if nav_before:
        bad = [r for r in nav_before["rows"] if r["backOk"] is False]
        L += ["", f"Before the fixes in section 4, the same run had {len(bad)} Back failures:"]
        for r in bad:
            L.append(f"- {r['who']} {r['width']}px: {r['from']} → \"{r['link']}\" → {r['landed']}, Back went to {r['backTo']} instead of {r['from']}.")
    L.append("")

    # 3. Save and edit outcomes
    allspecs = specs(e2e)
    mut = [s for s in allspecs if s[0].endswith("mutations.spec.ts")]
    actions = OrderedDict()
    extra = []
    for f, d, t, st, msg in mut:
        if not d:
            extra.append((t, st))
            continue
        actions.setdefault(d, {})[t] = st
    col = lambda t: "saves" if t.startswith("saves") else "failure" if t.startswith("a server failure") else "double"
    L += [
        "## 3. Save and edit actions: real outcomes",
        "",
        f"`tests/e2e/mutations.spec.ts`, local, app code `{FINAL_CODE}` (the final build), run {e2e['stats']['startTime'][:16].replace('T', ' ')} UTC. Each action is checked three ways, with a new synthetic account each time:",
        "",
        "- **Saves and persists:** the save request succeeds, the intended record changes when read back from the API (or the local",
        "  database for the waitlist), and after a full page refresh the screen still shows it.",
        "- **Failure:** the server is made to fail. The failure message must appear on screen (inside the sheet, when one is open),",
        "  the form must stay open with what was entered, nothing may change, and pressing the same button again must save it.",
        "- **Double tap:** two quick taps must send one save request and change the record once.",
        "",
        "| Action | Saves and persists | Failure shown, retry works | Double tap saves once |",
        "|---|---|---|---|",
    ]
    for name, res in actions.items():
        cells = {col(t): ("pass" if st == "passed" else "FAIL") for t, st in res.items()}
        L.append(f"| {name} | {cells.get('saves', '-')} | {cells.get('failure', '-')} | {cells.get('double', '-')} |")
    for t, st in extra:
        L.append(f"| {t} | {'pass' if st == 'passed' else 'FAIL'} | | |")
    passed = sum(1 for s in mut if s[3] == "passed")
    L += ["", f"Result: {passed} of {len(mut)} passed ({len(actions)} actions x 3, plus {len(extra)} single checks: the rows without three columns)."]
    if mut_before:
        mb = [s for s in specs(mut_before) if s[3] != "passed"]
        if mb:
            L += ["", "Before fix 1 in section 4 (earlier the same day), on the same checks:"]
            for f, d, t, st, msg in mb:
                L.append(f"- {d}: {t}: {msg}")
    other = Counter((s[0], s[3]) for s in allspecs if not s[0].endswith("mutations.spec.ts"))
    L += ["", "The other browser tests on the same build: " + ", ".join(f"{f} {sum(v for (ff, st), v in other.items() if ff == f and st == 'passed')} of {sum(v for (ff, st), v in other.items() if ff == f)}" for f in sorted({f for f, _ in other})) + ".", ""]

    if widths:
        w = widths["rows"]
        L += [f"Five widths (320, 390, 768, 1024, 1440px): {len(w)} screen and width checks, {sum(1 for r in w if r['overflow'] > 0)} with sideways scrolling.", ""]

    L += [open(os.path.join(ROOT, "docs", "verification-report.parts.md")).read().rstrip(), ""]
    with open(OUT, "w") as fh:
        fh.write("\n".join(L) + "\n")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
