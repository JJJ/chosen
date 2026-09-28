import { filterOptions, normalizeOptions, preferredPrefixIndex } from '../core/index.mjs';

let nextId = 0;
const instances = new WeakMap();

function optionTree(select) {
  const entries = [];
  const nodes = [];
  for (const child of select.children) {
    if (child.tagName === 'OPTGROUP') {
      entries.push({ label: child.label, disabled: child.disabled, hidden: child.hidden,
        className: child.className,
        options: Array.from(child.children, option => ({ value: option.value, label: option.text,
          selected: option.selected, disabled: option.disabled, hidden: option.hidden,
          className: option.className,
          searchText: option.getAttribute('data-search-text') || '' })) });
      nodes.push(null, ...child.children);
    } else if (child.tagName === 'OPTION') {
      entries.push({ value: child.value, label: child.text, selected: child.selected,
        disabled: child.disabled, hidden: child.hidden,
        className: child.className,
        searchText: child.getAttribute('data-search-text') || '' });
      nodes.push(child);
    }
  }
  return { entries: normalizeOptions(entries), nodes };
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function emit(select, name, chosen, extra = {}) {
  select.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { chosen, ...extra } }));
}

export class Chosen {
  constructor(select, options = {}) {
    if (!(select instanceof HTMLSelectElement)) throw new TypeError('Chosen needs a select element');
    if (instances.has(select)) throw new Error('Chosen is already initialized on this select');
    this.select = select;
    this.options = { search_contains: false, split_search_terms: false, group_search: true,
      enable_split_word_search: true, case_sensitive_search: false, search_in_values: false,
      highlight_prefix_matches: false,
      backspace_deletes_choices: true, multiselect_allow_tab_to_select: false,
      search_input_type: 'search',
      max_search_length: 1000,
      display_selected_options: true, display_disabled_options: true,
      display_selected_value: false, include_group_label_in_selected: false,
      rtl: false,
      inherit_select_classes: false,
      inherit_option_classes: false,
      placeholder_text: select.multiple ? 'Select Some Options' : 'Select an Option',
      no_results_text: 'No results for:',
      results_count_text: count => `${count} result${count === 1 ? '' : 's'} available`,
      allow_single_deselect: false, ...options };
    this.id = `${select.id || `chosen-native-${++nextId}`}-native`;
    this.multiple = select.multiple;
    this.opened = false;
    this.activeIndex = -1;
    this.entries = [];
    this.nodes = [];
    this.available = [];
    this.originalTabIndex = select.getAttribute('tabindex');
    this.originalAriaHidden = select.getAttribute('aria-hidden');
    this.hadSelectClass = select.classList.contains('chosen-native__select');
    this.form = select.form;
    this.onNativeChange = () => this.update();
    this.onUpdate = () => this.update();
    this.onReset = () => setTimeout(() => { if (!this.destroyed) { this.close(); this.update(); } }, 0);
    this.onInvalid = () => this.input.focus();
    this.onOutsidePointer = event => {
      if (this.host.contains(event.target)) return;
      if (Array.from(this.select.labels || []).some(label => label.contains(event.target))) return;
      this.close();
    };
    this.onKeyDown = event => this.keyDown(event);
    this.onInput = () => { this.activeIndex = -1; this.open(); this.renderResults(); };
    this.onControlPointer = event => {
      if (event.target === this.input || event.target.closest('button')) return;
      if (event.pointerType === 'mouse') event.preventDefault();
      this.input.focus();
      this.open();
    };

    this.host = element('div', `chosen-native${this.multiple ? ' chosen-native--multiple' : ''}`);
    this.inheritedClasses = new Set();
    this.control = element('div', 'chosen-native__control');
    this.chips = element('span', 'chosen-native__chips');
    this.value = element('span', 'chosen-native__value');
    this.value.setAttribute('aria-hidden', 'true');
    this.input = element('input', 'chosen-native__input');
    this.input.type = this.options.search_input_type === 'text' ? 'text' : 'search';
    this.input.autocomplete = 'off';
    this.input.id = this.id;
    this.input.setAttribute('role', 'combobox');
    this.input.setAttribute('aria-autocomplete', 'list');
    this.input.setAttribute('aria-haspopup', 'listbox');
    this.input.setAttribute('aria-controls', `${this.id}-list`);
    this.input.setAttribute('aria-expanded', 'false');
    this.input.setAttribute('aria-label', this.options.aria_label ||
      select.getAttribute('aria-label') || Array.from(select.labels || []).map(label => label.textContent.trim()).join(' ') || 'Choose an option');
    this.input.setAttribute('aria-describedby', `${this.id}-status`);
    this.clearButton = element('button', 'chosen-native__clear', '×');
    this.clearButton.type = 'button';
    this.clearButton.setAttribute('aria-label', 'Clear selection');
    this.clearButton.addEventListener('click', () => { this.clear(); this.input.focus(); });
    this.chevron = element('span', 'chosen-native__chevron');
    this.chevron.setAttribute('aria-hidden', 'true');
    this.control.append(this.chips, this.value, this.input, this.clearButton, this.chevron);
    this.status = element('span', 'chosen-native__sr-only');
    this.status.id = `${this.id}-status`;
    this.status.setAttribute('role', 'status');
    this.status.setAttribute('aria-live', 'polite');
    this.popup = element('div', 'chosen-native__popup');
    this.popup.hidden = true;
    this.list = element('div', 'chosen-native__list');
    this.list.id = `${this.id}-list`;
    this.list.setAttribute('role', 'listbox');
    if (this.multiple) this.list.setAttribute('aria-multiselectable', 'true');
    this.empty = element('div', 'chosen-native__empty');
    this.popup.append(this.list, this.empty);
    this.host.append(this.control, this.status, this.popup);
    select.after(this.host);
    select.classList.add('chosen-native__select');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');
    this.input.addEventListener('keydown', this.onKeyDown);
    this.input.addEventListener('input', this.onInput);
    this.input.addEventListener('click', () => this.open());
    this.control.addEventListener('pointerdown', this.onControlPointer);
    select.addEventListener('change', this.onNativeChange);
    select.addEventListener('chosen:updated', this.onUpdate);
    select.addEventListener('invalid', this.onInvalid);
    select.addEventListener('focus', this.onInvalid);
    this.form?.addEventListener('reset', this.onReset);
    document.addEventListener('pointerdown', this.onOutsidePointer, true);
    instances.set(select, this);
    this.update();
    emit(select, 'chosen:ready', this);
  }

  update() {
    if (this.destroyed) return;
    for (const name of this.inheritedClasses) this.host.classList.remove(name);
    this.inheritedClasses.clear();
    for (const name of this.select.classList) {
      if (name === 'chosen-rtl' || (this.options.inherit_select_classes && !name.startsWith('chosen-native'))) {
        this.host.classList.add(name);
        this.inheritedClasses.add(name);
      }
    }
    const direction = this.options.rtl || this.select.classList.contains('chosen-rtl')
      ? 'rtl' : this.select.dir;
    if (direction) this.host.dir = direction;
    else this.host.removeAttribute('dir');
    const parsed = optionTree(this.select);
    this.entries = parsed.entries;
    this.nodes = parsed.nodes;
    this.input.disabled = this.select.disabled;
    this.input.readOnly = this.select.hasAttribute('readonly');
    this.input.setAttribute('aria-required', String(this.select.required));
    this.host.classList.toggle('chosen-native--disabled', this.select.disabled);
    if (this.select.disabled) this.close();
    this.renderSelection();
    this.renderResults();
  }

  renderSelection() {
    const selected = this.entries.filter(entry => entry.kind === 'option' &&
      this.nodes[entry.index]?.selected && !(entry.value === '' && entry.label === ''));
    this.chips.replaceChildren();
    const selectedDisplay = entry => {
      const label = element('span', 'chosen-native__selected-label');
      if (this.options.include_group_label_in_selected && entry.groupLabel != null) {
        label.append(element('span', 'chosen-native__group-name', `${entry.groupLabel}: `));
      }
      label.append(document.createTextNode(this.options.display_selected_value ? entry.value : entry.label));
      return label;
    };
    if (this.multiple) {
      for (const entry of selected) {
        const chip = element('span', 'chosen-native__chip');
        if (this.options.inherit_option_classes && entry.className) chip.className += ` ${entry.className}`;
        chip.append(selectedDisplay(entry));
        if (!this.select.disabled && !this.input.readOnly) {
          const remove = element('button', 'chosen-native__remove', '×');
          remove.type = 'button';
          remove.setAttribute('aria-label', `Remove ${entry.label}`);
          remove.addEventListener('click', () => { this.choose(entry, true); this.input.focus(); });
          chip.append(remove);
        }
        this.chips.append(chip);
      }
    }
    this.value.replaceChildren(...(!this.multiple && selected.length ? [selectedDisplay(selected[0])] : []));
    this.value.hidden = this.multiple || !selected.length || this.opened || !!this.input.value;
    this.clearButton.hidden = this.multiple || !this.options.allow_single_deselect || !selected.length ||
      !(this.select.options[0]?.value === '' && this.select.options[0]?.text === '') ||
      this.select.disabled || this.input.readOnly;
    this.input.placeholder = this.opened ? (this.options.search_placeholder || 'Search options') :
      (selected.length ? '' : this.select.getAttribute('data-placeholder') ??
        this.select.getAttribute('placeholder') ??
        (this.multiple ? this.options.placeholder_text_multiple : this.options.placeholder_text_single) ??
        this.options.placeholder_text);
    this.status.textContent = selected.length ? `Selected: ${selected.map(entry => entry.label).join(', ')}.` : 'No selection.';
  }

  renderResults() {
    const query = this.input.value;
    const searchable = this.entries.map(entry => entry.kind === 'option'
      ? { ...entry, selected: !!this.nodes[entry.index]?.selected } : entry);
    const result = filterOptions(searchable, query, {
      multiple: this.multiple,
      searchContains: this.options.search_contains,
      splitSearchTerms: this.options.split_search_terms,
      groupSearch: this.options.group_search,
      enableSplitWordSearch: this.options.enable_split_word_search,
      caseSensitiveSearch: this.options.case_sensitive_search,
      searchInValues: this.options.search_in_values,
      maxSearchLength: this.options.max_search_length,
      normalizeSearchText: this.options.normalize_search_text,
      searchMatcher: this.options.search_matcher,
      maxShownResults: this.options.max_shown_results,
      displaySelectedOptions: this.options.display_selected_options,
      displayDisabledOptions: this.options.display_disabled_options,
      minSearchLength: this.options.min_search_length || 0
    });
    this.available = result.items;
    this.list.replaceChildren();
    let group = null;
    let groupIndex = -1;
    for (const [position, entry] of this.available.entries()) {
      if (entry.kind === 'group') {
        group = element('div', `chosen-native__group${entry.className ? ` ${entry.className}` : ''}`);
        groupIndex = entry.index;
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', entry.label);
        group.append(element('div', 'chosen-native__group-label', entry.label));
        this.list.append(group);
        continue;
      }
      const selected = !!this.nodes[entry.index]?.selected;
      const row = element('div', `chosen-native__option${selected ? ' chosen-native__option--selected' : ''}${entry.disabled ? ' chosen-native__option--disabled' : ''}${entry.className ? ` ${entry.className}` : ''}`, entry.label);
      row.id = `${this.id}-option-${entry.index}`;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(selected));
      if (entry.disabled) row.setAttribute('aria-disabled', 'true');
      row.addEventListener('pointerenter', () => { if (!entry.disabled) this.highlight(position); });
      row.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
      row.addEventListener('click', () => this.choose(entry, this.multiple && !!this.nodes[entry.index]?.selected));
      (group && entry.groupIndex === groupIndex ? group : this.list).append(row);
    }
    this.empty.hidden = !!result.count;
    const noResultsText = this.select.getAttribute('data-no_results_text') || this.options.no_results_text;
    this.empty.textContent = `${noResultsText}${query ? ` ${query}` : ''}`;
    if (!result.count && query && this.opened) emit(this.select, 'chosen:no_results', this, { search_term: query });
    const active = this.available[this.activeIndex];
    if (!active || active.kind !== 'option' || active.disabled) {
      const preferred = preferredPrefixIndex(this.available, query, {
        highlightPrefixMatches: this.options.highlight_prefix_matches,
        searchContains: this.options.search_contains,
        searchMatcher: this.options.search_matcher,
        caseSensitiveSearch: this.options.case_sensitive_search,
        normalizeSearchText: this.options.normalize_search_text
      });
      this.activeIndex = preferred >= 0 ? preferred : this.available.findIndex(entry => entry.kind === 'option' && !entry.disabled);
    }
    this.highlight(this.activeIndex);
    if (this.opened) this.status.textContent = String(this.options.results_count_text(result.count));
  }

  highlight(index) {
    this.activeIndex = index;
    const active = this.available[index];
    const id = active?.kind === 'option' ? `${this.id}-option-${active.index}` : null;
    for (const row of this.list.querySelectorAll('[role="option"]')) {
      row.classList.toggle('chosen-native__option--active', row.id === id);
    }
    if (id && this.opened) {
      this.input.setAttribute('aria-activedescendant', id);
      document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' });
    } else this.input.removeAttribute('aria-activedescendant');
  }

  choose(entry, remove = false) {
    const option = this.nodes[entry.index];
    if (!option || option.disabled || option.hidden || option.parentElement?.disabled || this.select.disabled || this.input.readOnly) return;
    if (this.multiple) {
      if (!remove && !option.selected && this.options.max_selected_options != null &&
        Array.from(this.select.options).filter(item => item.selected).length >= this.options.max_selected_options) {
        emit(this.select, 'chosen:maxselected', this);
        return;
      }
      if (option.selected === !remove) return;
      option.selected = !remove;
    } else {
      if (remove || option.selected) return;
      this.select.selectedIndex = Array.from(this.select.options).indexOf(option);
    }
    this.changed();
    if (this.multiple) { this.input.value = ''; this.activeIndex = -1; this.renderResults(); }
    else this.close();
    this.input.focus();
  }

  clear() {
    if (this.multiple || this.select.disabled || this.input.readOnly) return;
    const blank = this.select.options[0];
    if (blank?.value !== '' || blank.text !== '') return;
    if (!blank || blank.selected) return;
    this.select.selectedIndex = Array.from(this.select.options).indexOf(blank);
    this.changed();
    this.close();
  }

  changed() {
    this.renderSelection();
    this.select.dispatchEvent(new Event('input', { bubbles: true }));
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  open() {
    if (this.destroyed || this.opened || this.select.disabled || this.input.readOnly) return;
    this.opened = true;
    this.popup.hidden = false;
    this.host.classList.add('chosen-native--open');
    this.input.setAttribute('aria-expanded', 'true');
    this.renderSelection();
    this.renderResults();
    emit(this.select, 'chosen:showing_dropdown', this);
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.popup.hidden = true;
    this.host.classList.remove('chosen-native--open');
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    this.input.value = '';
    this.activeIndex = -1;
    this.renderSelection();
    emit(this.select, 'chosen:hiding_dropdown', this);
  }

  keyDown(event) {
    if (event.isComposing || this.select.disabled) return;
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!this.opened) { this.open(); return; }
      const enabled = this.available.map((item, index) => item.kind === 'option' && !item.disabled ? index : -1)
        .filter(index => index !== -1);
      if (!enabled.length) return;
      const current = enabled.indexOf(this.activeIndex);
      this.highlight(enabled[(current + (key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]);
    } else if (key === 'Enter' && this.opened) {
      event.preventDefault();
      const entry = this.available[this.activeIndex];
      if (entry?.kind === 'option') this.choose(entry, this.multiple && !!this.nodes[entry.index]?.selected);
    } else if (key === 'Escape' && this.opened) {
      event.preventDefault(); this.close();
    } else if (key === 'Tab') {
      if (this.multiple && this.opened && this.options.multiselect_allow_tab_to_select) {
        const entry = this.available[this.activeIndex];
        if (entry?.kind === 'option') this.choose(entry, !!this.nodes[entry.index]?.selected);
      }
      this.close();
    } else if (key === 'Backspace' && this.multiple && this.options.backspace_deletes_choices && !this.input.value) {
      const selected = this.entries.filter(entry => entry.kind === 'option' && this.nodes[entry.index]?.selected);
      if (selected.length) { event.preventDefault(); this.choose(selected[selected.length - 1], true); }
    }
  }

  focus() { this.input.focus(); }
  blur() { this.input.blur(); }

  destroy() {
    if (this.destroyed) return;
    this.close();
    this.destroyed = true;
    this.input.removeEventListener('keydown', this.onKeyDown);
    this.input.removeEventListener('input', this.onInput);
    this.control.removeEventListener('pointerdown', this.onControlPointer);
    this.select.removeEventListener('change', this.onNativeChange);
    this.select.removeEventListener('chosen:updated', this.onUpdate);
    this.select.removeEventListener('invalid', this.onInvalid);
    this.select.removeEventListener('focus', this.onInvalid);
    this.form?.removeEventListener('reset', this.onReset);
    document.removeEventListener('pointerdown', this.onOutsidePointer, true);
    this.host.remove();
    if (!this.hadSelectClass) this.select.classList.remove('chosen-native__select');
    if (this.originalTabIndex === null) this.select.removeAttribute('tabindex');
    else this.select.setAttribute('tabindex', this.originalTabIndex);
    if (this.originalAriaHidden === null) this.select.removeAttribute('aria-hidden');
    else this.select.setAttribute('aria-hidden', this.originalAriaHidden);
    instances.delete(this.select);
  }
}

export default Chosen;
