# Chosen

Chosen is a library for making long, unwieldy select boxes more user friendly.

- jQuery support: 1.7+ (tested with 1.7, 1.12, 3.5, and 4.0)
- Prototype support: 1.7+ (tested with 1.7)
- Experimental vanilla JavaScript adapter: no framework runtime dependency

Chosen's original compatibility target included Chrome, Firefox, Safari, and Internet Explorer 9. The full classic adapter browser suite runs in Chrome, and a focused Firefox test covers scrolled single-select Tab navigation in both adapters. The native, React, and touch suites also run in WebKit. Safari and Internet Explorer 9 are not currently covered by this fork's automated desktop tests. Please include your browser
and library versions when reporting a compatibility issue.

For **documentation**, usage, and examples, see the
[jQuery demo](https://jjj.github.io/chosen/),
[Prototype demo](https://jjj.github.io/chosen/index.proto.html),
[vanilla demo](https://jjj.github.io/chosen/native.html), and
[React demo](https://jjj.github.io/chosen/react.html), plus the
[options reference](https://jjj.github.io/chosen/options.html). The
[wiki](https://github.com/JJJ/chosen/wiki) covers setup and common workflows.
Applications updating from 3.x should read the [4.0 migration guide](docs/migration-4.md).

For **downloads**, see the [GitHub releases](https://github.com/JJJ/chosen/releases/).

### Compiled Assets

The compiled JavaScript and CSS files are located in the `/dist` directory. This directory contains:

- `chosen.jquery.js` / `chosen.jquery.min.js` - jQuery version
- `chosen.proto.js` / `chosen.proto.min.js` - Prototype version
- `chosen.css` / `chosen.min.css` - Styles
- `chosen.css.map` - CSS source map
- `native/chosen.native.js` / `native/chosen.css` - experimental vanilla edition
- `remote/chosen.remote.js` - opt-in bounded remote source helper for browser integrations

The `/docs` directory also contains copies of these files for GitHub Pages.
GitHub Pages publishes it automatically when changes reach `master`.
Each [release](https://github.com/JJJ/chosen/releases/latest) includes both a
full archive and a compiled distribution archive.

### Package managers

To install with npm:

```
npm install chosen-jjj
```

The default package entry loads the jQuery adapter through browser globals,
AMD, or CommonJS. CommonJS consumers should install jQuery alongside Chosen
and provide a DOM before requiring the packages. Explicit entries for
the Prototype adapter, shared CSS, Sass, and the experimental framework-neutral
ESM/CommonJS core are described in the
[package boundaries](docs/package-boundaries.md). The experimental vanilla adapter is described in the [vanilla guide](docs/native.md),
and the native React component in the [React guide](docs/react.md). Their remaining gaps are tracked in the [adapter parity inventory](docs/adapter-parity.md).
For large server-backed lists, see the opt-in [remote source guide](docs/remote-search.md).

To install with Composer:

```
composer require jjj/chosen
```

### Contributing to this project

We welcome all to participate in making Chosen the best software it can be. The repository is maintained by only a few people, but has accepted contributions from over 50 authors after reviewing hundreds of pull requests related to thousands of issues. You can help reduce the maintainers' workload (and increase your chance of having an accepted contribution to Chosen) by following the
[guidelines for contributing](contributing.md).

* [Bug reports](contributing.md#bugs)
* [Feature requests](contributing.md#features)
* [Pull requests](contributing.md#pull-requests)

Before opening an issue, see [support and discussion routes](SUPPORT.md). Please
follow our [Code of Conduct](CODE_OF_CONDUCT.md). For a potential security issue,
use the [private reporting instructions](SECURITY.md) instead of a public issue.

### Chosen Credits

- Concept and development by [Patrick Filler](http://patrickfiller.com) for [Harvest](http://getharvest.com/)
- Design and CSS by [Matthew Lettini](http://matthewlettini.com/)
- 1.8.x and earlier maintained by [@pfiller](http://github.com/pfiller), [@kenearley](http://github.com/kenearley), [@stof](http://github.com/stof), [@koenpunt](http://github.com/koenpunt), and [@tjschuck](http://github.com/tjschuck)
- 2.0.x and later maintained by [@JJJ](http://github.com/JJJ) and contributors
- Chosen includes [contributions by many fine folks](https://github.com/harvesthq/chosen/contributors)
