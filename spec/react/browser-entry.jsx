import React from 'react';
import { createRoot } from 'react-dom/client';
import { Chosen } from '../../react/Chosen.jsx';

const root = createRoot(document.getElementById('root'));
const options = [
  { value: 'apple', label: 'Apple' },
  { label: 'Fruit', options: [
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry', disabled: true }
  ] }
];

window.chosenChanges = [];
window.mountChosen = (props = {}) => root.render(
  <form id="fruit-form" onSubmit={event => event.preventDefault()}>
    <label htmlFor="fruit-input">Fruit</label>
    <Chosen id="fruit-input" name="fruit" options={options}
      onChange={value => window.chosenChanges.push(value)} {...props} />
    <button type="reset">Reset</button>
  </form>
);
window.unmountChosen = () => root.unmount();
window.mountChosen();
