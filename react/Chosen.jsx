import React, {
  forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState
} from 'react';
import { filterOptions, normalizeOptions, preferredPrefixIndex, updateSelection } from '../core/index.mjs';

function valuesOf(value, multiple) {
  if (value == null || value === '') return [];
  return (multiple ? (Array.isArray(value) ? value : [value]) : [value]).map(String);
}

function valueFor(values, multiple) {
  return multiple ? values : (values[0] ?? '');
}

function firstEnabled(items, canAct) {
  return items.findIndex(item => item.kind === 'option' && canAct(item));
}

export const Chosen = forwardRef(function Chosen({
  options = [], multiple = false, value, defaultValue, onChange,
  openOnLabelClick = multiple,
  open: controlledOpen, defaultOpen = false, onOpenChange,
  name, form, required = false, disabled = false, readOnly = false,
  placeholder, placeholderTextSingle, placeholderTextMultiple,
  searchPlaceholder = 'Search options', allowSingleDeselect = false,
  noResultsText = 'No results for:', maxSelectedOptions,
  resultsCountText = count => `${count} result${count === 1 ? '' : 's'} available`,
  inheritOptionClasses = false,
  backspaceDeletesChoices = true, multiselectAllowTabToSelect = false,
  singleBackstrokeDelete = true,
  searchInputType = 'search',
  disableSearch = false, disableSearchThreshold = 0,
  searchContains = false, splitSearchTerms = false, groupSearch = true,
  highlightPrefixMatches = false,
  enableSplitWordSearch = true, caseSensitiveSearch = false, searchInValues = false,
  maxSearchLength = 1000, minSearchLength = 0, maxShownResults,
  normalizeSearchText, searchMatcher,
  displaySelectedOptions = true, displayDisabledOptions = true,
  deselectSelectedResults = false, hideResultsOnSelect = true,
  displaySelectedValue = false, includeGroupLabelInSelected = false,
  dir, id, className = '', style, 'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid, onBlur, onFocus
}, ref) {
  const generatedId = useId();
  const baseId = id || `chosen-${generatedId.replace(/:/g, '')}`;
  const listId = `${baseId}-list`;
  const statusId = `${baseId}-status`;
  const inputRef = useRef(null);
  const selectRef = useRef(null);
  const labelPointerDown = useRef(false);
  const labelForwardedClick = useRef(false);
  const typeahead = useRef('');
  const typeaheadTimer = useRef(null);
  const [internalValues, setInternalValues] = useState(() => valuesOf(defaultValue, multiple));
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [limitNotice, setLimitNotice] = useState(false);
  const [pendingBackstrokeValue, setPendingBackstrokeValue] = useState(null);
  const selectedValues = value === undefined ? internalValues : valuesOf(value, multiple);
  const isOpen = controlledOpen === undefined ? internalOpen : controlledOpen;
  const selectedKey = selectedValues.join('\u0000');
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedKey]);
  const entries = useMemo(() => normalizeOptions(options), [options]);
  const searchDisabled = !multiple && (disableSearch ||
    entries.filter(item => item.kind === 'option').length <= disableSearchThreshold);
  const searchable = useMemo(() => entries.map(item => item.kind === 'option'
    ? { ...item, selected: selectedSet.has(item.value) }
    : item), [entries, selectedSet]);
  const results = useMemo(() => filterOptions(searchable, query, {
    multiple, searchContains, splitSearchTerms, groupSearch,
    enableSplitWordSearch, caseSensitiveSearch, searchInValues, maxSearchLength,
    minSearchLength, maxShownResults, normalizeSearchText, searchMatcher,
    displaySelectedOptions, displayDisabledOptions
  }), [searchable, query, multiple, searchContains, splitSearchTerms, groupSearch,
    enableSplitWordSearch, caseSensitiveSearch, searchInValues, maxSearchLength,
    minSearchLength, maxShownResults, normalizeSearchText, searchMatcher,
    displaySelectedOptions, displayDisabledOptions]);
  const available = results.items;
  const canActOnResult = item => !item.disabled &&
    (!multiple || !selectedSet.has(item.value) || deselectSelectedResults);
  const preferred = preferredPrefixIndex(available, query, {
    highlightPrefixMatches, searchContains, searchMatcher, caseSensitiveSearch, normalizeSearchText
  });
  const active = activeIndex >= 0 && available[activeIndex]?.kind === 'option'
    && canActOnResult(available[activeIndex]) ? activeIndex :
      (preferred >= 0 && canActOnResult(available[preferred]) ? preferred : firstEnabled(available, canActOnResult));
  const activeOption = active >= 0 ? available[active] : null;
  const selectedOptions = entries.filter(item => item.kind === 'option' && selectedSet.has(item.value));
  const attachNativeSelect = useCallback(node => {
    selectRef.current = node;
    if (value === undefined || !node) return;
    for (const option of node.options) {
      option.defaultSelected = selectedSet.has(option.value) ||
        (!multiple && option.value === '' && !selectedValues.length);
    }
  }, [value, selectedKey, entries, multiple]);

  const changeOpen = useCallback((next) => {
    if (disabled || (readOnly && next)) return;
    if (controlledOpen === undefined) setInternalOpen(next);
    if (isOpen !== next) onOpenChange?.(next);
    if (!next) {
      typeahead.current = '';
      clearTimeout(typeaheadTimer.current);
      setPendingBackstrokeValue(null);
      setQuery('');
      setActiveIndex(-1);
    }
  }, [controlledOpen, disabled, isOpen, onOpenChange, readOnly]);

  const commit = useCallback((next, event) => {
    if (value === undefined) setInternalValues(next);
    onChange?.(valueFor(next, multiple), event);
  }, [multiple, onChange, value]);

  const choose = (option, event) => {
    if (!canActOnResult(option)) return;
    const next = updateSelection(selectedValues, option, {
      multiple, maxSelectedOptions, disabled, readOnly,
      action: multiple && selectedSet.has(option.value) ? 'remove' : 'select'
    });
    if (next.limitReached) setLimitNotice(true);
    if (!next.changed) return;
    setLimitNotice(false);
    setPendingBackstrokeValue(null);
    commit(next.values, event);
    if (!multiple || (hideResultsOnSelect && !event?.metaKey && !event?.ctrlKey)) changeOpen(false);
    else {
      setQuery('');
      setActiveIndex(-1);
    }
    inputRef.current?.focus();
  };

  const remove = (option, event) => {
    const next = updateSelection(selectedValues, option, {
      multiple, action: 'remove', disabled, readOnly
    });
    if (next.changed) commit(next.values, event);
    setLimitNotice(false);
    setPendingBackstrokeValue(null);
    inputRef.current?.focus();
  };

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    open: () => { inputRef.current?.focus(); changeOpen(true); },
    close: () => changeOpen(false)
  }), [changeOpen]);

  useEffect(() => {
    return () => clearTimeout(typeaheadTimer.current);
  }, []);

  useEffect(() => {
    const control = selectRef.current;
    const parentForm = control?.form;
    if (!parentForm || value !== undefined) return;
    const reset = () => {
      setInternalValues(valuesOf(defaultValue, multiple));
      setQuery('');
      setActiveIndex(-1);
      if (controlledOpen === undefined) setInternalOpen(false);
    };
    parentForm.addEventListener('reset', reset);
    return () => parentForm.removeEventListener('reset', reset);
  }, [defaultValue, multiple, value, controlledOpen, form]);

  useEffect(() => {
    let releaseTimer;
    let forwardedClickTimer;
    const pointerDown = event => {
      clearTimeout(releaseTimer);
      const label = event.target?.closest?.('label');
      labelPointerDown.current = label?.control === inputRef.current;
    };
    const pointerEnd = () => {
      if (!labelPointerDown.current) return;
      labelPointerDown.current = false;
      releaseTimer = setTimeout(() => {
        const host = inputRef.current?.parentElement?.parentElement;
        if (host && !host.contains(document.activeElement)) changeOpen(false);
      }, 0);
    };
    document.addEventListener('pointerdown', pointerDown, true);
    document.addEventListener('pointerup', pointerEnd, true);
    document.addEventListener('pointercancel', pointerEnd, true);
    const labelClick = event => {
      if (event.target?.closest?.('a, button, input, select, textarea')) return;
      const label = event.target?.closest?.('label');
      if (label?.control !== inputRef.current) return;
      labelForwardedClick.current = true;
      clearTimeout(forwardedClickTimer);
      forwardedClickTimer = setTimeout(() => { labelForwardedClick.current = false; }, 0);
      if (!openOnLabelClick) return;
      inputRef.current?.focus();
      changeOpen(true);
    };
    document.addEventListener('click', labelClick, true);
    return () => {
      clearTimeout(releaseTimer);
      clearTimeout(forwardedClickTimer);
      document.removeEventListener('pointerdown', pointerDown, true);
      document.removeEventListener('pointerup', pointerEnd, true);
      document.removeEventListener('pointercancel', pointerEnd, true);
      document.removeEventListener('click', labelClick, true);
    };
  }, [changeOpen, openOnLabelClick]);

  useEffect(() => {
    if (!isOpen || !activeOption) return;
    document.getElementById(`${baseId}-option-${activeOption.index}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, activeOption?.index, baseId]);

  const move = (direction, fromEnd = false) => {
    const enabled = available.map((item, index) => item.kind === 'option' && canActOnResult(item) ? index : -1)
      .filter(index => index >= 0);
    if (!enabled.length) return;
    const current = enabled.indexOf(activeIndex);
    const next = fromEnd ? (direction > 0 ? 0 : enabled.length - 1)
      : enabled[(current < 0 ? (direction > 0 ? 0 : enabled.length - 1)
        : (current + direction + enabled.length) % enabled.length)];
    setActiveIndex(fromEnd ? enabled[next] : next);
  };

  const keyDown = (event) => {
    if (disabled) return;
    if (searchDisabled && isOpen && event.key.length === 1 && /\S/.test(event.key) &&
      !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const find = text => available.findIndex(item => {
        if (item.kind !== 'option' || item.disabled) return false;
        const label = String(normalizeSearchText?.(item.label) ?? item.label);
        const prefix = String(normalizeSearchText?.(text) ?? text);
        return caseSensitiveSearch ? label.startsWith(prefix) :
          label.toLowerCase().startsWith(prefix.toLowerCase());
      });
      let queryText = typeahead.current + event.key;
      let index = find(queryText);
      if (index < 0) { queryText = event.key; index = find(queryText); }
      typeahead.current = queryText;
      clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = setTimeout(() => { typeahead.current = ''; }, 500);
      if (index >= 0) setActiveIndex(index);
      return;
    }
    if (event.key !== 'Backspace') setPendingBackstrokeValue(null);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) changeOpen(true);
      else move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      move(1, true);
    } else if (event.key === 'End' && isOpen) {
      event.preventDefault();
      move(-1, true);
    } else if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      if (activeOption) choose(activeOption, event);
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      changeOpen(false);
    } else if (event.key === 'Tab') {
      if (multiple && isOpen && multiselectAllowTabToSelect && activeOption) choose(activeOption, event);
      changeOpen(false);
    } else if (event.key === 'Backspace' && multiple && backspaceDeletesChoices && !query && selectedOptions.length) {
      event.preventDefault();
      const last = selectedOptions[selectedOptions.length - 1];
      if (singleBackstrokeDelete || pendingBackstrokeValue === last.value) remove(last, event);
      else setPendingBackstrokeValue(last.value);
    }
  };

  const onInputBlur = (event) => {
    if (labelPointerDown.current) return;
    if (!event.currentTarget.parentElement?.parentElement?.contains(event.relatedTarget)) changeOpen(false);
    onBlur?.(event);
  };
  const selectedDisplay = item => <>
    {includeGroupLabelInSelected && item.groupLabel != null &&
      <span className="chosen-react__group-name">{item.groupLabel}: </span>}
    {displaySelectedValue ? item.value : item.label}
  </>;
  const showSingleValue = !multiple && !!selectedOptions[0]?.label && (searchDisabled || (!isOpen && !query));
  const closedPlaceholder = (multiple ? placeholderTextMultiple : placeholderTextSingle) ??
    placeholder ?? (multiple ? 'Select Some Options' : 'Select an Option');
  const visiblePlaceholder = isOpen ? searchPlaceholder : (selectedOptions.length ? '' : closedPlaceholder);
  const status = limitNotice ? `Maximum of ${maxSelectedOptions} selections reached.` :
    isOpen ? String(resultsCountText(results.count)) :
      (selectedOptions.length ? `Selected: ${selectedOptions.map(item => item.label).join(', ')}.` : 'No selection.');

  const renderOption = (item, position) => <div id={`${baseId}-option-${item.index}`} role="option" key={item.index}
    aria-selected={selectedSet.has(item.value)} aria-disabled={item.disabled || undefined}
    className={`chosen-react__option${selectedSet.has(item.value) ? ' chosen-react__option--selected' : ''}${multiple && selectedSet.has(item.value) && deselectSelectedResults ? ' chosen-react__option--deselectable' : ''}${activeOption?.index === item.index ? ' chosen-react__option--active' : ''}${item.disabled ? ' chosen-react__option--disabled' : ''}${item.className ? ` ${item.className}` : ''}`}
    onMouseEnter={() => { if (canActOnResult(item)) setActiveIndex(position); }}
    onMouseDown={event => event.preventDefault()}
    onClick={event => choose(item, event)}>{item.label}</div>;
  const renderedResults = [];
  let currentGroup = null;
  let groupOptions = [];
  const flushGroup = () => {
    if (!currentGroup) return;
    const labelId = `${baseId}-group-${currentGroup.index}`;
    renderedResults.push(<div key={currentGroup.index} role="group" aria-labelledby={labelId}>
      <div id={labelId} className={`chosen-react__group${currentGroup.className ? ` ${currentGroup.className}` : ''}`} role="presentation">{currentGroup.label}</div>
      {groupOptions}
    </div>);
    currentGroup = null;
    groupOptions = [];
  };
  for (const [position, item] of available.entries()) {
    if (item.kind === 'group') {
      flushGroup();
      currentGroup = item;
    } else if (currentGroup && item.groupIndex === currentGroup.index) {
      groupOptions.push(renderOption(item, position));
    } else {
      flushGroup();
      renderedResults.push(renderOption(item, position));
    }
  }
  flushGroup();

  return <div className={`chosen-react${multiple ? ' chosen-react--multiple' : ''}${isOpen ? ' chosen-react--open' : ''}${searchDisabled ? ' chosen-react--no-search' : ''}${disabled ? ' chosen-react--disabled' : ''}${ariaInvalid === true || ariaInvalid === 'true' ? ' chosen-react--invalid' : ''} ${className}`.trim()} dir={dir} style={style}>
    <select ref={attachNativeSelect} className="chosen-react__native" tabIndex={-1} aria-hidden="true"
      name={name} form={form} required={required} disabled={disabled} multiple={multiple}
      value={multiple ? selectedValues : selectedValues[0] ?? ''} onChange={() => {}}
      onInvalid={() => inputRef.current?.focus()}>
      {!multiple && <option value="" />}
      {entries.filter(item => item.kind === 'option').map(item =>
        <option key={item.index} value={item.value} disabled={item.disabled}>{item.label}</option>)}
    </select>
    <div className="chosen-react__control" onMouseDown={event => {
      if (event.target !== inputRef.current && !event.target.closest('button') && !disabled) {
        event.preventDefault();
        inputRef.current?.focus();
        changeOpen(true);
      }
    }}>
      {multiple && selectedOptions.map(item => <span className={`chosen-react__chip${pendingBackstrokeValue === item.value ? ' chosen-react__chip--pending' : ''}${inheritOptionClasses && item.className ? ` ${item.className}` : ''}`} key={item.index}>
        <span>{selectedDisplay(item)}</span>
        {!disabled && !readOnly && <button type="button" className="chosen-react__remove"
          aria-label={`Remove ${item.label}`} onClick={event => remove(item, event)}>×</button>}
      </span>)}
      {showSingleValue && <span className="chosen-react__value" aria-hidden="true">{selectedDisplay(selectedOptions[0])}</span>}
      {searchDisabled && !showSingleValue && <span className="chosen-react__value chosen-react__value--placeholder" aria-hidden="true">{closedPlaceholder}</span>}
      <input ref={inputRef} id={baseId}
        className={`chosen-react__input${showSingleValue ? ' chosen-react__input--has-value' : ''}`}
        type={searchInputType === 'text' ? 'text' : 'search'}
        role="combobox" aria-autocomplete={searchDisabled ? 'none' : 'list'} aria-haspopup="listbox"
        aria-expanded={isOpen} aria-controls={listId}
        aria-activedescendant={isOpen && activeOption ? `${baseId}-option-${activeOption.index}` : undefined}
        aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy ? `${ariaDescribedBy} ${statusId}` : statusId}
        aria-invalid={ariaInvalid} aria-required={required || undefined}
        placeholder={visiblePlaceholder} value={query} disabled={disabled} readOnly={readOnly || searchDisabled}
        autoComplete="off" onFocus={event => { onFocus?.(event); }}
        onBlur={onInputBlur} onClick={() => {
          if (labelForwardedClick.current) { labelForwardedClick.current = false; return; }
          changeOpen(true);
        }} onKeyDown={keyDown}
        onChange={event => { setPendingBackstrokeValue(null); setQuery(event.target.value); setActiveIndex(-1); changeOpen(true); }} />
      {!multiple && allowSingleDeselect && selectedValues.length > 0 && !disabled && !readOnly && <button type="button"
        className="chosen-react__clear" aria-label="Clear selection" onClick={event => {
          commit([], event); inputRef.current?.focus();
        }}>×</button>}
      <span className="chosen-react__chevron" aria-hidden="true" />
    </div>
    <span id={statusId} className="chosen-react__sr-only" role="status" aria-live="polite">{status}</span>
    {isOpen && <div className="chosen-react__popup">
      <div id={listId} role="listbox" aria-multiselectable={multiple || undefined} className="chosen-react__list">
        {renderedResults}
      </div>
      {!results.count && <div className="chosen-react__empty">{noResultsText}{query ? ` ${query}` : ''}</div>}
    </div>}
  </div>;
});

export default Chosen;
