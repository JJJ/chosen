# Upstream issue queue

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

For each candidate, reproduce the behavior on current `master`, add a failing
regression, make the smallest compatible fix, and run `npm test`. Touch reports
should also run `npm run test:mobile` after `npx playwright-core install webkit`.
The mobile script uses iPad WebKit emulation; a physical iPad remains useful for
final confirmation. Link each focused PR to the Harvest issue and record the
result in the queue. Review before merging, and do not change Harvest's issue
state from this fork.
