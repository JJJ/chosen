# Native React Chosen (experimental)

`chosen-jjj/react` is a React component, not a jQuery or Prototype wrapper.
React 18 or newer is a peer dependency. Import the standalone theme separately;
the JavaScript entry has no stylesheet side effect and is safe to import during
server rendering.

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
than enhancing a `<select>`, uses camelCase props, and matches substrings by
default (`searchContains={true}`). Set `splitSearchTerms` to match words in any
order, `groupSearch={false}` to search only option labels, or
`displaySelectedOptions={false}` to hide already selected results in multiple
mode. `open` and `onOpenChange` control the popup; `defaultOpen` is its
uncontrolled initial state. `disabled`, `readOnly`, `dir="rtl"`,
`maxSelectedOptions`, `placeholder`, `searchPlaceholder`, and `noResultsText`
cover common form behavior without framework-specific markup hooks.

## Forms and accessibility

The visible input is a combobox with a listbox popup. Give it a label using a
native `<label htmlFor>` and a matching `id`, or `aria-label` /
`aria-labelledby`. `aria-describedby` connects help or error text; use
`aria-invalid` for an invalid state. Focus remains on the input while arrow keys
move the active result; Enter selects and Escape closes. Multiple selections
have named remove buttons. Results are announced through a polite status node.

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
    dark:[--chosen-border-color:#475569]
    dark:[--chosen-control-background:#0f172a]
    dark:[--chosen-text-color:#f1f5f9]">
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

The initial React API is deliberately smaller than `react-select`: there are no
async loaders, creatable options, virtualization, arbitrary component injection,
or compatibility wrappers. Legacy option names that fit React were retained;
React uses camelCase props and a direct value callback rather than jQuery events.
