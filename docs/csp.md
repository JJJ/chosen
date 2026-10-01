# Chosen and Content Security Policy

Chosen works without `unsafe-inline` for scripts or styles when its assets and
your initialization code load from sources allowed by your policy. The classic
jQuery and Prototype multiple-select search input gets its initial width from
`chosen.css`. Chosen also changes individual style properties at runtime for
control sizing and positioning; those property assignments work under a strict
style policy.

For a same-origin deployment, a policy can start with:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:
```

Load the stylesheet and scripts as external files, then initialize from an
external application script:

```html
<link rel="stylesheet" href="/assets/chosen.css">
<script src="/assets/jquery.js"></script>
<script src="/assets/chosen.jquery.js"></script>
<script src="/assets/app.js"></script>
```

```js
// app.js
$(function () {
  $('.chosen-select').chosen();
});
```

Use `chosen.proto.js` and Prototype instead of jQuery for the Prototype
edition. Vanilla and React integrations likewise need their application bundle
to load from an allowed source. If your application initializes Chosen inside
an inline `<script>`, `script-src 'self'` blocks that script before Chosen runs.
Move it to an allowed external file or give it a nonce or hash permitted by
your policy. Adding jQuery's `.css()` call cannot make a blocked script run.

The repository's [strict-CSP fixtures](../spec/fixtures/csp) exercise jQuery
and Prototype in Chromium and WebKit with no CSP violations. They cover single
and multiple selections and verify that the configured width still applies.
The same browser check loads the Vanilla and React demo pages under their strict
policies and confirms that they mount without violations.
If your page still reports a violation, inspect its directive and target: a
blocked application script, stylesheet URL, or application-supplied inline
style has a different remedy from Chosen's generated markup.
