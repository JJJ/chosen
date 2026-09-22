# Changelog

All notable changes to this project will be documented in this file.

This project is a continuation and modernization of the original [harvesthq/chosen](https://github.com/harvesthq/chosen) library, maintained by [JJJ](https://github.com/JJJ).

## Unreleased

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
