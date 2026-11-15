---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

**Local change for Bloat (2026-11-14):** the original skill fetches its rules from a web address before every review, so anyone who controls that address could change what Claude is told to do. This copy reads the saved file `guidelines.md` in this folder instead. Do not fetch the rules from the internet. To update the rules, the owner asks for a fresh copy to be fetched, reviewed and committed (see docs/skills-sources.md).

## How It Works

1. Read `guidelines.md` in this folder (the rules and the output format)
2. Read the specified files (or ask the user for files or a pattern)
3. Check against all rules in `guidelines.md`, except where a Bloat override below applies
4. Output findings in the terse `file:line` format that `guidelines.md` describes

## Bloat overrides

Bloat's own rules beat these guidelines. Do not report these as findings:

- Headings and buttons use sentence case, not Title Case (the Bloat voice: "I feel bloated", "Review yesterday").
- Use the plain word "and", not "&".
- All user-facing wording follows the bloat-wording-and-safety skill. All colours, type, spacing and shapes follow the bloat-design-system skill. If a guideline conflicts with either, skip the guideline and say "Bloat rule applies" in one line.

## Usage

When a user provides a file or pattern argument:
1. Read `guidelines.md`
2. Read the specified files
3. Apply all rules, minus the Bloat overrides
4. Output findings using the format in `guidelines.md`

If no files specified, ask the user which files to review.
