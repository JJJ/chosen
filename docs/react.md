# Native React Chosen (experimental)

This component is not yet feature complete with classic Chosen. The [adapter parity inventory](adapter-parity.md) tracks the remaining behavior and default differences.

`chosen-jjj/react` is a React component, not a jQuery or Prototype wrapper.
React 18 or newer is a peer dependency. Import the standalone theme separately;
the JavaScript entry has no stylesheet side effect and is safe to import during
server rendering.

Try the [interactive React demo](https://jjj.github.io/chosen/react.html) for
single and multiple selection, native form submission, right-to-left layout,
and light/dark token themes.

```jsx
import { useState } from 'react';
import { Chosen } from 'chosen-jjj/react';
import 'chosen-jjj/react/styles.css';

const options = [
  { value: 'apple', label: 'Apple' },
  { label: 'Citrus', options: [
    { value: 'orange', label: 'Orange' },
    { value: 'lemon', label: 'Lemon', disabled: true },
  ] },
];

export function Examples() {
  const [fruit, setFruit] = useState('apple');
  const [basket, setBasket] = useState(['orange']);
  return <>
    <Chosen options={options} value={fruit} onChange={setFruit} aria-label="Fruit" />
    <Chosen options={options} multiple value={basket} onChange={setBasket}
      maxSelectedOptions={3} aria-label="Basket" />
    <Chosen options={options} defaultValue="apple" aria-label="Default fruit" />
    <Chosen options={options} multiple defaultValue={['apple', 'orange']}
      aria-label="Default basket" />
  </>;
}
```

`value` makes selection controlled; omit it for uncontrolled selection and use
`defaultValue` for the initial value. Values are strings, matching native form
submission. Multiple selection uses arrays. `onChange` receives the next value
and the triggering React event.

Unlike classic Chosen, this component receives option objects directly rather
than enhancing a `<select>` and uses camelCase props. Search matches word starts
by default, as in classic Chosen; set `searchContains` to match within words,
and `highlightPrefixMatches` to prefer a visible label prefix for Enter without
reordering contains-search results. Set
`enableSplitWordSearch={false}` to require a label-start match,
`caseSensitiveSearch` to preserve case, `searchInValues` to search values,
or `splitSearchTerms` to match words in any order. `normalizeSearchText` and
`searchMatcher` customize matching; the latter receives `(query, normalizedItem)`
and replaces built-in matching. `minSearchLength`, `maxSearchLength`, and
`maxShownResults` bound visible results and matching work. Set
`searchInputType="text"` to use a text input instead of the classic default
search input; the theme uses classes rather than input-type selectors. Set
`searchDelay={250}` to debounce filtering on large lists; Enter and navigation
keys flush pending text before acting. It defaults to zero. Set
`disableSearch` to hide search on a single select, or set
`disableSearchThreshold` to hide it when the option count is at or below the
threshold. Prefix typing still moves through open results. Set
`resultsCountText={count => count + ' choices'}` to localize the live result
count. `noResultsText` is used literally before the query, with one space.
Set `className` on option or group data to style result rows; set
`inheritOptionClasses` to copy option classes to selected chips too. Set
`dataAttributes` on an option and enable `copyOptionDataAttributes` to add its
safe `data-*` keys to the result row. This is React's equivalent of classic
`parser_config: {copy_data_attributes: true}`; it does not parse a source select.
Set
`groupSearch={false}` to search only option labels, or
`displaySelectedOptions={false}` to hide already selected results in multiple
mode, or `displayDisabledOptions={false}` to hide disabled results without
removing them from the underlying native select. When selected results are
visible, selected rows are inert by default and have a check mark. Set
`deselectSelectedResults` to remove a selected row by click or Enter; its
remove mark then indicates this action. The chip's remove button always works.
`hideResultsOnSelect` defaults to `true` for multiple choices; set it to
`false` to keep the dropdown open. Ctrl or Command selection also keeps it open.
Set `maxItemsShown` to a positive integer to show only that many selected
chips until the summary button is expanded. `moreItemsText={count => text}`
and `showFewerItemsText` customize its copy. The native selection and form
values remain intact.
Set `allowSelectAll` to select enabled results matching the current filter,
up to `maxSelectedOptions`. `allowDeselectAll` removes enabled selections even
outside the current filter. Both default to `false`; customize the action labels
with `selectAllText` and `deselectAllText`. Ctrl/Command+A and
Ctrl/Command+Shift+A invoke the enabled actions when search is empty.
Set `pasteMultipleValues` to accept comma, semicolon, tab, or newline-separated
existing values or unique labels pasted into multiple search. Disabled and
hidden options are skipped, the selection limit applies, and unmatched tokens
remain in the search field. It defaults to `false`.
`displaySelectedValue` shows option values in the closed control and chips;
`includeGroupLabelInSelected` prefixes the group name. Both default to `false`,
and result rows continue to show option labels. `open` and
`onOpenChange` control the popup; `defaultOpen` is its
uncontrolled initial state. `disabled`, `readOnly`, `dir="rtl"`,
`maxSelectedOptions`, `placeholder`, `placeholderTextSingle`,
`placeholderTextMultiple`, `searchPlaceholder`, and `noResultsText` cover common
form behavior without framework-specific markup hooks. Single clearing is
opt-in with `allowSingleDeselect`, matching classic Chosen; the demo enables it.
For multiple selects, `backspaceDeletesChoices` defaults to `true` and
`multiselectAllowTabToSelect` defaults to `false`. Enabling the latter selects
the highlighted result on Tab and still moves focus to the next control.
Set `singleBackstrokeDelete={false}` to focus the final chip with the first
Backspace and remove it with the second.
`openOnLabelClick` defaults to `true` for multiple selects and `false` for
single selects; override it to choose whether the associated label opens the
popup or only focuses the input. The single-select demo opts into opening.
Options under a group heading are indented on the inline start side; override
`--chosen-group-option-indent` to adjust that spacing in either direction.

## Forms and accessibility

The visible input is a combobox with a listbox popup. Give it a label using a
native `<label htmlFor>` and a matching `id`, or `aria-label` /
`aria-labelledby`. `aria-describedby` connects help or error text; use
`aria-invalid={true}` for an invalid state. The opt-in invalid border uses
`--chosen-invalid-border-color` (`#dc2626` by default); native validation alone
does not change the default theme. Pressing an associated label keeps an open
dropdown visible. Focus remains on the input while arrow keys
move the active result; Enter selects and Escape closes. Multiple selections
have named remove buttons. Results are announced through a polite status node.
The highlighted result is the current keyboard or pointer target; selected
results have a separate background and check mark. Moving the pointer to a
different result updates the active target, so only one row is highlighted.

Chosen renders a visually hidden native `<select>` for `name`, `form`,
`required`, `disabled`, form data, and browser validation. It is not a separate
tab stop. An uncontrolled value resets to `defaultValue` when its form resets.
React `onChange` is called for user selection and removal; form reset does not
emit it. Controlled values remain the owner's responsibility during reset.
When native required-field validation fails, focus moves to the visible
combobox instead of staying on the visually hidden select.

```jsx
export function RegistrationForm() {
  return <form id="registration">
    <label htmlFor="favorite-fruit">Favorite fruit</label>
    <Chosen id="favorite-fruit" name="favoriteFruit" options={options}
      required aria-describedby="fruit-help" />
    <p id="fruit-help">Choose one fruit.</p>
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  </form>;
}
```

## Tailwind theme

The standalone theme works without Tailwind. It uses the same `--chosen-*`
custom properties as the legacy theme; define them on a wrapper, or use
Tailwind utilities for sizing, spacing, and layout. No Tailwind runtime
dependency is loaded by the component.

```jsx
export function TailwindTheme() {
  return <div className="max-w-sm [--chosen-border-color:#cbd5e1]
    [--chosen-control-background:#fff] [--chosen-focus-ring-color:#4f46e5]
    [--chosen-highlight-background:#4f46e5]
    dark:[--chosen-border-color:#475569]
    dark:[--chosen-control-background:#0f172a]
    dark:[--chosen-text-color:#f1f5f9]
    dark:[--chosen-group-color:#cbd5e1]
    dark:[--chosen-muted-color:#cbd5e1]
    dark:[--chosen-disabled-opacity:1]">
    <Chosen options={options} multiple aria-label="Fruit" />
  </div>;
}
```

## Server rendering and refs

The component uses React `useId` for stable combobox/listbox IDs. Render and
hydrate the same props and options on server and client. Import the stylesheet
through your framework's CSS pipeline. Browser globals are only accessed after
mount. `ref` exposes `focus()`, `blur()`, `open()`, and `close()`.

```jsx
// Server: renderToString(<Chosen options={options} aria-label="Fruit" />)
// Client: hydrateRoot(node, <Chosen options={options} aria-label="Fruit" />)
```

The React API still lacks several classic Chosen features, including option
creation and bulk actions; see the parity inventory. It does not aim to copy
unrelated `react-select` features such as async loaders, virtualization, or
arbitrary component injection. React uses camelCase props and a direct value
callback rather than jQuery events.
