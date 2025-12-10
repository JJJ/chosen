# Changelog

All notable changes to this project will be documented in this file.

This project is a continuation and modernization of the original [harvesthq/chosen](https://github.com/harvesthq/chosen) library, maintained by [JJJ](https://github.com/jjj).

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
- **Community Driven**: Maintained by [JJJ](https://github.com/jjj) with community contributions

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

For issues and contributions, visit: https://github.com/jjj/chosen
