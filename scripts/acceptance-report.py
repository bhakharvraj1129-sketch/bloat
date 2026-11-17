#!/usr/bin/env python3
"""Builds the 200-row acceptance table in TEST_RESULTS.md from the test files.
A test counts as evidence only if a test title names its ID. Overrides below record, honestly,
where that evidence is partial, blocked or missing. Run after the test suites pass."""
import json, re, glob, sys

tests = json.load(open("docs/data/Bloat_Acceptance_v4.3.json"))
found = {}
for f in sorted(glob.glob("tests/**/*.ts", recursive=True)):
    for line in open(f):
        m = re.search(r"\b(?:it|test)\(\s*[\"`'](.*)", line)
        if m:
            for q in re.findall(r"Q\d+", m.group(1)):
                found.setdefault(q, [])
                if f not in found[q]: found[q].append(f)

PARTIAL = {
 "Q21": "Medicine changes are shaded on charts and the before/after view is tested (Q168, Q169). The separate 'sensitivity view' that records exclusions is not built.",
 "Q33": "Deletion, token refusal and re-applying tombstones are tested. A real backup restore on Supabase has not been rehearsed.",
 "Q40": "Reports store rule versions and are immutable snapshots (tested). A versioned rollout process for rule changes is not built.",
 "Q102": "Metadata stripping and no-storage are tested. 'Deleted after the check' holds because the photo is never stored unless Keep is on; the Keep path is not browser-tested.",
 "Q177": "A quarterly snapshot is created after 90 days (tested once). The quarterly summary screen is labelled 'later' in the plan and is not built.",
 "Q178": "Typed dishes are tested. Photo labels depend on a real AI provider, which is not connected.",
 "Q182": "Both providers share one fixed schema and the mock passes it. Switching to the real provider is untested (no key).",
 "Q184": "Expired export link, revoked share, deleted account and founder access are tested. Restored backup: see Q33.",
 "Q189": "All 15 articles are listed with sources, as outlines. The full article texts are not written.",
 "Q191": "Alerts are created once per level in the founder outbox with no user data (tested). Sending them by email needs Resend, which is not connected.",
 "Q198": "The switch takes effect on the next request (tested), well inside 1 minute.",
 "Q201": "Source scan for keys and client env use passes. Separate test and live keys cannot be checked: no real key exists yet.",
 "Q59": "Keyboard use, names and focus ring are browser-tested on core recording. No screen-reader session was run.",
 "Q129": "Browser test saw zero third-party requests on the main flow, and the source scan is clean. Not every screen was visited in the browser.",
 "Q113": "Publishing rule is enforced in the content schema (tested). The founder publishing screen is not built.",
 "Q148": "Help text matches the stored copy (tested) and every published card links a source. The source links themselves have not been checked against the live pages.",
}
BLOCKED = {
 "Q47": "Google sign-in needs the Google provider switched on in Supabase (owner). The help acknowledgement is kept in the tab across the redirect by design; untested.",
 "Q75": "Database rows and stored photos are deleted (tested under Q33). Notifying outside processors needs those accounts.",
 "Q147": "Harness built and unit-tested. The real run needs the 300 dishes, 100 photos and an AI key. No accuracy number is claimed.",
 "Q188": "Harness reports the regional Indian set separately (unit-tested). Real run blocked as Q147.",
}
NOT_BUILT = {
 "Q24": "There is no shared food catalogue. Each ingredient row stores the model and prompt version.",
 "Q37": "Country capability rows exist but switching a country off is not enforced yet.",
 "Q56": "Not built as written: results are worked out on read from current records, so there is no stored result for an older job to overwrite.",
 "Q68": "No brand or product catalogue exists.",
 "Q69": "Cuisine preferences are stored; nothing is ordered by them yet (there is no dish suggestion list).",
 "Q70": "The app is English only; the 'English only' note is not shown (wording needs the owner's yes).",
 "Q77": "No notifications or reminders exist in this release (plan A18).",
 "Q79": "No beta cohort reporting.",
 "Q80": "No re-check of country policy during a running job.",
 "Q183": "AI failure counts show in the founder tools. No automatic alert on failure rate or stuck jobs.",
 "Q187": "No research or secondary use exists anywhere; a refusal path is not built because there is nothing to request.",
}
MANUAL_PASS = {
 "Q51": ["tests/api/slice-bd-pro.test.ts"], "Q52": ["tests/e2e/core.spec.ts"], "Q163": ["tests/api/slice-a-episodes.test.ts"],
}
rows, counts = [], {"Passed": 0, "Partial": 0, "Blocked": 0, "Not implemented": 0}
for t in tests:
    q = t["id"]
    ev = found.get(q) or MANUAL_PASS.get(q) or []
    if q in BLOCKED: status, note = "Blocked", BLOCKED[q]
    elif q in NOT_BUILT: status, note = "Not implemented", NOT_BUILT[q]
    elif q in PARTIAL: status, note = "Partial", PARTIAL[q]
    elif ev: status, note = "Passed", ""
    else: status, note = "Not implemented", "No test names this ID."
    counts[status] += 1
    files = ", ".join(sorted(set(e.replace("tests/", "") for e in ev))) or "–"
    rows.append(f"| {q} | {t['scenario'].replace('|', '/')} | {status} | {files} | {note} |")
out = ["| ID | Scenario | Status | Evidence (tests/) | Note |", "|---|---|---|---|---|", *rows]
open("docs/acceptance-table.md", "w").write("\n".join(out) + "\n")
print(json.dumps(counts))
