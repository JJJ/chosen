var ChosenNative = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // native/Chosen.mjs
  var Chosen_exports = {};
  __export(Chosen_exports, {
    Chosen: () => Chosen,
    default: () => Chosen_default
  });

  // core/index.mjs
  var accentReplacements = [
    [/(ä|æ|ǽ)/g, "ae"],
    [/(ö|œ)/g, "oe"],
    [/(ü)/g, "ue"],
    [/(Ä)/g, "Ae"],
    [/(Ü)/g, "Ue"],
    [/(Ö)/g, "Oe"],
    [/(Æ|Ǽ)/g, "AE"],
    [/(ß)/g, "ss"],
    [/(Ĳ)/g, "IJ"],
    [/(ĳ)/g, "ij"],
    [/(Œ)/g, "OE"],
    [/(À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ)/g, "A"],
    [/(à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª)/g, "a"],
    [/(Ç|Ć|Ĉ|Ċ|Č)/g, "C"],
    [/(ç|ć|ĉ|ċ|č)/g, "c"],
    [/(Ð|Ď|Đ)/g, "D"],
    [/(ð|ď|đ)/g, "d"],
    [/(È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě)/g, "E"],
    [/(è|é|ê|ë|ē|ĕ|ė|ę|ě)/g, "e"],
    [/(Ĝ|Ğ|Ġ|Ģ)/g, "G"],
    [/(ĝ|ğ|ġ|ģ)/g, "g"],
    [/(Ĥ|Ħ)/g, "H"],
    [/(ĥ|ħ)/g, "h"],
    [/(Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ)/g, "I"],
    [/(ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı)/g, "i"],
    [/(Ĵ)/g, "J"],
    [/(ĵ)/g, "j"],
    [/(Ķ)/g, "K"],
    [/(ķ)/g, "k"],
    [/(Ĺ|Ļ|Ľ|Ŀ|Ł)/g, "L"],
    [/(ĺ|ļ|ľ|ŀ|ł)/g, "l"],
    [/(Ñ|Ń|Ņ|Ň)/g, "N"],
    [/(ñ|ń|ņ|ň|ŉ)/g, "n"],
    [/(Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ)/g, "O"],
    [/(ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º)/g, "o"],
    [/(Ŕ|Ŗ|Ř)/g, "R"],
    [/(ŕ|ŗ|ř)/g, "r"],
    [/(Ś|Ŝ|Ş|Š)/g, "S"],
    [/(ś|ŝ|ş|š|ſ)/g, "s"],
    [/(Ţ|Ť|Ŧ)/g, "T"],
    [/(ţ|ť|ŧ)/g, "t"],
    [/(Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ)/g, "U"],
    [/(ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ)/g, "u"],
    [/(Ý|Ÿ|Ŷ)/g, "Y"],
    [/(ý|ÿ|ŷ)/g, "y"],
    [/(Ŵ)/g, "W"],
    [/(ŵ)/g, "w"],
    [/(Ź|Ż|Ž)/g, "Z"],
    [/(ź|ż|ž)/g, "z"],
    [/(ƒ)/g, "f"]
  ];
  function asText(value) {
    return value == null ? "" : String(value);
  }
  function escapeRegex(value) {
    return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }
  function foldAccents(value) {
    var text = asText(value);
    for (var index = 0; index < accentReplacements.length; index += 1) {
      text = text.replace(accentReplacements[index][0], accentReplacements[index][1]);
    }
    return text;
  }
  function normalizeOptions(entries) {
    var normalized = [];
    var input = entries || [];
    function addOption(source, groupIndex2, group2) {
      var value = asText(source.value);
      var label = asText(source.label != null ? source.label : value);
      normalized.push({
        kind: "option",
        index: normalized.length,
        value,
        label,
        empty: value === "" && label === "",
        searchText: asText(source.searchText),
        className: asText(source.className),
        selected: !!source.selected,
        disabled: !!source.disabled || !!(group2 && group2.disabled),
        hidden: !!source.hidden || !!(group2 && group2.hidden),
        groupIndex: groupIndex2,
        groupLabel: group2 ? group2.label : null
      });
    }
    for (var index = 0; index < input.length; index += 1) {
      var entry = input[index];
      if (Array.isArray(entry.options)) {
        var groupIndex = normalized.length;
        var group = {
          kind: "group",
          index: groupIndex,
          label: asText(entry.label),
          className: asText(entry.className),
          disabled: !!entry.disabled,
          hidden: !!entry.hidden
        };
        normalized.push(group);
        for (var child = 0; child < entry.options.length; child += 1) {
          addOption(entry.options[child], groupIndex, group);
        }
      } else {
        addOption(entry, null, null);
      }
    }
    return normalized;
  }
  function includeOptionInResults(option, settings) {
    var config = settings || {};
    if (config.multiple && config.displaySelectedOptions != null && !config.displaySelectedOptions && option.selected) return false;
    if (config.displayDisabledOptions != null && !config.displayDisabledOptions && option.disabled) return false;
    if (option.empty || option.hidden || config.groupHidden) return false;
    return true;
  }
  function createMatcher(query, settings) {
    var config = settings || {};
    var normalize = config.normalizeSearchText || asText;
    var fold = config.foldAccents || foldAccents;
    var rawQuery = asText(query);
    if (config.maxSearchLength != null) rawQuery = rawQuery.substring(0, config.maxSearchLength);
    var normalizedQuery = normalize(rawQuery);
    var escapedQuery = escapeRegex(normalizedQuery);
    var terms = config.splitSearchTerms ? normalizedQuery.split(/\s+/) : [];
    var flags = config.caseSensitiveSearch ? "" : "i";
    function expression(value) {
      var pattern = config.searchContains ? value : "(^|\\s|\\b)" + value + "[^\\s]*";
      if (config.enableSplitWordSearch === false) pattern = "^" + pattern;
      return new RegExp(pattern, flags);
    }
    var makeRegex = config.createSearchRegex || expression;
    var regex = makeRegex(escapedQuery);
    var termRegexes = [];
    for (var termIndex = 0; termIndex < terms.length; termIndex += 1) {
      termRegexes.push(makeRegex(escapeRegex(terms[termIndex])));
    }
    var exactRegex = new RegExp("^" + escapedQuery + "$");
    function find(text, searchRegex) {
      if (config.searchStringMatch) return config.searchStringMatch(text, searchRegex);
      var match2 = searchRegex.exec(text);
      if (!config.caseSensitiveSearch && !match2) match2 = searchRegex.exec(fold(text));
      if (!config.searchContains && match2 && match2[1]) match2.index += 1;
      return match2;
    }
    function matchField(text, shouldNormalize) {
      var normalized = shouldNormalize ? normalize(asText(text)) : asText(text);
      var matches = [];
      if (termRegexes.length > 1) {
        for (var index = 0; index < termRegexes.length; index += 1) {
          matches.push(find(normalized, termRegexes[index]));
        }
        return {
          normalized,
          matches,
          first: matches[0],
          matched: matches.every(function(match2) {
            return match2 != null;
          })
        };
      }
      var first = find(normalized, regex);
      return { normalized, matches: [first], first, matched: first != null };
    }
    function match(option) {
      var primary = matchField(option.label, true);
      var matched = primary.matched;
      var alternate = false;
      if (!matched && option.searchText) {
        matched = matchField(option.searchText, true).matched;
        alternate = matched;
      }
      if (!matched && config.searchInValues) {
        matched = matchField(option.value, false).matched;
        alternate = matched;
      }
      return {
        matched,
        alternate,
        normalizedText: primary.normalized,
        primaryMatch: primary.first,
        termMatches: primary.matches,
        exact: exactRegex.test(asText(option.exactText != null ? option.exactText : option.label))
      };
    }
    match.terms = terms;
    return match;
  }
  function filterOptions(entries, query, settings) {
    var config = settings || {};
    var normalized = entries && entries.length && entries[0].kind ? entries : normalizeOptions(entries);
    var items = [];
    var count = 0;
    var exactMatch = false;
    var text = asText(query).trim();
    var customMatcher = typeof config.searchMatcher === "function" ? config.searchMatcher : null;
    var maximum = config.maxShownResults == null ? Infinity : Math.max(0, config.maxShownResults);
    if (text.length < (config.minSearchLength || 0)) {
      return { items, count, exactMatch };
    }
    var matcher = customMatcher ? null : createMatcher(text, config);
    var group = null;
    var groupMatches = false;
    var groupIncluded = false;
    for (var index = 0; index < normalized.length; index += 1) {
      var item = normalized[index];
      if (item.kind === "group") {
        group = item;
        groupIncluded = false;
        groupMatches = !item.hidden && (customMatcher ? !!customMatcher(text, item) : config.groupSearch !== false && matcher({ label: item.label }).matched);
        continue;
      }
      if (item.groupIndex == null) {
        group = null;
        groupMatches = false;
      }
      if (!includeOptionInResults(item, config)) continue;
      var result = customMatcher ? { matched: !!customMatcher(text, item), exact: item.label === text } : matcher(item);
      if (!result.matched && !groupMatches) continue;
      if (count >= maximum) break;
      if (group && !groupIncluded) {
        items.push(group);
        groupIncluded = true;
      }
      items.push(item);
      count += 1;
      exactMatch = exactMatch || result.exact;
    }
    return { items, count, exactMatch };
  }
  function preferredPrefixIndex(items, query, settings) {
    var config = settings || {};
    if (!config.highlightPrefixMatches || !config.searchContains || config.searchMatcher || !query) return -1;
    var normalize = config.normalizeSearchText || asText;
    var term = asText(normalize(asText(query).trim()));
    if (!config.caseSensitiveSearch) term = term.toLowerCase();
    for (var index = 0; index < items.length; index += 1) {
      var item = items[index];
      if (item.kind !== "option" || item.disabled) continue;
      var label = asText(normalize(item.label));
      if (!config.caseSensitiveSearch) label = label.toLowerCase();
      if (label.indexOf(term) === 0) return index;
    }
    return -1;
  }

  // native/Chosen.mjs
  var nextId = 0;
  var instances = /* @__PURE__ */ new WeakMap();
  function optionTree(select) {
    const entries = [];
    const nodes = [];
    for (const child of select.children) {
      if (child.tagName === "OPTGROUP") {
        entries.push({
          label: child.label,
          disabled: child.disabled,
          hidden: child.hidden,
          className: child.className,
          options: Array.from(child.children, (option) => ({
            value: option.value,
            label: option.text,
            selected: option.selected,
            disabled: option.disabled,
            hidden: option.hidden,
            className: option.className,
            searchText: option.getAttribute("data-search-text") || ""
          }))
        });
        nodes.push(null, ...child.children);
      } else if (child.tagName === "OPTION") {
        entries.push({
          value: child.value,
          label: child.text,
          selected: child.selected,
          disabled: child.disabled,
          hidden: child.hidden,
          className: child.className,
          searchText: child.getAttribute("data-search-text") || ""
        });
        nodes.push(child);
      }
    }
    return { entries: normalizeOptions(entries), nodes };
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function emit(select, name, chosen, extra = {}) {
    select.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { chosen, ...extra } }));
  }
  var Chosen = class {
    constructor(select, options = {}) {
      if (!(select instanceof HTMLSelectElement)) throw new TypeError("Chosen needs a select element");
      if (instances.has(select)) throw new Error("Chosen is already initialized on this select");
      this.select = select;
      this.options = {
        search_contains: false,
        split_search_terms: false,
        group_search: true,
        enable_split_word_search: true,
        case_sensitive_search: false,
        search_in_values: false,
        highlight_prefix_matches: false,
        backspace_deletes_choices: true,
        multiselect_allow_tab_to_select: false,
        single_backstroke_delete: true,
        search_input_type: "search",
        disable_search: false,
        disable_search_threshold: 0,
        max_search_length: 1e3,
        display_selected_options: true,
        display_disabled_options: true,
        deselect_selected_results: false,
        hide_results_on_select: true,
        max_items_shown: Infinity,
        more_items_text: (count) => `Show ${count} more...`,
        show_fewer_items_text: "Show fewer...",
        display_selected_value: false,
        include_group_label_in_selected: false,
        rtl: false,
        inherit_select_classes: false,
        inherit_option_classes: false,
        placeholder_text: select.multiple ? "Select Some Options" : "Select an Option",
        no_results_text: "No results for:",
        results_count_text: (count) => `${count} result${count === 1 ? "" : "s"} available`,
        allow_single_deselect: false,
        ...options
      };
      if (this.options.open_on_label_click == null) this.options.open_on_label_click = select.multiple;
      this.id = `${select.id || `chosen-native-${++nextId}`}-native`;
      this.multiple = select.multiple;
      this.opened = false;
      this.activeIndex = -1;
      this.pendingBackstrokeValue = null;
      this.choicesExpanded = false;
      this.typeahead = "";
      this.typeaheadTimer = null;
      this.entries = [];
      this.nodes = [];
      this.available = [];
      this.originalTabIndex = select.getAttribute("tabindex");
      this.originalAriaHidden = select.getAttribute("aria-hidden");
      this.hadSelectClass = select.classList.contains("chosen-native__select");
      this.form = select.form;
      this.boundLabels = /* @__PURE__ */ new Set();
      this.onLabelClick = (event) => {
        if (event.target.closest?.("a, button, input, select, textarea")) return;
        event.preventDefault();
        this.input.focus();
        if (this.options.open_on_label_click) this.open();
      };
      this.onNativeChange = () => this.update();
      this.onUpdate = () => this.update();
      this.onReset = () => setTimeout(() => {
        if (!this.destroyed) {
          this.close();
          this.update();
        }
      }, 0);
      this.onInvalid = () => this.input.focus();
      this.onOutsidePointer = (event) => {
        if (this.host.contains(event.target)) return;
        if (Array.from(this.select.labels || []).some((label) => label.contains(event.target))) return;
        this.close();
      };
      this.onKeyDown = (event) => this.keyDown(event);
      this.onInput = () => {
        this.pendingBackstrokeValue = null;
        this.activeIndex = -1;
        this.open();
        this.renderSelection();
        this.renderResults();
      };
      this.onControlPointer = (event) => {
        if (event.target === this.input || event.target.closest("button")) return;
        if (event.pointerType === "mouse") event.preventDefault();
        this.input.focus();
        this.open();
      };
      this.host = element("div", `chosen-native${this.multiple ? " chosen-native--multiple" : ""}`);
      this.inheritedClasses = /* @__PURE__ */ new Set();
      this.control = element("div", "chosen-native__control");
      this.chips = element("span", "chosen-native__chips");
      this.value = element("span", "chosen-native__value");
      this.value.setAttribute("aria-hidden", "true");
      this.input = element("input", "chosen-native__input");
      this.input.type = this.options.search_input_type === "text" ? "text" : "search";
      this.input.autocomplete = "off";
      this.input.id = this.id;
      this.input.setAttribute("role", "combobox");
      this.input.setAttribute("aria-autocomplete", "list");
      this.input.setAttribute("aria-haspopup", "listbox");
      this.input.setAttribute("aria-controls", `${this.id}-list`);
      this.input.setAttribute("aria-expanded", "false");
      this.input.setAttribute("aria-label", this.options.aria_label || select.getAttribute("aria-label") || Array.from(select.labels || []).map((label) => label.textContent.trim()).join(" ") || "Choose an option");
      this.input.setAttribute("aria-describedby", `${this.id}-status`);
      this.clearButton = element("button", "chosen-native__clear", "\xD7");
      this.clearButton.type = "button";
      this.clearButton.setAttribute("aria-label", "Clear selection");
      this.clearButton.addEventListener("click", () => {
        this.clear();
        this.input.focus();
      });
      this.chevron = element("span", "chosen-native__chevron");
      this.chevron.setAttribute("aria-hidden", "true");
      this.control.append(this.chips, this.value, this.input, this.clearButton, this.chevron);
      this.status = element("span", "chosen-native__sr-only");
      this.status.id = `${this.id}-status`;
      this.status.setAttribute("role", "status");
      this.status.setAttribute("aria-live", "polite");
      this.popup = element("div", "chosen-native__popup");
      this.popup.hidden = true;
      this.list = element("div", "chosen-native__list");
      this.list.id = `${this.id}-list`;
      this.list.setAttribute("role", "listbox");
      if (this.multiple) this.list.setAttribute("aria-multiselectable", "true");
      this.empty = element("div", "chosen-native__empty");
      this.popup.append(this.list, this.empty);
      this.host.append(this.control, this.status, this.popup);
      select.after(this.host);
      select.classList.add("chosen-native__select");
      select.setAttribute("tabindex", "-1");
      select.setAttribute("aria-hidden", "true");
      this.input.addEventListener("keydown", this.onKeyDown);
      this.input.addEventListener("input", this.onInput);
      this.input.addEventListener("click", () => this.open());
      this.control.addEventListener("pointerdown", this.onControlPointer);
      select.addEventListener("change", this.onNativeChange);
      select.addEventListener("chosen:updated", this.onUpdate);
      select.addEventListener("invalid", this.onInvalid);
      select.addEventListener("focus", this.onInvalid);
      this.form?.addEventListener("reset", this.onReset);
      document.addEventListener("pointerdown", this.onOutsidePointer, true);
      instances.set(select, this);
      this.update();
      emit(select, "chosen:ready", this);
    }
    update() {
      if (this.destroyed) return;
      const currentLabels = new Set(this.select.labels || []);
      for (const label of this.boundLabels) {
        if (!currentLabels.has(label)) {
          label.removeEventListener("click", this.onLabelClick);
          this.boundLabels.delete(label);
        }
      }
      for (const label of currentLabels) {
        if (!this.boundLabels.has(label)) {
          label.addEventListener("click", this.onLabelClick);
          this.boundLabels.add(label);
        }
      }
      for (const name of this.inheritedClasses) this.host.classList.remove(name);
      this.inheritedClasses.clear();
      for (const name of this.select.classList) {
        if (name === "chosen-rtl" || this.options.inherit_select_classes && !name.startsWith("chosen-native")) {
          this.host.classList.add(name);
          this.inheritedClasses.add(name);
        }
      }
      const direction = this.options.rtl || this.select.classList.contains("chosen-rtl") ? "rtl" : this.select.dir;
      if (direction) this.host.dir = direction;
      else this.host.removeAttribute("dir");
      const parsed = optionTree(this.select);
      this.entries = parsed.entries;
      this.nodes = parsed.nodes;
      this.input.disabled = this.select.disabled;
      this.searchDisabled = !this.multiple && (this.options.disable_search || this.select.options.length <= this.options.disable_search_threshold && !this.options.create_option);
      this.input.readOnly = this.select.hasAttribute("readonly") || this.searchDisabled;
      this.input.setAttribute("aria-autocomplete", this.searchDisabled ? "none" : "list");
      this.host.classList.toggle("chosen-native--no-search", this.searchDisabled);
      this.input.setAttribute("aria-required", String(this.select.required));
      this.host.classList.toggle("chosen-native--disabled", this.select.disabled);
      if (this.select.disabled) this.close();
      this.renderSelection();
      this.renderResults();
    }
    renderSelection() {
      const selected = this.entries.filter((entry) => entry.kind === "option" && this.nodes[entry.index]?.selected && !(entry.value === "" && entry.label === ""));
      this.chips.replaceChildren();
      const itemLimit = Number.isInteger(this.options.max_items_shown) && this.options.max_items_shown > 0 ? this.options.max_items_shown : Infinity;
      const hiddenCount = Math.max(0, selected.length - itemLimit);
      if (!hiddenCount) this.choicesExpanded = false;
      const selectedDisplay = (entry) => {
        const label = element("span", "chosen-native__selected-label");
        if (this.options.include_group_label_in_selected && entry.groupLabel != null) {
          label.append(element("span", "chosen-native__group-name", `${entry.groupLabel}: `));
        }
        label.append(document.createTextNode(this.options.display_selected_value ? entry.value : entry.label));
        return label;
      };
      if (this.multiple) {
        for (const [index, entry] of selected.entries()) {
          const chip = element("span", "chosen-native__chip");
          chip.hidden = hiddenCount > 0 && !this.choicesExpanded && index >= itemLimit;
          if (entry.value === this.pendingBackstrokeValue) chip.classList.add("chosen-native__chip--pending");
          if (this.options.inherit_option_classes && entry.className) chip.className += ` ${entry.className}`;
          chip.append(selectedDisplay(entry));
          if (!this.select.disabled && !this.select.hasAttribute("readonly")) {
            const remove = element("button", "chosen-native__remove", "\xD7");
            remove.type = "button";
            remove.setAttribute("aria-label", `Remove ${entry.label}`);
            remove.addEventListener("click", () => {
              this.choose(entry, true);
              this.input.focus();
            });
            chip.append(remove);
          }
          this.chips.append(chip);
        }
        if (hiddenCount) {
          const summary = element("button", "chosen-native__summary", this.choicesExpanded ? this.options.show_fewer_items_text : this.options.more_items_text(hiddenCount));
          summary.type = "button";
          summary.setAttribute("aria-expanded", String(this.choicesExpanded));
          summary.addEventListener("click", (event) => {
            event.stopPropagation();
            this.choicesExpanded = !this.choicesExpanded;
            this.renderSelection();
            this.chips.querySelector(".chosen-native__summary")?.focus();
          });
          this.chips.append(summary);
        }
      }
      const noSearchPlaceholder = this.select.getAttribute("data-placeholder") ?? this.select.getAttribute("placeholder") ?? this.options.placeholder_text_single ?? this.options.placeholder_text;
      this.value.replaceChildren(...!this.multiple && selected.length ? [selectedDisplay(selected[0])] : this.searchDisabled ? [document.createTextNode(noSearchPlaceholder)] : []);
      this.value.classList.toggle("chosen-native__value--placeholder", this.searchDisabled && !selected.length);
      this.value.hidden = this.multiple || !selected.length && !this.searchDisabled || !this.searchDisabled && (this.opened || !!this.input.value);
      this.clearButton.hidden = this.multiple || !this.options.allow_single_deselect || !selected.length || !(this.select.options[0]?.value === "" && this.select.options[0]?.text === "") || this.select.disabled || this.select.hasAttribute("readonly");
      this.input.placeholder = this.opened ? this.options.search_placeholder || "Search options" : selected.length ? "" : this.select.getAttribute("data-placeholder") ?? this.select.getAttribute("placeholder") ?? (this.multiple ? this.options.placeholder_text_multiple : this.options.placeholder_text_single) ?? this.options.placeholder_text;
      this.status.textContent = selected.length ? `Selected: ${selected.map((entry) => entry.label).join(", ")}.` : "No selection.";
    }
    renderResults() {
      const query = this.input.value;
      const searchable = this.entries.map((entry) => entry.kind === "option" ? { ...entry, selected: !!this.nodes[entry.index]?.selected } : entry);
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
        if (entry.kind === "group") {
          group = element("div", `chosen-native__group${entry.className ? ` ${entry.className}` : ""}`);
          groupIndex = entry.index;
          group.setAttribute("role", "group");
          group.setAttribute("aria-label", entry.label);
          group.append(element("div", "chosen-native__group-label", entry.label));
          this.list.append(group);
          continue;
        }
        const selected = !!this.nodes[entry.index]?.selected;
        const canDeselect = this.multiple && selected && this.options.deselect_selected_results;
        const actionable = !entry.disabled && (!this.multiple || !selected || canDeselect);
        const row = element("div", `chosen-native__option${selected ? " chosen-native__option--selected" : ""}${canDeselect ? " chosen-native__option--deselectable" : ""}${entry.disabled ? " chosen-native__option--disabled" : ""}${entry.className ? ` ${entry.className}` : ""}`, entry.label);
        row.id = `${this.id}-option-${entry.index}`;
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", String(selected));
        if (entry.disabled) row.setAttribute("aria-disabled", "true");
        row.addEventListener("pointerenter", () => {
          if (actionable) this.highlight(position);
        });
        row.addEventListener("pointerdown", (event) => {
          if (event.pointerType === "mouse") event.preventDefault();
        });
        row.addEventListener("click", (event) => {
          if (actionable) this.choose(entry, canDeselect, event.metaKey || event.ctrlKey);
        });
        (group && entry.groupIndex === groupIndex ? group : this.list).append(row);
      }
      this.empty.hidden = !!result.count;
      const noResultsText = this.select.getAttribute("data-no_results_text") || this.options.no_results_text;
      this.empty.textContent = `${noResultsText}${query ? ` ${query}` : ""}`;
      if (!result.count && query && this.opened) emit(this.select, "chosen:no_results", this, { search_term: query });
      const active = this.available[this.activeIndex];
      if (!active || active.kind !== "option" || active.disabled || this.multiple && this.nodes[active.index]?.selected && !this.options.deselect_selected_results) {
        const preferred = preferredPrefixIndex(this.available, query, {
          highlightPrefixMatches: this.options.highlight_prefix_matches,
          searchContains: this.options.search_contains,
          searchMatcher: this.options.search_matcher,
          caseSensitiveSearch: this.options.case_sensitive_search,
          normalizeSearchText: this.options.normalize_search_text
        });
        this.activeIndex = preferred >= 0 && (!this.multiple || !this.nodes[this.available[preferred].index]?.selected || this.options.deselect_selected_results) ? preferred : this.available.findIndex((entry) => entry.kind === "option" && !entry.disabled && (!this.multiple || !this.nodes[entry.index]?.selected || this.options.deselect_selected_results));
      }
      this.highlight(this.activeIndex);
      if (this.opened) this.status.textContent = String(this.options.results_count_text(result.count));
    }
    highlight(index) {
      this.activeIndex = index;
      const active = this.available[index];
      const id = active?.kind === "option" ? `${this.id}-option-${active.index}` : null;
      for (const row of this.list.querySelectorAll('[role="option"]')) {
        row.classList.toggle("chosen-native__option--active", row.id === id);
      }
      if (id && this.opened) {
        this.input.setAttribute("aria-activedescendant", id);
        document.getElementById(id)?.scrollIntoView?.({ block: "nearest" });
      } else this.input.removeAttribute("aria-activedescendant");
    }
    choose(entry, remove = false, keepOpen = false) {
      const option = this.nodes[entry.index];
      if (!option || option.disabled || option.hidden || option.parentElement?.disabled || this.select.disabled || this.select.hasAttribute("readonly")) return;
      if (this.multiple) {
        if (!remove && !option.selected && this.options.max_selected_options != null && Array.from(this.select.options).filter((item) => item.selected).length >= this.options.max_selected_options) {
          emit(this.select, "chosen:maxselected", this);
          return;
        }
        if (option.selected === !remove) return;
        option.selected = !remove;
      } else {
        if (remove || option.selected) return;
        this.select.selectedIndex = Array.from(this.select.options).indexOf(option);
      }
      this.pendingBackstrokeValue = null;
      this.changed();
      if (this.multiple) {
        this.input.value = "";
        this.activeIndex = -1;
        if (this.options.hide_results_on_select && !keepOpen) this.close();
        else this.renderResults();
      } else this.close();
      this.input.focus();
    }
    clear() {
      if (this.multiple || this.select.disabled || this.select.hasAttribute("readonly")) return;
      const blank = this.select.options[0];
      if (blank?.value !== "" || blank.text !== "") return;
      if (!blank || blank.selected) return;
      this.select.selectedIndex = Array.from(this.select.options).indexOf(blank);
      this.changed();
      this.close();
    }
    changed() {
      this.renderSelection();
      this.select.dispatchEvent(new Event("input", { bubbles: true }));
      this.select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    open() {
      if (this.destroyed || this.opened || this.select.disabled || this.select.hasAttribute("readonly")) return;
      this.opened = true;
      this.popup.hidden = false;
      this.host.classList.add("chosen-native--open");
      this.input.setAttribute("aria-expanded", "true");
      this.renderSelection();
      this.renderResults();
      emit(this.select, "chosen:showing_dropdown", this);
    }
    close() {
      if (!this.opened) return;
      this.pendingBackstrokeValue = null;
      this.typeahead = "";
      clearTimeout(this.typeaheadTimer);
      this.opened = false;
      this.popup.hidden = true;
      this.host.classList.remove("chosen-native--open");
      this.input.setAttribute("aria-expanded", "false");
      this.input.removeAttribute("aria-activedescendant");
      this.input.value = "";
      this.activeIndex = -1;
      this.renderSelection();
      emit(this.select, "chosen:hiding_dropdown", this);
    }
    keyDown(event) {
      if (event.isComposing || this.select.disabled) return;
      const key = event.key;
      if (this.searchDisabled && this.opened && key.length === 1 && /\S/.test(key) && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        let query = this.typeahead + key;
        const find = (text) => this.available.findIndex((item) => {
          if (item.kind !== "option" || item.disabled) return false;
          const label = String(this.options.normalize_search_text?.(item.label) ?? item.label);
          const prefix = String(this.options.normalize_search_text?.(text) ?? text);
          return this.options.case_sensitive_search ? label.startsWith(prefix) : label.toLowerCase().startsWith(prefix.toLowerCase());
        });
        let index = find(query);
        if (index < 0) {
          query = key;
          index = find(query);
        }
        this.typeahead = query;
        clearTimeout(this.typeaheadTimer);
        this.typeaheadTimer = setTimeout(() => {
          this.typeahead = "";
        }, 500);
        if (index >= 0) this.highlight(index);
        return;
      }
      if (key !== "Backspace" && this.pendingBackstrokeValue !== null) {
        this.pendingBackstrokeValue = null;
        this.renderSelection();
      }
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        if (!this.opened) {
          this.open();
          return;
        }
        const enabled = this.available.map((item, index) => item.kind === "option" && !item.disabled && (!this.multiple || !this.nodes[item.index]?.selected || this.options.deselect_selected_results) ? index : -1).filter((index) => index !== -1);
        if (!enabled.length) return;
        const current = enabled.indexOf(this.activeIndex);
        this.highlight(enabled[(current + (key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length]);
      } else if (key === "Enter" && this.opened) {
        event.preventDefault();
        const entry = this.available[this.activeIndex];
        if (entry?.kind === "option" && (!this.multiple || !this.nodes[entry.index]?.selected || this.options.deselect_selected_results)) {
          this.choose(entry, this.multiple && !!this.nodes[entry.index]?.selected, event.metaKey || event.ctrlKey);
        }
      } else if (key === "Escape" && this.opened) {
        event.preventDefault();
        this.close();
      } else if (key === "Tab") {
        if (this.multiple && this.opened && this.options.multiselect_allow_tab_to_select) {
          const entry = this.available[this.activeIndex];
          if (entry?.kind === "option" && (!this.nodes[entry.index]?.selected || this.options.deselect_selected_results)) {
            this.choose(entry, !!this.nodes[entry.index]?.selected);
          }
        }
        this.close();
      } else if (key === "Backspace" && this.multiple && this.options.backspace_deletes_choices && !this.input.value) {
        const selected = this.entries.filter((entry) => entry.kind === "option" && this.nodes[entry.index]?.selected);
        if (selected.length) {
          event.preventDefault();
          const last = selected[selected.length - 1];
          if (this.options.single_backstroke_delete || this.pendingBackstrokeValue === last.value) {
            this.choose(last, true);
          } else {
            this.pendingBackstrokeValue = last.value;
            this.renderSelection();
          }
        }
      }
    }
    focus() {
      this.input.focus();
    }
    blur() {
      this.input.blur();
    }
    destroy() {
      if (this.destroyed) return;
      this.close();
      clearTimeout(this.typeaheadTimer);
      this.destroyed = true;
      for (const label of this.boundLabels) label.removeEventListener("click", this.onLabelClick);
      this.boundLabels.clear();
      this.input.removeEventListener("keydown", this.onKeyDown);
      this.input.removeEventListener("input", this.onInput);
      this.control.removeEventListener("pointerdown", this.onControlPointer);
      this.select.removeEventListener("change", this.onNativeChange);
      this.select.removeEventListener("chosen:updated", this.onUpdate);
      this.select.removeEventListener("invalid", this.onInvalid);
      this.select.removeEventListener("focus", this.onInvalid);
      this.form?.removeEventListener("reset", this.onReset);
      document.removeEventListener("pointerdown", this.onOutsidePointer, true);
      this.host.remove();
      if (!this.hadSelectClass) this.select.classList.remove("chosen-native__select");
      if (this.originalTabIndex === null) this.select.removeAttribute("tabindex");
      else this.select.setAttribute("tabindex", this.originalTabIndex);
      if (this.originalAriaHidden === null) this.select.removeAttribute("aria-hidden");
      else this.select.setAttribute("aria-hidden", this.originalAriaHidden);
      instances.delete(this.select);
    }
  };
  var Chosen_default = Chosen;
  return __toCommonJS(Chosen_exports);
})();
