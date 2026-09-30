import React, {
  forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState
} from 'react';
import { filterOptions, normalizeOptions, preferredPrefixIndex, rangeOptions, resolvePastedChoices, updateSelection } from '../core/index.mjs';

function valuesOf(value, multiple) {
  if (value == null || value === '') return [];
  return (multiple ? (Array.isArray(value) ? value : [value]) : [value]).map(String);
}

function valueFor(values, multiple) {
  return multiple ? values : (values[0] ?? '');
}

function firstEnabled(items, canAct) {
  const firstOption = items.findIndex(item => item.kind === 'option' && canAct(item));
  return firstOption >= 0 ? firstOption : items.findIndex(item => canAct(item));
}

function withCreation(result, query, enabled, persistent) {
  return enabled && query.length && (result.count === 0 || (persistent && !result.exactMatch))
    ? [...result.items, { kind: 'create', index: 'create', label: query }]
    : result.items;
}

export const Chosen = forwardRef(function Chosen({
  options = [], multiple = false, value, defaultValue, onChange,
  openOnLabelClick = multiple,
  open: controlledOpen, defaultOpen = false, onOpenChange,
  onReady, onShowingDropdown, onHidingDropdown,
  onSearch, onSearchUpdated, onNoResults, onNoResultsClear, onMaxSelected,
  name, form, required = false, disabled = false, readOnly = false,
  placeholder, placeholderTextSingle, placeholderTextMultiple, placeholderTextMultipleSelected,
  searchPlaceholder = 'Search options', allowSingleDeselect = false,
  noResultsText = 'No results for:', noResultsTemplate, maxSelectedOptions,
  createOption = false, createOptionText = 'Add Option:',
  persistentCreateOption = false, skipNoResults = false, onCreateOption,
  resultsCountText = count => `${count} result${count === 1 ? '' : 's'} available`,
  inheritOptionClasses = false,
  inheritOptgroupClasses = false,
  copyOptionDataAttributes = false,
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
  deselectSelectedResults = false, shiftSelectRange = false, hideResultsOnSelect = true,
  maxItemsShown = Infinity,
  allowSelectAll = false, allowDeselectAll = false,
  selectByGroup = false,
  pasteMultipleValues = false,
  searchDelay = 0,
  selectAllText = 'Select all', deselectAllText = 'Deselect all',
  moreItemsText = count => `Show ${count} more...`,
  showFewerItemsText = 'Show fewer...',
  displaySelectedValue = false, includeGroupLabelInSelected = false,
  width, dropdownWidth, dropdownPosition = 'absolute',
  mobileFullscreen = false,
  dir, id, className = '', style, 'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid, onBlur, onFocus
}, ref) {
  const generatedId = useId();
  const baseId = id || `chosen-${generatedId.replace(/:/g, '')}`;
  const listId = `${baseId}-list`;
  const statusId = `${baseId}-status`;
  const inputRef = useRef(null);
  const hostRef = useRef(null);
  const controlRef = useRef(null);
  const popupRef = useRef(null);
  const selectRef = useRef(null);
  const rangeAnchorIndex = useRef(null);
  const labelPointerDown = useRef(false);
  const labelForwardedClick = useRef(false);
  const typeahead = useRef('');
  const typeaheadTimer = useRef(null);
  const composing = useRef(false);
  const searchTimer = useRef(null);
  const readySent = useRef(false);
  const lastOpen = useRef(false);
  const lastUpdatedQuery = useRef('');
  const lastNoResultsQuery = useRef(null);
  const [internalValues, setInternalValues] = useState(() => valuesOf(defaultValue, multiple));
  const [createdOptions, setCreatedOptions] = useState([]);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [limitNotice, setLimitNotice] = useState(false);
  const [pendingBackstrokeValue, setPendingBackstrokeValue] = useState(null);
  const [choicesExpanded, setChoicesExpanded] = useState(false);
  const selectedValues = value === undefined ? internalValues : valuesOf(value, multiple);
  const isOpen = controlledOpen === undefined ? internalOpen : controlledOpen;
  const selectedKey = selectedValues.join('\u0000');
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedKey]);
  const entries = useMemo(() => {
    const supplied = normalizeOptions(options);
    const suppliedValues = new Set(supplied.filter(item => item.kind === 'option').map(item => item.value));
    return normalizeOptions([...options, ...createdOptions.filter(item => !suppliedValues.has(String(item.value)))]);
  }, [options, createdOptions]);
  const searchDisabled = !multiple && (disableSearch ||
    (entries.filter(item => item.kind === 'option').length <= disableSearchThreshold && !createOption));
  const searchable = useMemo(() => entries.map(item => item.kind === 'option'
    ? { ...item, selected: selectedSet.has(item.value) }
    : item), [entries, selectedSet]);
  const getResults = text => filterOptions(searchable, text, {
    multiple, searchContains, splitSearchTerms, groupSearch,
    enableSplitWordSearch, caseSensitiveSearch, searchInValues, maxSearchLength,
    minSearchLength, maxShownResults, normalizeSearchText, searchMatcher,
    displaySelectedOptions, displayDisabledOptions
  });
  const results = useMemo(() => getResults(appliedQuery), [searchable, appliedQuery, multiple, searchContains, splitSearchTerms, groupSearch,
    enableSplitWordSearch, caseSensitiveSearch, searchInValues, maxSearchLength,
    minSearchLength, maxShownResults, normalizeSearchText, searchMatcher,
    displaySelectedOptions, displayDisabledOptions]);
  const available = withCreation(results, appliedQuery, createOption, persistentCreateOption);
  const canActOnResult = item => item.kind === 'create' ||
    (item.kind === 'group' && multiple && selectByGroup && !item.disabled) ||
    (item.kind === 'option' && !item.disabled &&
    (!multiple || !selectedSet.has(item.value) || deselectSelectedResults));
  const preferred = preferredPrefixIndex(available, appliedQuery, {
    highlightPrefixMatches, searchContains, searchMatcher, caseSensitiveSearch, normalizeSearchText
  });
  const unmatchedCreation = results.count === 0 ? available.findIndex(item => item.kind === 'create') : -1;
  const active = activeIndex >= 0 && available[activeIndex]
    && canActOnResult(available[activeIndex]) ? activeIndex :
      (unmatchedCreation >= 0 ? unmatchedCreation :
        preferred >= 0 && canActOnResult(available[preferred]) ? preferred : firstEnabled(available, canActOnResult));
  const activeOption = active >= 0 ? available[active] : null;
  const selectedOptions = entries.filter(item => item.kind === 'option' && selectedSet.has(item.value));
  const canBulkSelect = multiple && available.some(item => item.kind === 'option' && !item.pinnedOnly &&
    !item.disabled && !selectedSet.has(item.value));
  const canBulkDeselect = multiple && selectedOptions.some(item => !item.disabled);
  const itemLimit = Number.isInteger(maxItemsShown) && maxItemsShown > 0 ? maxItemsShown : Infinity;
  const hiddenChoiceCount = Math.max(0, selectedOptions.length - itemLimit);
  const showingAllChoices = hiddenChoiceCount > 0 && choicesExpanded;
  useEffect(() => { if (!hiddenChoiceCount) setChoicesExpanded(false); }, [hiddenChoiceCount]);
  const attachNativeSelect = useCallback(node => {
    selectRef.current = node;
    if (!node) return;
    const defaults = new Set(valuesOf(value === undefined ? defaultValue : value, multiple));
    for (const option of node.options) {
      option.defaultSelected = defaults.has(option.value) ||
        (!multiple && option.value === '' && !defaults.size);
    }
  }, [value, defaultValue, selectedKey, entries, multiple]);

  const changeOpen = useCallback((next) => {
    if (disabled || (readOnly && next)) return;
    if (controlledOpen === undefined) setInternalOpen(next);
    if (isOpen !== next) onOpenChange?.(next);
    if (!next) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
      typeahead.current = '';
      clearTimeout(typeaheadTimer.current);
      setPendingBackstrokeValue(null);
      setQuery('');
      setAppliedQuery('');
      setActiveIndex(-1);
    }
  }, [controlledOpen, disabled, isOpen, onOpenChange, readOnly]);

  const commit = useCallback((next, event) => {
    if (value === undefined) setInternalValues(next);
    onChange?.(valueFor(next, multiple), event);
  }, [multiple, onChange, value]);
  const reportLimit = () => { setLimitNotice(true); onMaxSelected?.(); };

  const choose = (option, event) => {
    if (option.kind === 'create') { createNew(option.label, event); return; }
    if (option.kind === 'group') { chooseGroup(option.index, event); return; }
    if (!canActOnResult(option)) return;
    if (multiple && shiftSelectRange && event?.shiftKey) {
      const anchor = available.find(item => item.kind === 'option' && item.index === rangeAnchorIndex.current);
      const range = anchor && selectedSet.has(anchor.value)
        ? rangeOptions(available, anchor.index, option.index) : [];
      if (range.length) {
        const next = [...selectedValues];
        let limitReached = false;
        for (const item of range) {
          if (item.disabled || item.pinnedOnly || next.includes(item.value)) continue;
          if (maxSelectedOptions != null && next.length >= maxSelectedOptions) {
            limitReached = true;
            break;
          }
          next.push(item.value);
        }
        if (next.includes(option.value)) rangeAnchorIndex.current = option.index;
        if (next.length !== selectedValues.length) commit(next, event);
        if (limitReached) reportLimit();
        else setLimitNotice(false);
        setPendingBackstrokeValue(null);
        inputRef.current?.focus();
        return;
      }
    }
    const next = updateSelection(selectedValues, option, {
      multiple, maxSelectedOptions, disabled, readOnly,
      action: multiple && selectedSet.has(option.value) ? 'remove' : 'select'
    });
    if (next.limitReached) reportLimit();
    if (!next.changed) return;
    if (multiple) rangeAnchorIndex.current = next.values.includes(option.value) ? option.index : null;
    setLimitNotice(false);
    setPendingBackstrokeValue(null);
    commit(next.values, event);
    if (!multiple || (hideResultsOnSelect && !event?.metaKey && !event?.ctrlKey)) changeOpen(false);
    else {
      setQuery('');
      setAppliedQuery('');
      setActiveIndex(-1);
    }
    inputRef.current?.focus();
  };

  const createNew = (queryText, event) => {
    if (!createOption || disabled || readOnly) return;
    if (multiple && maxSelectedOptions != null && selectedValues.length >= maxSelectedOptions) {
      reportLimit();
      return;
    }
    const response = onCreateOption?.(queryText, event);
    if (response === false) return;
    const option = response && typeof response === 'object' ? response :
      { value: queryText, label: queryText };
    const createdValue = String(option.value);
    if (entries.some(item => item.kind === 'option' && item.value === createdValue)) return;
    setCreatedOptions(previous => [...previous, option]);
    setLimitNotice(false);
    commit(multiple ? [...selectedValues, createdValue] : [createdValue], event);
    if (!multiple || (hideResultsOnSelect && !event?.metaKey && !event?.ctrlKey)) changeOpen(false);
    else { setQuery(''); setAppliedQuery(''); setActiveIndex(-1); }
    inputRef.current?.focus();
  };

  const remove = (option, event) => {
    const next = updateSelection(selectedValues, option, {
      multiple, action: 'remove', disabled, readOnly
    });
    if (next.changed) { rangeAnchorIndex.current = null; commit(next.values, event); }
    setLimitNotice(false);
    setPendingBackstrokeValue(null);
    inputRef.current?.focus();
  };

  const bulk = (action, event) => {
    if (!multiple || disabled || readOnly) return;
    let next = [...selectedValues];
    let limitReached = false;
    if (action === 'select' && allowSelectAll) {
      for (const item of available) {
        if (item.kind !== 'option' || item.pinnedOnly || item.disabled || next.includes(item.value)) continue;
        if (maxSelectedOptions != null && next.length >= maxSelectedOptions) {
          limitReached = true;
          break;
        }
        next.push(item.value);
      }
    } else if (action === 'deselect' && allowDeselectAll) {
      const enabled = new Set(selectedOptions.filter(item => !item.disabled).map(item => item.value));
      next = next.filter(item => !enabled.has(item));
    }
    if (next.length !== selectedValues.length) commit(next, event);
    if (limitReached) reportLimit();
    else setLimitNotice(false);
    inputRef.current?.focus();
  };

  const chooseGroup = (groupIndex, event) => {
    if (!multiple || !selectByGroup || disabled || readOnly) return;
    const next = [...selectedValues];
    let limitReached = false;
    for (const item of available) {
      if (item.kind !== 'option' || item.groupIndex !== groupIndex || item.disabled ||
        item.pinnedOnly || next.includes(item.value)) continue;
      if (maxSelectedOptions != null && next.length >= maxSelectedOptions) {
        limitReached = true;
        break;
      }
      next.push(item.value);
    }
    if (next.length !== selectedValues.length) commit(next, event);
    if (limitReached) reportLimit();
    else setLimitNotice(false);
    if (next.length !== selectedValues.length && hideResultsOnSelect) changeOpen(false);
    inputRef.current?.focus();
  };

  const paste = event => {
    if (!multiple || !pasteMultipleValues || composing.current || disabled || readOnly) return;
    const pasted = event.clipboardData?.getData('text/plain') || event.clipboardData?.getData('Text');
    if (!pasted) return;
    const input = event.currentTarget;
    const text = input.value.slice(0, input.selectionStart ?? 0) + pasted +
      input.value.slice(input.selectionEnd ?? input.value.length);
    const result = resolvePastedChoices(text, entries, selectedValues, maxSelectedOptions);
    if (!result.handled) return;
    event.preventDefault();
    if (result.changed) commit(result.values, event);
    if (result.limitReached) reportLimit();
    clearTimeout(searchTimer.current);
    searchTimer.current = null;
    setQuery(result.remaining);
    setAppliedQuery(result.remaining);
    setActiveIndex(-1);
    changeOpen(true);
  };

  const queueSearch = text => {
    onSearch?.(text);
    clearTimeout(searchTimer.current);
    const delay = Math.max(0, parseInt(searchDelay, 10) || 0);
    if (delay) {
      searchTimer.current = setTimeout(() => {
        searchTimer.current = null;
        setAppliedQuery(text);
        changeOpen(true);
      }, delay);
    } else {
      setAppliedQuery(text);
      changeOpen(true);
    }
  };

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    open: () => { inputRef.current?.focus(); changeOpen(true); },
    close: () => changeOpen(false)
  }), [changeOpen]);

  useEffect(() => {
    return () => { clearTimeout(typeaheadTimer.current); clearTimeout(searchTimer.current); };
  }, []);

  useEffect(() => {
    if (!readySent.current) { readySent.current = true; onReady?.(); }
  }, [onReady]);

  useEffect(() => {
    if (lastOpen.current === isOpen) return;
    lastOpen.current = isOpen;
    if (isOpen) onShowingDropdown?.();
    else onHidingDropdown?.();
  }, [isOpen, onShowingDropdown, onHidingDropdown]);

  useEffect(() => {
    if (!isOpen || !mobileFullscreen || !window.matchMedia?.('(max-width: 600px) and (pointer: coarse)').matches) return;
    const host = hostRef.current;
    const lock = document.body.__chosenMobileFullscreenLock ??= { count: 0, overflow: document.body.style.overflow };
    lock.count++;
    const syncViewport = () => {
      const viewport = window.visualViewport;
      host.style.setProperty('--chosen-mobile-top', `${viewport?.offsetTop || 0}px`);
      host.style.setProperty('--chosen-mobile-left', `${viewport?.offsetLeft || 0}px`);
      host.style.setProperty('--chosen-mobile-width', `${viewport?.width || window.innerWidth}px`);
      host.style.setProperty('--chosen-mobile-height', `${viewport?.height || window.innerHeight}px`);
    };
    host.classList.add('chosen-react--mobile-fullscreen');
    document.body.style.overflow = 'hidden';
    syncViewport();
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('scroll', syncViewport);
      if (--lock.count === 0) {
        document.body.style.overflow = lock.overflow;
        delete document.body.__chosenMobileFullscreenLock;
      }
      host.classList.remove('chosen-react--mobile-fullscreen');
      for (const property of ['--chosen-mobile-top', '--chosen-mobile-left', '--chosen-mobile-width', '--chosen-mobile-height']) {
        host.style.removeProperty(property);
      }
    };
  }, [isOpen, mobileFullscreen]);

  useEffect(() => {
    if (lastUpdatedQuery.current === appliedQuery) return;
    lastUpdatedQuery.current = appliedQuery;
    onSearchUpdated?.(appliedQuery);
  }, [appliedQuery, onSearchUpdated]);

  useEffect(() => {
    const noResultsQuery = isOpen && appliedQuery && !results.count ? appliedQuery : null;
    if (lastNoResultsQuery.current && lastNoResultsQuery.current !== noResultsQuery) {
      onNoResultsClear?.(lastNoResultsQuery.current);
    }
    if (noResultsQuery && lastNoResultsQuery.current !== noResultsQuery) onNoResults?.(noResultsQuery);
    lastNoResultsQuery.current = noResultsQuery;
  }, [isOpen, appliedQuery, results.count, onNoResults, onNoResultsClear]);

  useEffect(() => {
    const control = selectRef.current;
    const parentForm = control?.form;
    if (!parentForm || value !== undefined) return;
    const reset = () => {
      setInternalValues(valuesOf(defaultValue, multiple));
      setQuery('');
      setAppliedQuery('');
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
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

  useEffect(() => {
    const popup = popupRef.current;
    const control = controlRef.current;
    if (!isOpen || !popup || !control) return;
    if (dropdownPosition !== 'fixed') {
      popup.style.removeProperty('position');
      popup.style.removeProperty('top');
      popup.style.removeProperty('left');
      popup.style.removeProperty('right');
      popup.style.removeProperty('bottom');
      popup.classList.remove('chosen-react__popup--above');
      popup.style.width = dropdownWidth == null ? '' :
        (typeof dropdownWidth === 'number' ? `${dropdownWidth}px` : String(dropdownWidth));
      popup.style.insetInlineEnd = dropdownWidth == null ? '' : 'auto';
      return;
    }
    const position = () => {
      const rect = control.getBoundingClientRect();
      const rtl = window.getComputedStyle(control).direction === 'rtl';
      const above = rect.bottom + popup.offsetHeight > window.innerHeight &&
        rect.top >= popup.offsetHeight;
      popup.style.position = 'fixed';
      popup.style.top = above ? 'auto' : `${rect.bottom}px`;
      popup.style.left = rtl ? 'auto' : `${rect.left}px`;
      popup.style.right = rtl ? `${window.innerWidth - rect.right}px` : 'auto';
      popup.style.insetInlineEnd = 'auto';
      popup.style.bottom = above ? `${window.innerHeight - rect.top}px` : 'auto';
      popup.classList.toggle('chosen-react__popup--above', above);
      popup.style.width = dropdownWidth == null ? `${rect.width}px` :
        (typeof dropdownWidth === 'string' && dropdownWidth.trim().endsWith('%')
          ? `${rect.width * parseFloat(dropdownWidth) / 100}px`
          : (typeof dropdownWidth === 'number' ? `${dropdownWidth}px` : String(dropdownWidth)));
    };
    let frame = null;
    let remaining = 0;
    const settle = () => {
      frame = null;
      position();
      if (--remaining > 0) frame = window.requestAnimationFrame(settle);
    };
    const reposition = () => {
      position();
      remaining = 8;
      if (!frame) frame = window.requestAnimationFrame(settle);
    };
    position();
    document.addEventListener('scroll', reposition, true);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('scroll', reposition, true);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isOpen, dropdownPosition, dropdownWidth, dir, width, style, available.length]);

  const move = (direction, fromEnd = false, items = available, currentIndex = activeIndex) => {
    const enabled = items.map((item, index) => canActOnResult(item) ? index : -1)
      .filter(index => index >= 0);
    if (!enabled.length) return;
    const current = enabled.indexOf(currentIndex);
    const next = fromEnd ? (direction > 0 ? 0 : enabled.length - 1)
      : enabled[(current < 0 ? (direction > 0 ? 0 : enabled.length - 1)
        : (current + direction + enabled.length) % enabled.length)];
    setActiveIndex(fromEnd ? enabled[next] : next);
  };

  const keyDown = (event) => {
    if (disabled) return;
    if (event.key === 'Escape' && searchTimer.current) {
      event.preventDefault();
      changeOpen(false);
      return;
    }
    let freshItems = null;
    if (searchTimer.current && ['Tab', 'Enter', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
      setAppliedQuery(query);
      freshItems = withCreation(getResults(query), query, createOption, persistentCreateOption);
    }
    const currentItems = freshItems || available;
    const freshPreferred = freshItems ? preferredPrefixIndex(freshItems, query, {
      highlightPrefixMatches, searchContains, searchMatcher, caseSensitiveSearch, normalizeSearchText
    }) : -1;
    const freshCreation = freshItems && getResults(query).count === 0
      ? freshItems.findIndex(item => item.kind === 'create') : -1;
    const currentActive = freshItems ? (freshCreation >= 0 ? freshCreation :
      freshPreferred >= 0 && canActOnResult(freshItems[freshPreferred])
        ? freshPreferred : firstEnabled(freshItems, canActOnResult)) : active;
    const currentOption = currentActive >= 0 ? currentItems[currentActive] : null;
    if (multiple && event.key.toLowerCase() === 'a' && (event.metaKey || event.ctrlKey) &&
      !event.altKey && !query) {
      const action = event.shiftKey ? 'deselect' : 'select';
      if ((action === 'select' && allowSelectAll) || (action === 'deselect' && allowDeselectAll)) {
        event.preventDefault();
        bulk(action, event);
        return;
      }
    }
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
      else if (event.key === 'ArrowUp' && currentActive >= 0 &&
        currentActive === firstEnabled(currentItems, canActOnResult) && (!multiple || selectedValues.length)) changeOpen(false);
      else move(event.key === 'ArrowDown' ? 1 : -1, false, currentItems, freshItems ? currentActive : activeIndex);
    } else if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      move(1, true, currentItems, freshItems ? currentActive : activeIndex);
    } else if (event.key === 'End' && isOpen) {
      event.preventDefault();
      move(-1, true, currentItems, freshItems ? currentActive : activeIndex);
    } else if (event.key === 'Enter' && !isOpen && !freshItems && !readOnly) {
      event.preventDefault();
      changeOpen(true);
    } else if (event.key === 'Enter' && (isOpen || freshItems)) {
      event.preventDefault();
      if (currentOption) choose(currentOption, event);
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      changeOpen(false);
    } else if (event.key === 'Tab') {
      if (multiple && (isOpen || freshItems) && multiselectAllowTabToSelect && currentOption) choose(currentOption, event);
      changeOpen(false);
    } else if ((event.key === 'Backspace' || event.key === 'Delete') && !multiple && !isOpen &&
      !query && allowSingleDeselect && selectedValues.length && !readOnly) {
      event.preventDefault();
      commit([], event);
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
  const visiblePlaceholder = multiple && selectedOptions.length && placeholderTextMultipleSelected != null
    ? placeholderTextMultipleSelected : isOpen ? searchPlaceholder : (selectedOptions.length ? '' : closedPlaceholder);
  const status = limitNotice ? `Maximum of ${maxSelectedOptions} selections reached.` :
    isOpen ? String(resultsCountText(available.filter(item => item.kind === 'option' || item.kind === 'create').length)) :
      (selectedOptions.length ? `Selected: ${selectedOptions.map(item => item.label).join(', ')}.` : 'No selection.');

  const renderOption = (item, position) => <div id={`${baseId}-option-${item.index}`} role="option" key={item.index}
    {...(copyOptionDataAttributes ? item.dataAttributes : {})}
    aria-selected={selectedSet.has(item.value)} aria-disabled={item.disabled || undefined}
    className={`chosen-react__option${selectedSet.has(item.value) ? ' chosen-react__option--selected' : ''}${multiple && selectedSet.has(item.value) && deselectSelectedResults ? ' chosen-react__option--deselectable' : ''}${activeOption?.index === item.index ? ' chosen-react__option--active' : ''}${item.disabled ? ' chosen-react__option--disabled' : ''}${item.className ? ` ${item.className}` : ''}`}
    onMouseEnter={() => { if (canActOnResult(item)) setActiveIndex(position); }}
    onMouseDown={event => event.preventDefault()}
    onClick={event => choose(item, event)}>{item.label}</div>;
  const renderCreate = (item, position) => <div id={`${baseId}-option-create`} role="option" key="create"
    aria-selected="false" className={`chosen-react__option chosen-react__option--create${activeOption?.kind === 'create' ? ' chosen-react__option--active' : ''}`}
    onMouseEnter={() => setActiveIndex(position)} onMouseDown={event => event.preventDefault()}
    onClick={event => createNew(item.label, event)}>{createOptionText} {item.label}</div>;
  const renderedResults = [];
  let currentGroup = null;
  let currentGroupPosition = -1;
  let groupOptions = [];
  const flushGroup = () => {
    if (!currentGroup) return;
    const groupEntry = currentGroup;
    const groupPosition = currentGroupPosition;
    const labelId = `${baseId}-group-${groupEntry.index}`;
    renderedResults.push(<div key={groupEntry.index} role="group"
      aria-labelledby={selectByGroup && multiple ? undefined : labelId}
      aria-label={selectByGroup && multiple ? groupEntry.label : undefined}>
      {selectByGroup && multiple ?
        <div id={`${baseId}-option-${groupEntry.index}`} role="option" aria-selected="false"
          className={`chosen-react__group chosen-react__group--selectable${activeOption?.index === groupEntry.index ? ' chosen-react__option--active' : ''}${groupEntry.className ? ` ${groupEntry.className}` : ''}`}
          onMouseEnter={() => setActiveIndex(groupPosition)} onMouseDown={event => event.preventDefault()}
          onClick={event => chooseGroup(groupEntry.index, event)}>{groupEntry.label}</div> :
        <div id={labelId} className={`chosen-react__group${groupEntry.className ? ` ${groupEntry.className}` : ''}`} role="presentation">{groupEntry.label}</div>}
      {groupOptions}
    </div>);
    currentGroup = null;
    currentGroupPosition = -1;
    groupOptions = [];
  };
  for (const [position, item] of available.entries()) {
    if (item.kind === 'group') {
      flushGroup();
      currentGroup = item;
      currentGroupPosition = position;
    } else if (item.kind === 'create') {
      flushGroup();
      renderedResults.push(renderCreate(item, position));
    } else if (currentGroup && item.groupIndex === currentGroup.index) {
      groupOptions.push(renderOption(item, position));
    } else {
      flushGroup();
      renderedResults.push(renderOption(item, position));
    }
  }
  flushGroup();

  return <div ref={hostRef} className={`chosen-react${multiple ? ' chosen-react--multiple' : ''}${isOpen ? ' chosen-react--open' : ''}${dropdownWidth != null || dropdownPosition === 'fixed' ? ' chosen-react--floating' : ''}${searchDisabled ? ' chosen-react--no-search' : ''}${disabled ? ' chosen-react--disabled' : ''}${ariaInvalid === true || ariaInvalid === 'true' ? ' chosen-react--invalid' : ''} ${className}`.trim()} dir={dir} style={width == null || width === false ? style : { ...style, width, minWidth: 0 }}>
    <select ref={attachNativeSelect} className="chosen-react__native" tabIndex={-1} aria-hidden="true"
      name={name} form={form} required={required} disabled={disabled} multiple={multiple}
      value={multiple ? selectedValues : selectedValues[0] ?? ''} onChange={() => {}}
      onInvalid={() => inputRef.current?.focus()}>
      {!multiple && <option value="" />}
      {entries.filter(item => item.kind === 'option').map(item =>
        <option key={item.index} value={item.value} disabled={item.disabled}>{item.label}</option>)}
    </select>
    <div ref={controlRef} className="chosen-react__control" onMouseDown={event => {
      if (event.target !== inputRef.current && !event.target.closest('button') && !disabled) {
        event.preventDefault();
        inputRef.current?.focus();
        changeOpen(true);
      }
    }}>
      {multiple && selectedOptions.map((item, index) => <span hidden={hiddenChoiceCount > 0 && !showingAllChoices && index >= itemLimit} className={`chosen-react__chip${pendingBackstrokeValue === item.value ? ' chosen-react__chip--pending' : ''}${inheritOptionClasses && item.className ? ` ${item.className}` : ''}${inheritOptgroupClasses && item.groupIndex != null && entries[item.groupIndex]?.className ? ` ${entries[item.groupIndex].className}` : ''}`} key={item.index}>
        <span>{selectedDisplay(item)}</span>
        {!disabled && !readOnly && <button type="button" className="chosen-react__remove"
          aria-label={`Remove ${item.label}`} onClick={event => remove(item, event)}>×</button>}
      </span>)}
      {multiple && hiddenChoiceCount > 0 && <button type="button" className="chosen-react__summary"
        aria-expanded={showingAllChoices} onClick={event => {
          event.stopPropagation();
          setChoicesExpanded(!showingAllChoices);
        }}>{showingAllChoices ? showFewerItemsText : moreItemsText(hiddenChoiceCount)}</button>}
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
        }} onKeyDown={keyDown} onPaste={paste}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={event => { composing.current = false; queueSearch(event.currentTarget.value); }}
        onChange={event => { setPendingBackstrokeValue(null); setQuery(event.target.value); setActiveIndex(-1);
          if (!composing.current) queueSearch(event.target.value); }} />
      {!multiple && allowSingleDeselect && selectedValues.length > 0 && !disabled && !readOnly && <button type="button"
        className="chosen-react__clear" aria-label="Clear selection" onClick={event => {
          commit([], event); inputRef.current?.focus();
        }}>×</button>}
      <span className="chosen-react__chevron" aria-hidden="true" />
    </div>
    <span id={statusId} className="chosen-react__sr-only" role="status" aria-live="polite">{status}</span>
    {isOpen && <div ref={popupRef} className="chosen-react__popup">
      {multiple && ((allowSelectAll && canBulkSelect) || (allowDeselectAll && canBulkDeselect)) &&
        <div className="chosen-react__bulk-actions">
          {allowSelectAll && canBulkSelect && <button type="button" className="chosen-react__bulk-action"
            onClick={event => bulk('select', event)}>{selectAllText}</button>}
          {allowDeselectAll && canBulkDeselect && <button type="button" className="chosen-react__bulk-action"
            onClick={event => bulk('deselect', event)}>{deselectAllText}</button>}
        </div>}
      <div id={listId} role="listbox" aria-multiselectable={multiple || undefined} className="chosen-react__list">
        {renderedResults}
      </div>
      {!results.count && !(skipNoResults && available.some(item => item.kind === 'create')) &&
        <div className="chosen-react__empty">{typeof noResultsTemplate === 'string'
          ? noResultsTemplate.split('{search}').map((part, index) =>
            <React.Fragment key={index}>{index > 0 && <span>{appliedQuery}</span>}{part}</React.Fragment>)
          : <>{noResultsText}{appliedQuery ? ` ${appliedQuery}` : ''}</>}</div>}
    </div>}
    {mobileFullscreen && <button type="button" className="chosen-react__mobile-close"
      aria-label="Close options" onMouseDown={event => event.stopPropagation()}
      onClick={() => changeOpen(false)}>Close</button>}
  </div>;
});

export default Chosen;
