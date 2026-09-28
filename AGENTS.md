# Chosen repository guidance

## Compatibility

- Preserve the native `<select>` as the source of submitted values and events.
- Keep existing defaults unless a change is explicitly intended to change them. Prefer opt-in settings for new behavior.
- Update both the jQuery and Prototype adapters for shared behavior.
- Edit CoffeeScript and Sass sources, then regenerate the distribution and mirrored `docs/` assets with `npm run build`.

## Documentation for user-facing changes

- Before a feature PR is ready to merge, update the relevant page in `docs/`. Document new options and defaults in `docs/options.html`; add a working example to both demo pages when the behavior benefits from trying it. Edit `docs/index.template.html` for shared jQuery/Prototype demo content and run `npm run build` to generate `docs/index.html` and `docs/index.proto.html`; do not edit those generated pages directly.
- Update the matching GitHub wiki page for new options, behavior, or workflows. Add or refresh a screenshot when appearance or interaction is central to the change. Keep wiki examples consistent with the live site.
- Record user-facing changes in `CHANGELOG.md`. Add a developer note when generated markup, selectors, roles, or attributes change, even for opt-in behavior.
- Check links and examples, and verify that the generated assets served by the site match `dist/`.

## Verification

- Run `npm test` for code changes. Run `npm run test:mobile` for touch or mobile behavior.
- Check generated JavaScript and CSS parity between `dist/` and `docs/`, run `node scripts/build-demo-pages.js --check`, and run `git diff --check`.
