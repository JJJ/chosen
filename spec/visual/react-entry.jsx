import React from 'react';
import { createRoot } from 'react-dom/client';
import { Chosen } from '../../react/Chosen.jsx';

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { label: 'Citrus', options: [
    { value: 'orange', label: 'Orange' },
    { value: 'lemon', label: 'Lemon', disabled: true },
  ] },
];

let root;
window.unmountVisualChosen = () => { root?.unmount(); root = undefined; };
window.mountVisualChosen = ({ multiple, state, feature }) => {
  window.unmountVisualChosen();
  root = createRoot(document.getElementById('mount'));
  const featureOptions = feature === 'single-long'
    ? [{ value: 'apple', label: 'A very long selected fruit label that should stay inside a narrow control' }, ...options]
    : options;
  root.render(<Chosen id="visual-select" options={featureOptions} multiple={multiple}
    defaultValue={state === 'invalid' ? (multiple ? [] : '') : (multiple
      ? feature === 'summary' ? ['apple', 'banana', 'orange'] : ['apple', 'banana'] : 'apple')}
    defaultOpen={state === 'open' || feature === 'rtl-multiple'} disabled={state === 'disabled'}
    allowSingleDeselect={feature === 'single-clear'}
    maxItemsShown={feature === 'summary' ? 2 : undefined}
    required={state === 'invalid'} aria-invalid={state === 'invalid' || undefined}
    dir={feature?.startsWith('rtl-') ? 'rtl' : undefined}
    aria-label={`${multiple ? 'Multiple' : 'Single'} choice`} />);
};
