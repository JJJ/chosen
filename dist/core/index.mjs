/* Framework-neutral data and selection rules shared by Chosen editions. */

var accentReplacements = [
  [/(ä|æ|ǽ)/g, 'ae'], [/(ö|œ)/g, 'oe'], [/(ü)/g, 'ue'],
  [/(Ä)/g, 'Ae'], [/(Ü)/g, 'Ue'], [/(Ö)/g, 'Oe'],
  [/(Æ|Ǽ)/g, 'AE'], [/(ß)/g, 'ss'], [/(Ĳ)/g, 'IJ'],
  [/(ĳ)/g, 'ij'], [/(Œ)/g, 'OE'],
  [/(À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ)/g, 'A'],
  [/(à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª)/g, 'a'],
  [/(Ç|Ć|Ĉ|Ċ|Č)/g, 'C'], [/(ç|ć|ĉ|ċ|č)/g, 'c'],
  [/(Ð|Ď|Đ)/g, 'D'], [/(ð|ď|đ)/g, 'd'],
  [/(È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě)/g, 'E'],
  [/(è|é|ê|ë|ē|ĕ|ė|ę|ě)/g, 'e'],
  [/(Ĝ|Ğ|Ġ|Ģ)/g, 'G'], [/(ĝ|ğ|ġ|ģ)/g, 'g'],
  [/(Ĥ|Ħ)/g, 'H'], [/(ĥ|ħ)/g, 'h'],
  [/(Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ)/g, 'I'],
  [/(ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı)/g, 'i'],
  [/(Ĵ)/g, 'J'], [/(ĵ)/g, 'j'], [/(Ķ)/g, 'K'], [/(ķ)/g, 'k'],
  [/(Ĺ|Ļ|Ľ|Ŀ|Ł)/g, 'L'], [/(ĺ|ļ|ľ|ŀ|ł)/g, 'l'],
  [/(Ñ|Ń|Ņ|Ň)/g, 'N'], [/(ñ|ń|ņ|ň|ŉ)/g, 'n'],
  [/(Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ)/g, 'O'],
  [/(ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º)/g, 'o'],
  [/(Ŕ|Ŗ|Ř)/g, 'R'], [/(ŕ|ŗ|ř)/g, 'r'],
  [/(Ś|Ŝ|Ş|Š)/g, 'S'], [/(ś|ŝ|ş|š|ſ)/g, 's'],
  [/(Ţ|Ť|Ŧ)/g, 'T'], [/(ţ|ť|ŧ)/g, 't'],
  [/(Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ)/g, 'U'],
  [/(ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ)/g, 'u'],
  [/(Ý|Ÿ|Ŷ)/g, 'Y'], [/(ý|ÿ|ŷ)/g, 'y'],
  [/(Ŵ)/g, 'W'], [/(ŵ)/g, 'w'],
  [/(Ź|Ż|Ž)/g, 'Z'], [/(ź|ż|ž)/g, 'z'], [/(ƒ)/g, 'f']
];

function asText(value) {
  return value == null ? '' : String(value);
}

function escapeRegex(value) {
  return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function isEmptyOption(option) {
  return !!option.empty || (asText(option.value) === '' && asText(option.label) === '');
}

function optionDataAttributes(value) {
  var attributes = {};
  if (!value || typeof value !== 'object') return attributes;
  for (var name in value) {
    if (Object.prototype.hasOwnProperty.call(value, name) && /^data-[a-z0-9_.:-]+$/.test(name)) {
      attributes[name] = asText(value[name]);
    }
  }
  return attributes;
}

export function foldAccents(value) {
  var text = asText(value);
  for (var index = 0; index < accentReplacements.length; index += 1) {
    text = text.replace(accentReplacements[index][0], accentReplacements[index][1]);
  }
  return text;
}

export function normalizeOptions(entries) {
  var normalized = [];
  var input = entries || [];

  function addOption(source, groupIndex, group) {
    var value = asText(source.value);
    var label = asText(source.label != null ? source.label : value);
    normalized.push({
      kind: 'option',
      index: normalized.length,
      value: value,
      label: label,
      empty: value === '' && label === '',
      searchText: asText(source.searchText),
      alwaysVisible: !!source.alwaysVisible,
      dataAttributes: optionDataAttributes(source.dataAttributes),
      className: asText(source.className),
      selected: !!source.selected,
      disabled: !!source.disabled || !!(group && group.disabled),
      hidden: !!source.hidden || !!(group && group.hidden),
      groupIndex: groupIndex,
      groupLabel: group ? group.label : null
    });
  }

  for (var index = 0; index < input.length; index += 1) {
    var entry = input[index];
    if (Array.isArray(entry.options)) {
      var groupIndex = normalized.length;
      var group = {
        kind: 'group',
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

export function includeOptionInResults(option, settings) {
  var config = settings || {};
  if (config.multiple && config.displaySelectedOptions != null && !config.displaySelectedOptions && option.selected) return false;
  if (config.displayDisabledOptions != null && !config.displayDisabledOptions && option.disabled) return false;
  if (option.empty || option.hidden || config.groupHidden) return false;
  return true;
}

export function selectionLimitReached(selectedCount, maximum) {
  return selectedCount >= (maximum == null ? Infinity : maximum);
}

export function canSelectOption(option, selectedValues, settings) {
  var config = settings || {};
  if (!option || isEmptyOption(option) || option.disabled || option.hidden || config.disabled || config.readOnly) return false;
  if (selectedValues.indexOf(asText(option.value)) !== -1) return false;
  return !config.multiple || !selectionLimitReached(selectedValues.length, config.maxSelectedOptions);
}

export function updateSelection(selectedValues, option, settings) {
  var config = settings || {};
  var values = selectedValues.slice();
  var value = option ? asText(option.value) : '';
  var existing = values.indexOf(value);
  if (!option || option.disabled || option.hidden || config.disabled || config.readOnly) {
    return { values: values, changed: false, limitReached: false };
  }
  if (config.action === 'remove') {
    if (existing === -1) return { values: values, changed: false, limitReached: false };
    values.splice(existing, 1);
    return { values: values, changed: true, limitReached: false };
  }
  if (isEmptyOption(option) || existing !== -1) {
    return { values: values, changed: false, limitReached: false };
  }
  if (config.multiple && selectionLimitReached(values.length, config.maxSelectedOptions)) {
    return { values: values, changed: false, limitReached: true };
  }
  return {
    values: config.multiple ? values.concat(value) : [value],
    changed: true,
    limitReached: false
  };
}

export function resolvePastedChoices(text, entries, selectedValues, maximum) {
  var input = asText(text);
  var values = selectedValues.slice();
  var remaining = [];
  var consumed = false;
  var limitReached = false;
  if (!/[,;\t\r\n]/.test(input)) {
    return { values: values, remaining: input, handled: false, changed: false, limitReached: false };
  }
  var tokens = input.split(/[,;\t\r\n]/).map(function (token) { return token.trim(); }).filter(Boolean);
  if (!tokens.length) {
    return { values: values, remaining: input, handled: false, changed: false, limitReached: false };
  }
  var eligible = entries.filter(function (item) {
    return item.kind === 'option' && !item.empty && !item.disabled && !item.hidden;
  });
  for (var index = 0; index < tokens.length; index += 1) {
    var token = tokens[index];
    var matches = eligible.filter(function (item) { return item.value === token; });
    if (!matches.length) matches = eligible.filter(function (item) { return item.label.toLowerCase() === token.toLowerCase(); });
    if (matches.length !== 1) { remaining.push(token); continue; }
    var value = matches[0].value;
    if (values.indexOf(value) !== -1) { consumed = true; continue; }
    if (selectionLimitReached(values.length, maximum)) {
      remaining.push(token);
      limitReached = true;
      continue;
    }
    values.push(value);
    consumed = true;
  }
  return { values: values, remaining: remaining.join(', '), handled: consumed || limitReached,
    changed: values.length !== selectedValues.length, limitReached: limitReached };
}

export function createMatcher(query, settings) {
  var config = settings || {};
  var normalize = config.normalizeSearchText || asText;
  var fold = config.foldAccents || foldAccents;
  var rawQuery = asText(query);
  if (config.maxSearchLength != null) rawQuery = rawQuery.substring(0, config.maxSearchLength);
  var normalizedQuery = normalize(rawQuery);
  var escapedQuery = escapeRegex(normalizedQuery);
  var terms = config.splitSearchTerms ? normalizedQuery.split(/\s+/) : [];
  var flags = config.caseSensitiveSearch ? '' : 'i';

  function expression(value) {
    var pattern = config.searchContains ? value : '(^|\\s|\\b)' + value + '[^\\s]*';
    if (config.enableSplitWordSearch === false) pattern = '^' + pattern;
    return new RegExp(pattern, flags);
  }

  var makeRegex = config.createSearchRegex || expression;
  var regex = makeRegex(escapedQuery);
  var termRegexes = [];
  for (var termIndex = 0; termIndex < terms.length; termIndex += 1) {
    termRegexes.push(makeRegex(escapeRegex(terms[termIndex])));
  }
  var exactRegex = new RegExp('^' + escapedQuery + '$');

  function find(text, searchRegex) {
    if (config.searchStringMatch) return config.searchStringMatch(text, searchRegex);
    var match = searchRegex.exec(text);
    if (!config.caseSensitiveSearch && !match) match = searchRegex.exec(fold(text));
    if (!config.searchContains && match && match[1]) match.index += 1;
    return match;
  }

  function matchField(text, shouldNormalize) {
    var normalized = shouldNormalize ? normalize(asText(text)) : asText(text);
    var matches = [];
    if (termRegexes.length > 1) {
      for (var index = 0; index < termRegexes.length; index += 1) {
        matches.push(find(normalized, termRegexes[index]));
      }
      return {
        normalized: normalized,
        matches: matches,
        first: matches[0],
        matched: matches.every(function (match) { return match != null; })
      };
    }
    var first = find(normalized, regex);
    return { normalized: normalized, matches: [first], first: first, matched: first != null };
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
      matched: matched,
      alternate: alternate,
      normalizedText: primary.normalized,
      primaryMatch: primary.first,
      termMatches: primary.matches,
      exact: exactRegex.test(asText(option.exactText != null ? option.exactText : option.label))
    };
  }

  match.terms = terms;
  return match;
}

export function filterOptions(entries, query, settings) {
  var config = settings || {};
  var normalized = entries && entries.length && entries[0].kind ? entries : normalizeOptions(entries);
  var items = [];
  var count = 0;
  var exactMatch = false;
  var text = asText(query).trim();
  var customMatcher = typeof config.searchMatcher === 'function' ? config.searchMatcher : null;
  var maximum = config.maxShownResults == null ? Infinity : Math.max(0, config.maxShownResults);
  if (text.length < (config.minSearchLength || 0)) {
    return { items: items, count: count, exactMatch: exactMatch };
  }
  var matcher = customMatcher ? null : createMatcher(text, config);
  var group = null;
  var groupMatches = false;
  var groupIncluded = false;

  for (var index = 0; index < normalized.length; index += 1) {
    var item = normalized[index];
    if (item.kind === 'group') {
      group = item;
      groupIncluded = false;
      groupMatches = !item.hidden && (customMatcher
        ? !!customMatcher(text, item)
        : config.groupSearch !== false && matcher({ label: item.label }).matched);
      continue;
    }
    if (item.groupIndex == null) {
      group = null;
      groupMatches = false;
    }
    if (!includeOptionInResults(item, config)) continue;
    var result = customMatcher
      ? { matched: !!customMatcher(text, item), exact: item.label === text }
      : matcher(item);
    var matched = result.matched || groupMatches;
    var pinnedOnly = !!(text.length && item.alwaysVisible && !matched);
    if (!matched && !pinnedOnly) continue;
    if (matched) exactMatch = exactMatch || result.exact;
    if (count >= maximum && !pinnedOnly) continue;
    if (group && !groupIncluded) {
      items.push(group);
      groupIncluded = true;
    }
    if (pinnedOnly) {
      var pinnedItem = {};
      for (var key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) pinnedItem[key] = item[key];
      }
      pinnedItem.pinnedOnly = true;
      items.push(pinnedItem);
    } else items.push(item);
    if (!pinnedOnly) count += 1;
  }
  return { items: items, count: count, exactMatch: exactMatch };
}

export function preferredPrefixIndex(items, query, settings) {
  var config = settings || {};
  if (!config.highlightPrefixMatches || !config.searchContains || config.searchMatcher || !query) return -1;
  var normalize = config.normalizeSearchText || asText;
  var term = asText(normalize(asText(query).trim()));
  if (!config.caseSensitiveSearch) term = term.toLowerCase();
  for (var index = 0; index < items.length; index += 1) {
    var item = items[index];
    if (item.kind !== 'option' || item.disabled) continue;
    var label = asText(normalize(item.label));
    if (!config.caseSensitiveSearch) label = label.toLowerCase();
    if (label.indexOf(term) === 0) return index;
  }
  return -1;
}

export function rangeOptions(items, anchorIndex, targetIndex) {
  var anchor = -1;
  var target = -1;
  for (var index = 0; index < items.length; index += 1) {
    if (items[index].kind !== 'option') continue;
    if (items[index].index === anchorIndex) anchor = index;
    if (items[index].index === targetIndex) target = index;
  }
  if (anchor < 0 || target < 0) return [];
  return items.slice(Math.min(anchor, target), Math.max(anchor, target) + 1)
    .filter(function (item) { return item.kind === 'option'; });
}
