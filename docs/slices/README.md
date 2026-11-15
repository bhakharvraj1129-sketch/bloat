# Slice briefs

One brief per slice, named `slice-a.md`, `slice-b.md`, and so on. The slices are defined in plan section B06 (`../plan/B06-build-slices-and-coding-agent-brief.txt`).

The first session of each slice writes its brief and the owner approves it before any code. The brief lists:

1. **Scope**: the slice's row in B06, in plain words.
2. **Screens**: the plan screens from A05 and A06, and the matching approved design files.
3. **Questions**: the question IDs from `../data/Bloat_Questions_v4.3.json`.
4. **Acceptance tests**: the test IDs from `../data/Bloat_Acceptance_v4.3.json` that this slice must pass. The tests are not tagged by slice, so propose the list from the scope and let the owner approve it.
5. **Tables and endpoints**: from B02 and B03.
6. **Out of scope**: what waits for a later slice.
7. **Done means**: the four checks in the bloat-session-routine skill.

Do not start a slice until the previous slice is tagged done.
