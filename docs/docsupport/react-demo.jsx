import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chosen } from '../../dist/react/index.mjs';

const options = [
  { value: 'apple', label: 'Apple', dataAttributes: { 'data-family': 'pome' } },
  { value: 'banana', label: 'Banana' },
  { label: 'Citrus', options: [
    { value: 'orange', label: 'Orange' },
    { value: 'lemon', label: 'Lemon', disabled: true },
  ] },
  { value: 'pear', label: 'Pear' },
  { value: 'orchard-42', label: 'Orchard' },
  { value: 'dragon-fruit', label: 'Dragon fruit with a deliberately long option label' },
];
const basketOptions = [...options, { value: 'other', label: 'Other', alwaysVisible: true }];

function Demo() {
  const [fruit, setFruit] = useState('');
  const [basket, setBasket] = useState(['apple']);
  const [singleRtl, setSingleRtl] = useState(false);
  const [singleReadOnly, setSingleReadOnly] = useState(false);
  const [singleDisabled, setSingleDisabled] = useState(false);
  const [slowSearch, setSlowSearch] = useState(false);
  const [basketRtl, setBasketRtl] = useState(false);
  const [showSelected, setShowSelected] = useState(true);
  const [showDisabled, setShowDisabled] = useState(true);
  const [basketReadOnly, setBasketReadOnly] = useState(false);
  const [basketDisabled, setBasketDisabled] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const [lastEvent, setLastEvent] = useState('Try a control above.');

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
        <section id="react-single-example" className="react-demo-card">
          <p className="react-demo-eyebrow">Standalone default</p>
          <h2>Single selection</h2>
          <label htmlFor="react-fruit">Favorite fruit <span aria-hidden="true">*</span></label>
          <Chosen id="react-fruit" name="fruit" options={options} value={fruit}
            onChange={value => { setFruit(value); setAttempted(false); }} required
            allowSingleDeselect
            openOnLabelClick
            displaySelectedValue
            searchInValues
            searchDelay={slowSearch ? 250 : 0}
            placeholder="Choose a fruit" searchPlaceholder="Choose a fruit"
            aria-describedby="react-fruit-help"
            aria-invalid={attempted && !fruit} dir={singleRtl ? 'rtl' : undefined}
            readOnly={singleReadOnly} disabled={singleDisabled} />
          <p id="react-fruit-help" className="react-demo-help">Click the label to open this opt-in single example. Search for “orchard-42” to find Orchard by value, then choose or clear it. The closed control shows the value while results show the label. The form uses the underlying native select.</p>
          <div className="react-demo-switches" role="group" aria-label="Single select examples">
            <label className="react-demo-switch"><input type="checkbox" checked={singleRtl}
              onChange={event => setSingleRtl(event.target.checked)} /> Right-to-left</label>
            <label className="react-demo-switch"><input type="checkbox" checked={singleReadOnly}
              onChange={event => setSingleReadOnly(event.target.checked)} /> Read-only</label>
            <label className="react-demo-switch"><input type="checkbox" checked={singleDisabled}
              onChange={event => setSingleDisabled(event.target.checked)} /> Disabled</label>
            <label className="react-demo-switch"><input type="checkbox" checked={slowSearch}
              onChange={event => setSlowSearch(event.target.checked)} /> Delay search</label>
          </div>
        </section>
        <section id="react-multiple-example" className="react-demo-card react-demo-tailwind">
          <p className="react-demo-eyebrow">Scoped Tailwind-compatible tokens</p>
          <h2>Multiple selection</h2>
          <label htmlFor="react-basket">Fruit basket</label>
          <Chosen id="react-basket" name="basket" options={basketOptions} multiple
            value={basket} onChange={value => { setBasket(value); setLastEvent(`basket: change (${value.join(', ') || 'none'})`); }}
            onShowingDropdown={() => setLastEvent('basket: showing dropdown')}
            onHidingDropdown={() => setLastEvent('basket: hiding dropdown')}
            onSearchUpdated={query => setLastEvent(`basket: search (${query})`)}
            onNoResults={query => setLastEvent(`basket: no results (${query})`)}
            onMaxSelected={() => setLastEvent('basket: maximum selected')}
            maxSelectedOptions={3} maxItemsShown={1}
            createOption persistentCreateOption skipNoResults createOptionText="Add fruit:"
            allowSelectAll allowDeselectAll selectByGroup pasteMultipleValues copyOptionDataAttributes
            multiselectAllowTabToSelect
            includeGroupLabelInSelected
            deselectSelectedResults hideResultsOnSelect={false}
            placeholder="Search fruit" searchPlaceholder="Search fruit"
            dir={basketRtl ? 'rtl' : undefined}
            displaySelectedOptions={showSelected} displayDisabledOptions={showDisabled}
            readOnly={basketReadOnly} disabled={basketDisabled}
            aria-describedby="react-basket-help" />
          <p id="react-basket-help" className="react-demo-help">Choose up to three, paste “Apple, Orange”, or type a new fruit and choose “Add fruit”. “Other” remains visible during search; click Citrus to select its available fruit. Click a selected result or its chip × to remove it; Tab selects the highlighted result and moves focus onward. Try disabled Lemon or the long Dragon fruit label.</p>
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
        <section id="react-season-example" className="react-demo-card">
          <p className="react-demo-eyebrow">Classic search threshold</p>
          <h2>Search-free single selection</h2>
          <label htmlFor="react-season">Season</label>
          <Chosen id="react-season" name="season" options={[
            { value: 'spring', label: 'Spring' },
            { value: 'summer', label: 'Summer' },
            { value: 'autumn', label: 'Autumn' },
            { value: 'winter', label: 'Winter' }
          ]} disableSearchThreshold={4} placeholder="Choose a season"
            width="12rem" dropdownWidth="min(19rem, 90vw)" dropdownPosition="fixed" />
          <p className="react-demo-help">Open the wider floating list and type “w” to highlight Winter. This example uses a 12rem control, an independently sized fixed dropdown, and hides search at four options or fewer.</p>
        </section>
      </div>
      <section className="react-demo-event" aria-labelledby="react-event-heading">
        <h2 id="react-event-heading">Latest basket event</h2>
        <output role="status">{lastEvent}</output>
      </section>
      <div className="react-demo-actions">
        <button type="submit" onClick={() => setAttempted(true)}>Submit form</button>
        <button type="reset">Reset</button>
        <output role="status">{submitted}</output>
      </div>
    </form>
  </div>;
}

createRoot(document.getElementById('react-demo-root')).render(<Demo />);
