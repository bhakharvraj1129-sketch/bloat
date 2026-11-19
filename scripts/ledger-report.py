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

    lines += [
        "",
        "## Defects reproduced and repaired (targeted tests)",
        "",
        "The crawler only sees whether something visible happened. These tests check the result itself.",
        "Each was run against the earlier build (commit `dc88b37`, local copy on port 3200) and the fixed",
        "build (local, port 3100) on 19 Nov 2026: all 14 failed before, at the line shown, and pass after.",
        "Tests: `tests/e2e/navigation.spec.ts`.",
        "",
        "| # | Defect (earlier build) | What the earlier build did | Fixed behaviour |",
        "|---|---|---|---|",
        "| 1 | Back went to a fixed screen, not where you came from | Today, then a day, then Back: History | Back returns to Today; a direct link falls back to the parent |",
        "| 2 | The phone's Back button left the screen when a sheet was open | Me, Today, open a sheet, Back: Me | Back closes the sheet and stays on Today; focus returns to the button that opened it (it went to the page body before, on every sheet) |",
        "| 3 | Closing a filled-in sheet lost what was typed | Escape closed \"Add meal\" at once | Asks \"Close without saving?\"; Keep editing keeps the text |",
        "| 4 | The phone's Back button in setup left setup and lost every answer | Back from step 3 left setup | Back goes to the previous step, answers kept |",
        "| 5 | \"Check save status\" closed the sheet even when the check failed | Sheet closed as if saved | Sheet stays open and says the connection was lost; the next check saves once |",
        "| 6 | Health background hid a failed part of its save | No message, \"Saved\" shown | The failure is shown; nothing says Saved until every part is saved |",
        "| 7 | The recall screen turned on the AI check without asking | Consent recorded on \"Check ingredients\" | Shows the CN-04 agreement first; nothing recorded until \"I agree\" |",
        "| 8 | Withdraw consent and Remove medicine acted at once, with no progress or error | Request sent on the first tap | Asks first, shows progress, reports failures |",
        "| 9 | A double tap on Download started two exports | 2 export requests | 1 request; buttons locked while preparing |",
        "| 10 | An expired session lost the screen you were on | Sent to `/sign-in`, then Today | `/sign-in?next=...` returns to the same screen (only Bloat screens accepted) |",
        "| 11 | Empty waitlist and email-code forms gave no message in the app | Browser bubble only, or nothing | Inline message in the app's own wording; waitlist email no longer wrongly labelled optional |",
        "| 12 | The help page's Back did nothing useful on a direct link | Went to a blank page | Returns to the start page (signed out) or Today (signed in) |",
        "| 13 | Profile switches (Keep my meal photos, Hide charts, Units) snapped back while saving | The tick did not stay | Shows the choice at once, locks while saving, goes back with a message if it fails |",
        "| 14 | Leaving a screen with unsaved changes gave no warning | Tab bar left Health background, edits lost | Asks \"Leave without saving?\"; Back still goes to the previous screen |",
        "",
        "Also repaired in the same round (checked by the full browser and API suites): Pause, Resume, Cancel Pro and",
        "Mock purchase now show progress and errors; the delete-account sheet no longer says \"Nothing was deleted\" when",
        "the connection drops (it offers \"Check and finish\"); starting an experiment shows a lost-reply state; the",
        "AI-check agreement in the meal sheet cannot be sent twice; a time zone typo and a lost connection get different",
        "messages; the Contact page's help link no longer reloads the whole app.",
        "",
        "Note: the crawler ran with local test mode on and email-code sign-in (the local default). The preview uses",
        "password sign-in; its signed-out screens are checked by `tests/hosted/navigation.spec.ts`.",
    ]

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
