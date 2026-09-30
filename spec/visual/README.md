# Visual fixtures

Run `npm run test:visual` to check the styling states in Chromium. Run
`npm run visual:fixtures` to capture screenshots in `spec/visual/output/` for
manual review. The output is intentionally not committed: browser and font
rendering differences make pixel snapshots unreliable across machines.

The fixture matrix covers single and multiple controls in the jQuery,
Prototype, Vanilla, and React editions. It captures default, hover, focus, open,
disabled, and invalid states, plus the legacy drop-up state. The Tailwind
light and dark variants include Preflight and the forms plugin; dark open
states receive a color-contrast audit. Vanilla and React do not currently provide
automatic drop-up positioning.

Focused fixtures also exercise legacy Select all/Deselect all actions (including
filtered results), collapsed choice summaries, selected-result removal, single
clear buttons, long single labels, and RTL layouts. React fixtures cover its
single clear button, long labels, and RTL single/multiple layouts. A scoped teal
palette checks token overrides separately from Tailwind; selected dark feature
states receive an additional color-contrast audit.
Vanilla and React also check chip-summary height and overflow in a narrow control.
