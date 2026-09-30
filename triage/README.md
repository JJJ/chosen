# Upstream issue queue

The 49 pull requests open in `harvesthq/chosen` on September 30, 2026 are
listed separately in [`upstream-pulls.json`](upstream-pulls.json). An upstream
PR may have no matching open issue: `issue_refs` lists only issue numbers
explicitly referenced in its title or description. `unreviewed` means its
patch has not yet been compared with this fork. Other PR statuses use the
issue definitions below, plus `in-progress` while a focused fork fix is being
tested. Update the PR tracker and the public [Harvest issue review](https://github.com/JJJ/chosen/wiki/Harvest-Issue-Review)
when investigating or resolving one of these PRs.

Run `npm run triage:upstream` to combine the live open issues in
`harvesthq/chosen` with the reviewed entries in `upstream-issues.json`.
Use `npm run triage:upstream -- --limit=10` to show more unreviewed issues, or
`npm run triage:upstream -- --search=touch` to narrow the live list by title or
body. Run `node scripts/upstream-issues.js --json` for machine-readable output
including issue bodies and labels. The script
accepts `GH_TOKEN` or `GITHUB_TOKEN` when the anonymous GitHub API limit is low.

Each reviewed entry has an upstream issue number, one status, and a short note:

- `candidate`: the report is relevant enough to investigate.
- `needs-reproduction`: verify the behavior before changing code.
- `fixed-in-fork`: the fork has a fix and a regression test.
- `covered-in-fork`: existing behavior appears to cover the report.
- `blocked`: the report needs missing details or an environment we cannot test.
- `invalid`: spam, an empty template, or a report without a Chosen request.
- `duplicate`: another upstream issue describes the same underlying request; the
  note identifies the issue to track.
- `support-question`: application setup, CSS, or integration help rather than a
  library change.
- `declined`: a change that does not fit this fork's select-backed behavior,
  compatibility policy, or current project scope. This is not a judgment about
  the reporter or the usefulness of the idea elsewhere.

The September 2026 sweep read all 179 previously unreviewed open issue bodies
and their available comments. These dispositions are a desk review of the
current fork, not a reproduction of every report. `candidate` means worth
investigating, not approved for implementation. Recheck the latest discussion
and current code before coding or changing a disposition. The upstream issues
remain open; this queue does not alter Harvest's issue state.

For each candidate, reproduce the behavior on current `master`, add a failing
regression, make the smallest compatible fix, and run `npm test`. Touch reports
should also run `npm run test:mobile` after `npx playwright-core install webkit`.
The mobile script uses iPad WebKit emulation; a physical iPad remains useful for
final confirmation. Link each focused PR to the Harvest issue and record the
result in the queue. Review before merging, and do not change Harvest's issue
state from this fork.
