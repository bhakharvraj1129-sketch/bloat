# Where the outside skills came from

Copied on 14 Nov 2026 from the public repositories below, at the exact commits shown. Bloat's own skills (`bloat-*`) are written for this project.

| Skill folder | Repository | Commit | Licence | Changed? |
|---|---|---|---|---|
| `supabase` | github.com/supabase/agent-skills | c9be0e931b7930f7d02126d04774d904c381e7d7 (2 Oct 2026) | MIT (the repo's LICENSE file) | No |
| `supabase-postgres-best-practices` | github.com/supabase/agent-skills | c9be0e931b7930f7d02126d04774d904c381e7d7 | MIT | No |
| `react-best-practices` | github.com/vercel-labs/agent-skills | 1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62 (27 Oct 2026) | MIT | No |
| `composition-patterns` | github.com/vercel-labs/agent-skills | 1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62 | MIT | No |
| `web-design-guidelines` | github.com/vercel-labs/agent-skills | 1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62 | MIT | **Yes**, see below |
| `frontend-design` | github.com/anthropics/skills | 2c5958ecac7cee2b583967a2c4981d0f4a75c579 (6 Nov 2026) | see its LICENSE.txt | No |

## Review notes

None of the six contains scripts or executable files. Before copying, every file was searched for download, install and run instructions. What was found:

- `supabase` tells Claude to read Supabase's online docs and changelog (reading only), to check the Supabase MCP server with a simple `curl`, and to create an `.mcp.json` if missing. CLAUDE.md limits any Supabase connection to the `bloat-test` project.
- `web-design-guidelines` told Claude to fetch its rules from `raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` before every review. That is a live instruction file that can change without anyone here seeing it. It was replaced with a saved copy.
- `react-best-practices` mentions example commands such as `npx svgo` inside its advice text. No new library may be added without the owner's yes.
- Two skills have a different name inside than their folder name: `composition-patterns` is `vercel-composition-patterns` and `react-best-practices` is `vercel-react-best-practices`. That is how the authors published them and it is harmless.
- Several skills include their authors' own README, `CHANGELOG.md` or `metadata.json` files. They are harmless and kept so the folders can be compared with the originals.

## The saved copy of the web interface rules

`web-design-guidelines/guidelines.md` is the file from the address above, fetched on 14 Nov 2026, 8,055 bytes, SHA-256 `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`. Its `SKILL.md` was edited to read this file and to list Bloat's overrides (sentence case, plain "and").

## Updating a skill

Ask Claude to fetch the newer version into a scratch folder, read it for anything that downloads or runs code, compare it with the version here, and show you the differences. Then update this table with the new commit.
