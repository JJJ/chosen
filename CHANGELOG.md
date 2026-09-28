# Changelog

All notable changes to this project will be documented in this file.

This project is a continuation and modernization of the original [harvesthq/chosen](https://github.com/harvesthq/chosen) library, maintained by [JJJ](https://github.com/JJJ).

## Unreleased

### Added
- Expose classic search matching, prefix-priority highlighting, normalization, value search, result-count, and query-length settings in the experimental vanilla and React editions through the shared core.
- Add an experimental dependency-free vanilla JavaScript edition at `chosen-jjj/native`, backed by an existing select with native form events and a live demo (harvesthq/chosen#1380).
- Read supported scalar Chosen options from per-select `data-*` attributes in both legacy adapters, with explicit JavaScript options taking precedence (harvesthq/chosen#1870).
- Load the jQuery distribution through AMD or CommonJS while preserving plain browser-script loading and the existing `$.fn.chosen` API (harvesthq/chosen#2215).
- Include the previous single-select value as `deselected` in jQuery `input` and `change` event data when switching or clearing a selection (harvesthq/chosen#2336).
- Let applications set adapter-local initialization defaults through `$.fn.chosen.defaults` or `Chosen.defaults`, with per-control options taking precedence (harvesthq/chosen#2499).
- Allow `width: false` to leave the generated container width to CSS in both adapters (harvesthq/chosen#2575).
- Allow opt-in relative sizing of the SVG control icons through `--chosen-icon-size`, with a `rem` sizing recipe and live jQuery/Prototype examples (harvesthq/chosen#2651).
- Expose the jQuery plugin's `Constructor`, `AbstractConstructor`, and `noConflict()` interface without changing existing `.chosen()` calls (harvesthq/chosen#2776).
- Add opt-in `highlight_prefix_matches` so contains searches initially highlight a visible label-prefix match without changing result or native option order (harvesthq/chosen#2788).
- Add opt-in `paste_multiple_values` for selecting existing, enabled multiple-select options from delimited pasted text, while preserving unmatched entries and native select events (harvesthq/chosen#2845).
- Ship editable SVG source files for Chosen's four embedded control icons; the build now derives Sass data URLs from those files (harvesthq/chosen#2959).
- Let an opt-in `data-chosen-always-visible` attribute keep an option such as “Other” available during searches, including when no ordinary result matches (harvesthq/chosen#2963).
- Add opt-in `recalculate_width_on_update` to resize Chosen when a native select gains longer options (harvesthq/chosen#2884).
- Add opt-in `dropdown_position: "fixed"` to show results outside an `overflow: hidden` ancestor while tracking scroll and resize (harvesthq/chosen#86).
- Add an opt-in invalid border for explicitly invalid legacy and React controls, with a shared `--chosen-invalid-border-color` token and repeatable visual fixtures for the default, Tailwind light/dark, and custom-palette themes. React also uses the shared hover and open border tokens.
- Add opt-in `max_items_shown` for collapsing selected multiple-choice chips into an expandable summary without limiting selection.
- Add an opt-in `search_matcher(query, item)` callback for custom result filtering, including regex-based rules. It replaces built-in search matching and leaves custom matches unhighlighted because a boolean result has no match position.
- Use `type="search"` for generated search inputs by default and allow `search_input_type: "text"` for integrations that need the previous markup.
- Add opt-in removal of individual multiple selections from their dropdown results by pointer or Enter, with a visible remove mark.
- Allow integrations to override Chosen's existing Sass palette variables before importing the stylesheet.
- Add opt-in Select all and Deselect all actions for multiple selects, with filtering, disabled-option, selection-limit, keyboard shortcuts, and customizable text.
- Add an opt-in `dropdown_width` setting for sizing the result dropdown independently from the Chosen control. Custom-width dropdowns float as separate surfaces and align to the control's reading edge.
- Support per-option synonyms and aliases through the `data-search-text` attribute without changing visible labels.
- Add an opt-in `display_selected_value` setting for showing option values in selected controls while retaining labels in the dropdown.
- Add an opt-in `min_search_length` setting for keeping results hidden until enough search text is entered.
- Add opt-in, order-independent multi-term searching through `split_search_terms`.
- Add an opt-in `multiselect_allow_tab_to_select` setting for accepting highlighted multiple-select results with Tab.
- Add an opt-in `search_delay` for debouncing searches in large option lists.
- Announce the number of available search results to assistive technologies. Use the `results_count_text` callback to localize the message.
- Add Sass variables and CSS documentation for styling matched search text.
- Support non-editable Chosen controls through the `readonly` select attribute while keeping their values enabled for form submission.
- Add `open_on_label_click` to let associated labels consistently focus or open both single and multiple controls while preserving the existing defaults when omitted.

### Fixed
- Match classic control width, independent dropdown width, and fixed dropdown positioning in vanilla and React. Vanilla can remeasure its source select on update; React responds to width prop changes. Custom-width or fixed popups gain separate floating borders, adding `chosen-native--floating` and `chosen-react--floating` selectors.
- Carry opt-in option `data-*` attributes to vanilla and React result rows. Vanilla honors `parser_config.copy_data_attributes`; React uses structured `dataAttributes` and `copyOptionDataAttributes`. Generated result rows can now expose these attributes to integrations.
- Support classic `search_delay` in vanilla and React. Pending filters are applied before Enter, Tab, or navigation keys so keyboard actions use the current query.
- Add opt-in multi-value paste to vanilla and React through shared token resolution. Existing unique enabled options are selected, unmatched tokens remain in search, and native select values or React callbacks still drive form state.
- Match the classic opt-in Select all and Deselect all actions in vanilla and React, including filtered selection, limits, disabled-option rules, keyboard shortcuts, and customizable labels. Generated bulk action controls use `chosen-native__bulk-*` and `chosen-react__bulk-*` selectors.
- Add the classic selected-choice summary options to vanilla and React. A button expands hidden chips without changing the underlying selection; generated summaries use the new `chosen-native__summary` and `chosen-react__summary` selectors.
- Match classic single-select search visibility in vanilla and React with `disable_search` / `disableSearch` and option-count thresholds. The hidden search input remains the focus target and prefix typing still navigates open results.
- Align experimental React's default substring search, placeholder capitalization, single-clear visibility, multiple placeholder, and no-results copy with classic Chosen; apps depending on the earlier React defaults can set `searchContains`, `allowSingleDeselect`, `placeholder`, and `noResultsText` explicitly.
- Expose classic multiple-select Backspace removal and opt-in Tab selection in the vanilla and React editions with matching defaults.
- Use the classic `search` input type by default in the vanilla and React editions, with a `text` override and class-based styling.
- Carry source select direction and the legacy `chosen-rtl` class into the vanilla control, and expose the classic `rtl` setting.
- Add opt-in selected-value and optgroup-prefix display to vanilla and React; dropdown labels and submitted values are unchanged.
- Add opt-in source-class inheritance to vanilla, with update-time synchronization. The legacy `chosen-rtl` marker also passes through by default.
- Carry option and optgroup classes into vanilla and React result rows, with opt-in class copying to chips; add customizable live result counts and use no-results text literally. Generated result elements now receive source option classes.
- Add the classic two-press Backspace mode to vanilla and React, retaining immediate removal by default. The pending chip gains a focus outline.
- Match classic label activation defaults in vanilla and React, with `open_on_label_click` / `openOnLabelClick` overrides. Generated inputs stay the visible focus target.
- Match classic multiple-select defaults in vanilla and React: selected result rows are inert unless deselection is enabled, and a choice closes the dropdown unless configured otherwise. Both demos explicitly keep their earlier interactive behavior.
- Indent vanilla results beneath optgroup headings, distinguish selected rows with check or remove marks, and let selected multiple results toggle off by click or Enter. Tighten vanilla chip remove buttons and style the demo's dark controls.
- Keep legacy and React search inputs at least 16px on touch devices to avoid iPhone Safari focus zoom without restricting user zoom.
- Keep the Prototype single-select dropdown open after a phone tap, so its synthesized mouse event does not close the menu immediately.
- Render option labels and configurable no-results/create-option messages as text, preventing nested option markup or label HTML from becoming generated Chosen elements (harvesthq/chosen#2751).
- Honor `enable_split_word_search: false` even with `search_contains: true`, so punctuation-prefixed option text can match from the beginning without matching the same text later in an option (harvesthq/chosen#2862).
- Highlight partly visible results on pointer hover without moving the result list; keyboard navigation still scrolls the active result into view (harvesthq/chosen#2771).
- Use native element focus after selecting a jQuery result, avoiding the deprecated jQuery event shorthand (harvesthq/chosen#2931).
- Keep the Prototype dropdown open when a bottom-edge click lands on its container after mouse-down (harvesthq/chosen#2156).
- Preserve text selection when dragging across an associated label instead of focusing Chosen (harvesthq/chosen#2659).
- Respect an explicit CSS width when a select starts inside a hidden container (harvesthq/chosen#92).
- Refresh selected text and chips after a native form reset, without changing native reset or change-event behavior (harvesthq/chosen#2789).
- Keep keyboard focus on Chosen when a user clicks an already selected, disabled, or no-results row that cannot be selected (harvesthq/chosen#2787).
- Start searching when a user types a printable key on a focused single select, without requiring an initial click (harvesthq/chosen#3075).
- Preserve an explicitly empty `data-placeholder`, native `placeholder`, or configured placeholder instead of replacing it with default text (harvesthq/chosen#1076).
- Let `chosen:open` open an already activated single select, while keeping repeated open calls idempotent in both adapters (harvesthq/chosen#2689).
- Keep an open React dropdown visible during mouse or touch presses on its associated label, and use the demo's field-specific search placeholders.
- Keep the React dropdown chevron pointing down in right-to-left controls instead of mirroring sideways.
- Truncate long React multiple-choice chip labels inside the control while keeping their remove buttons visible.
- Remove browser-default padding and extra horizontal width around React multiple-choice chip remove buttons; the chip itself provides the trailing spacing.
- Let visible, selected React multiple-choice results toggle off by click or Enter, including when the selection limit has been reached.
- Keep only one React result highlighted when moving between options, distinguish selected results with a check mark, and clip result backgrounds to the dropdown's rounded corners.
- Indent React options beneath group headings on the inline start side, including right-to-left controls.
- Keep the React single-select clear button on one line with a long selected label.
- Keep the dropdown available at the selection limit when Deselect all or individual result deselection is enabled.
- Stop an Escape key handled by an open Chosen dropdown from also reaching ancestor controls.
- Copy an option's `title` to its selected multiple-choice element.
- Keep search input text visible when a page uses a dark color scheme.
- Restore native-style prefix navigation when search is disabled.
- Support Home, End, Page Up, and Page Down navigation through visible results.
- Search from completed input values without filtering or selecting stale text while an IME composition is active.
- Expose one named combobox at a time for single selects, hide inactive dropdown semantics, and return focus to the closed control on Escape.
- Show a consistent focus outline around closed single and multiple Chosen controls, then use the joined active border while their dropdowns are open.
- Keep listbox option selection and active-descendant state accurate for assistive technologies.
- Keep required selects focusable so browsers can show native constraint-validation messages.
- Reopen an active multiple select when it is clicked again after choosing an option.

### Maintenance
- Verify that generated `dist/` and `docs/` files are committed before CI and tagged npm releases pass; GitHub Pages already publishes `master/docs` automatically (harvesthq/chosen#2657).
- Add an interactive React demo with native form submission, validation, multiple selection, selected/disabled result visibility switches, right-to-left layout, and light/dark token themes.
- Cover bulk actions, selected-choice summaries and removal, single clearing, long labels, and RTL layouts in the visual fixtures. Audit representative dark controls and dropdowns for color contrast.
- Complete the options reference and add matching jQuery, Prototype, and wiki recipes for search, option creation, selection, group actions, readonly controls, and dropdown sizing.
- Remove unused Prototype markup templates; both adapters already render their controls through the shared markup methods.
- Add operating-system dark-mode support and a persistent theme switch to the jQuery, Prototype, and Options example pages.
- Document Chosen's main CSS selectors and container states, and correct the generated ID in the arrow and height example.

### Developer notes
- Selected vanilla results now gain `.chosen-native__option--selected`; the mark is CSS generated, and selected multiple results can be toggled off without changing the row's `role="option"` markup.
- The new opt-in vanilla edition renders `chosen-native__*` elements and uses native `CustomEvent` details and native `input`/`change` events; its generated selectors, roles, and attributes are separate from the classic adapters and remain experimental.
- With `width: false`, Chosen omits the generated container's inline `width` style; CSS selectors can size it. Default and explicit widths still set inline width as before.

- Setting `dropdown_width` adds `chosen-floating-dropdown` to the generated container so custom-width dropdowns can use complete corners, a gap, and independent elevation. Integrations that assert generated container classes should allow this opt-in state.
- Generated result and selected-choice labels now use the native option's text. Integrations that placed HTML nodes inside an `<option>` will see their text rather than copied markup; native option values and selection events are unchanged.
- Opting into `dropdown_position: "fixed"` adds `chosen-fixed-dropdown` to the generated container and positions its existing `.chosen-drop` relative to the viewport. The dropdown stays inside the container in the DOM; integrations that inspect container classes should allow this opt-in state.
- React adds `.chosen-react__option--selected` to selected result rows; its check mark is CSS generated. Pointer entry now updates the active option and `aria-activedescendant`, while the highlighted row remains distinct from selection.
- The documentation-only `docs/docsupport/react-demo.js` bundles React and ReactDOM for GitHub Pages. The published `chosen-jjj/react` entry still treats React as a peer dependency; regenerate the demo and its copied stylesheet with `npm run build`.
- React adds `.chosen-react--invalid` when `aria-invalid` is true; legacy Chosen styles the generated sibling container when the original select has `aria-invalid="true"`. Native `:invalid` alone does not activate the new border.
- Enabling `max_items_shown` hides excess selected `.search-choice` elements and adds a `.chosen-choice-summary` list item with a button before the search field. The selected options and hidden choice elements remain in the DOM.
- Generated `.chosen-search-input` elements now use `type="search"` by default instead of `type="text"`. Integrations with CSS or DOM checks tied to the old attribute can set `search_input_type: "text"`. Chosen's CSS targets the class for either type and suppresses the browser's native search clear control. The input type does not guarantee suppression of browser autofill suggestions.
- Enabling `deselect_selected_results` adds `active-result chosen-result-deselectable` to enabled selected option rows. The remove mark is CSS generated, so the result-row markup does not gain another child element.
- Enabling `allow_select_all` or `allow_deselect_all` adds action rows with `data-chosen-action` to the generated results list. Integrations that inspect result-list children should allow these opt-in rows.
- Single-select markup keeps the same elements and nesting, but its accessibility attributes now change with dropdown state. `.chosen-single` uses `role="combobox"` instead of `role="button"`, receives the select's accessible name and `aria-controls`, and is removed from the accessibility tree and tab order while the searchable combobox is open. `.chosen-drop` now toggles `aria-hidden` between closed and open states. Integrations that assert generated roles, ARIA attributes, or `tabindex` values should update those expectations.
- Each generated `.chosen-container` now includes a visually hidden `.chosen-results-status` element after `.chosen-drop`. It uses `role="status"` to announce the available result count and is cleared when the dropdown closes. Integrations that assert the container's direct children should allow this new element.

## [3.0.4] - 2026-09-21

### Fixed
- Load the Prototype adapter and initializer on the Prototype example page.

### Maintenance
- Clarify browser compatibility and the current automated test coverage in the README and demos while retaining the original compatibility target.
- Link the arrow and height styling recipe from the demo FAQs, refresh example versions and links, and update the documentation footer.
- Keep distribution files, source, and documentation in the npm package while excluding CI, specs, and build tooling.

## [3.0.3] - 2026-09-21

### Fixed
- Restore a select's inline styles and remove only Chosen's event handlers when destroying either adapter.
- Inherit multiple option classes in selected choices, including in the Prototype adapter.
- Select only available options in the current optgroup without consulting another Chosen instance.
- Preserve literal values and text when creating options instead of interpreting them as HTML.
- Keep jQuery result highlighting intact when the pointer leaves an unrelated child element.
- Support the opt-in `select-by-group` attribute in the Prototype adapter and keep group selection within its optgroup in both adapters.

### Maintenance
- Remove the unused `gh-pages` Grunt task and document that GitHub Pages serves `master/docs`.

## [3.0.2] - 2026-09-21

### Fixed
- Preserve unique result IDs when several selects have no ID.
- Copy custom ARIA attributes and associated labels to the search input in both builds, including after `chosen:updated` (#37).
- Keep keyboard focus on the single-select control until Enter or Space opens it, and prevent the opening Enter keyup from immediately selecting a result.
- Restore accent-insensitive search fallback in both builds.
- Improve placeholder contrast and correct the embedded arrow image URL.

### Maintenance
- Run browser specs against jQuery 4.0, 3.5, 1.12, and 1.7, plus Prototype 1.7, with maintained Playwright Core and Jasmine packages, including keyboard and accessibility checks.
- Remove the outdated Jasmine/Grunt runner and watcher dependencies, clearing the development dependency audit.
- Prepare npm trusted publishing from GitHub releases and correct the release documentation and package metadata.
- Update GitHub Actions to the Node.js 24 based checkout and setup actions.

## [3.0.1] - 2026-09-21

### Fixed
- Restore search compatibility with jQuery 4 by removing the `$.trim` call (#85).
- Make the single-select dropdown control keyboard accessible and expose its expanded state without nesting an inaccessible button inside the decorative arrow (#68). Existing arrow CSS selectors remain valid.
- Copy `aria-label`, `aria-labelledby`, and `aria-describedby` values from the original select to the search input in both jQuery and Prototype builds (#37).
- Select search results on touchend in both builds without depending on a synthetic mouse event.

### Maintenance
- Update compatible npm development dependencies and remove the unused direct Puppeteer dependency.
- Point the npm package entry point to the compiled file in `dist/js`.
- Run Prototype specs in the standard test task, keep generated assets in sync while testing, and pin Jasmine 4 so the runner does not load an incompatible future release.
- Use Node.js 24 LTS for development and CI builds.

## [3.0.0] - 2025-12-30

### Major Version Release

This release represents a comprehensive modernization and enhancement of the Chosen library with numerous bug fixes, new features, and improved infrastructure.

### Added
- **Accented Character Support**: Added `normalize_search_text` callback support for searching with accented characters (#65)
- **Dynamic Dropdown Positioning**: Dropdown position now adjusts automatically on scroll to stay in viewport (#66, #67)
- **Accessibility Improvements**:
  - Added visually-hidden CSS class for screen reader text (#70)
  - Fixed ARIA label references (#44, #50)
- **SCSS Distribution**: SCSS source files now included in npm package for better theming support (#73)
- **Build Artifacts**: Compiled assets now available in `/dist` directory (renamed from `/build`) (#71)

### Fixed
- **Test Suite**: Fixed multiple Jasmine test failures (#75, #77, #79)
  - Scroll position tests now work with variable viewport sizes
  - Fixed width tests and scroll handler tests
  - Improved test maintainability with named constants
  - Added throttle delay handling
- **Rendering Issues**:
  - Fixed double-encoding of HTML entities in placeholder text (#63)
  - Fixed narrow width issue for short select values with min-width CSS (#67)
  - Fixed remove button "x" visibility with proper CSS class (#70)
- **Search & Highlighting**: Improved normalized text highlighting algorithm
- **Security**: Improved HTML entity decoder for better security (#65)
- **Scroll Handling**: Added scroll throttling and proper cleanup in destroy method (#66)

### Changed
- **CI/CD**: Migrated from Travis CI to GitHub Actions with Puppeteer configuration
- **Build Process**:
  - Reorganized dist directory structure (js, css, scss subdirectories) - later consolidated
  - Fixed source map paths to be relative
  - Restored license headers in dist files
  - Added `.gitattributes` for dist file handling
- **Package Distribution**:
  - Updated npm package name to `chosen-jjj`
  - Configured for proper npm publishing with `prepublishOnly` script
  - Excluded composer.json from distribution
  - Package now includes only `/dist` directory
- **Code Quality**:
  - Improved variable naming and added performance comments
  - Better code organization and documentation
  - CoffeeScript @ notation for consistency
  - Added comprehensive test coverage

### Infrastructure
- All dependencies updated to latest versions
- Fixed GitHub Actions CI failures with proper Puppeteer sandbox configuration
- Updated testing framework compatibility (Jasmine 4 + Puppeteer)
- Improved build reliability and maintainability

## [2.2.1] - 2025-12-09

### Differences from Original chosen-js (harvesthq/chosen v1.8.7)

This fork represents a major version upgrade from the original chosen-js library with several important improvements:

#### Updated Dependencies & Modernization
- **jQuery Support**: Updated to support jQuery 3.5.1+ (while maintaining backwards compatibility with jQuery 1.12.4+)
- **Modern Build Tools**: Upgraded to modern build toolchain
  - Grunt 1.2.1+
  - Sass (Dart Sass) instead of legacy preprocessors
  - Autoprefixer with PostCSS for better CSS compatibility
  - Updated CoffeeScript compiler
- **Security Updates**: All dependencies updated to latest versions with security patches
  - tar-fs ^3.0.4
  - ws ^8.17.1
  - puppeteer ^23.11.1

#### Build & Development Improvements
- **Enhanced CSS Processing**: Added autoprefixer for automatic vendor prefix handling
- **Improved Browser Compatibility**: Updated browserslist configuration
- **Better Source Maps**: Enhanced CSS source map generation
- **Modern Testing**: Updated Jasmine testing framework to v4.0.0
- **Improved Grunt Tasks**: Modernized build pipeline with latest grunt-contrib packages

#### Breaking Changes from v1.8.7
- Requires Node.js 4.0 or higher
- jQuery 1.7+ still supported, but optimized for jQuery 3.x
- Build process now requires modern Node.js environment

#### Maintenance & Support
- **Active Maintenance**: Unlike the original repository, this fork receives regular updates
- **Modern Standards**: Code follows current JavaScript best practices
- **Security Focus**: Regular dependency updates to address vulnerabilities
- **Community Driven**: Maintained by [JJJ](https://github.com/JJJ) with community contributions

### Migration from chosen-js (v1.8.7)

If you're migrating from the original `chosen-js` package:

1. Update your package reference from `chosen-js` to `chosen-jjj`
2. Review your jQuery version (recommend jQuery 3.x for best compatibility)
3. Test your implementation (API remains backwards compatible)
4. Enjoy the improved security and modern tooling!

### Installation

```bash
npm install chosen-jjj
```

Or with Composer:

```bash
composer require jjj/chosen
```

### Credits

- Original concept and development by [Patrick Filler](http://patrickfiller.com) for [Harvest](http://getharvest.com/)
- Original design and CSS by [Matthew Lettini](http://matthewlettini.com/)
- v1.8.x and earlier maintained by the Harvest team
- v2.0.x and later maintained by [@JJJ](http://github.com/JJJ) and contributors

---

For detailed feature documentation, visit: https://jjj.github.io/chosen/

For issues and contributions, visit: https://github.com/JJJ/chosen
