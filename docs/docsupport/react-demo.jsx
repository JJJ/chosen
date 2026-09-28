import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chosen } from '../../dist/react/index.mjs';

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { label: 'Citrus', options: [
    { value: 'orange', label: 'Orange' },
    { value: 'lemon', label: 'Lemon', disabled: true },
  ] },
  { value: 'pear', label: 'Pear' },
  { value: 'orchard-42', label: 'Orchard' },
  { value: 'dragon-fruit', label: 'Dragon fruit with a deliberately long option label' },
];

function Demo() {
  const [fruit, setFruit] = useState('');
  const [basket, setBasket] = useState(['apple']);
  const [singleRtl, setSingleRtl] = useState(false);
  const [singleReadOnly, setSingleReadOnly] = useState(false);
  const [singleDisabled, setSingleDisabled] = useState(false);
  const [basketRtl, setBasketRtl] = useState(false);
  const [showSelected, setShowSelected] = useState(true);
  const [showDisabled, setShowDisabled] = useState(true);
  const [basketReadOnly, setBasketReadOnly] = useState(false);
  const [basketDisabled, setBasketDisabled] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState('');

  return <div className="react-demo">
    <div className="react-demo-intro">
      <p>Try the native React edition without installing anything. These controls are React components, not jQuery wrappers, and keep hidden native selects for form submission and validation.</p>
    </div>
    <form id="react-example-form" onSubmit={event => {
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      setSubmitted(`Submitted: fruit=${values.get('fruit')}; basket=${values.getAll('basket').join(', ') || '(none)'}`);
    }} onReset={() => {
      setFruit('');
      setBasket(['apple']);
      setAttempted(false);
      setSubmitted('');
    }}>
      <div className="react-demo-grid">
        <section className="react-demo-card">
          <p className="react-demo-eyebrow">Standalone default</p>
          <h2>Single selection</h2>
          <label htmlFor="react-fruit">Favorite fruit <span aria-hidden="true">*</span></label>
          <Chosen id="react-fruit" name="fruit" options={options} value={fruit}
            onChange={value => { setFruit(value); setAttempted(false); }} required
            searchInValues
            placeholder="Choose a fruit" searchPlaceholder="Choose a fruit"
            aria-describedby="react-fruit-help"
            aria-invalid={attempted && !fruit} dir={singleRtl ? 'rtl' : undefined}
            readOnly={singleReadOnly} disabled={singleDisabled} />
          <p id="react-fruit-help" className="react-demo-help">Search for “orchard-42” to find Orchard by value, then choose or clear it. The form uses the underlying native select.</p>
          <div className="react-demo-switches" role="group" aria-label="Single select examples">
            <label className="react-demo-switch"><input type="checkbox" checked={singleRtl}
              onChange={event => setSingleRtl(event.target.checked)} /> Right-to-left</label>
            <label className="react-demo-switch"><input type="checkbox" checked={singleReadOnly}
              onChange={event => setSingleReadOnly(event.target.checked)} /> Read-only</label>
            <label className="react-demo-switch"><input type="checkbox" checked={singleDisabled}
              onChange={event => setSingleDisabled(event.target.checked)} /> Disabled</label>
          </div>
        </section>
        <section className="react-demo-card react-demo-tailwind">
          <p className="react-demo-eyebrow">Scoped Tailwind-compatible tokens</p>
          <h2>Multiple selection</h2>
          <label htmlFor="react-basket">Fruit basket</label>
          <Chosen id="react-basket" name="basket" options={options} multiple
            value={basket} onChange={setBasket} maxSelectedOptions={3}
            placeholder="Search fruit" searchPlaceholder="Search fruit"
            dir={basketRtl ? 'rtl' : undefined}
            displaySelectedOptions={showSelected} displayDisabledOptions={showDisabled}
            readOnly={basketReadOnly} disabled={basketDisabled}
            aria-describedby="react-basket-help" />
          <p id="react-basket-help" className="react-demo-help">Choose up to three. Click a selected result or its chip × to remove it; try disabled Lemon or the long Dragon fruit label.</p>
          <div className="react-demo-switches" role="group" aria-label="Multiple select examples">
            <label className="react-demo-switch"><input type="checkbox" checked={basketRtl}
              onChange={event => setBasketRtl(event.target.checked)} /> Right-to-left</label>
            <label className="react-demo-switch"><input type="checkbox" checked={!showSelected}
              onChange={event => setShowSelected(!event.target.checked)} /> Hide selected results</label>
            <label className="react-demo-switch"><input type="checkbox" checked={!showDisabled}
              onChange={event => setShowDisabled(!event.target.checked)} /> Hide disabled results</label>
            <label className="react-demo-switch"><input type="checkbox" checked={basketReadOnly}
              onChange={event => setBasketReadOnly(event.target.checked)} /> Read-only</label>
            <label className="react-demo-switch"><input type="checkbox" checked={basketDisabled}
              onChange={event => setBasketDisabled(event.target.checked)} /> Disabled</label>
          </div>
        </section>
      </div>
      <div className="react-demo-actions">
        <button type="submit" onClick={() => setAttempted(true)}>Submit form</button>
        <button type="reset">Reset</button>
        <output role="status">{submitted}</output>
      </div>
    </form>
  </div>;
}

createRoot(document.getElementById('react-demo-root')).render(<Demo />);
