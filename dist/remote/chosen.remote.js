var ChosenRemote = (() => {
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

  // remote/index.mjs
  var index_exports = {};
  __export(index_exports, {
    connectRemoteSelect: () => connectRemoteSelect,
    createRemoteSource: () => createRemoteSource
  });
  function positiveInteger(value, name) {
    if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${name} must be a positive integer`);
    return value;
  }
  function recordsFrom(response, limit) {
    if (!Array.isArray(response)) throw new TypeError("Remote source must return an array of records");
    const records = [];
    const seen = /* @__PURE__ */ new Set();
    for (const item of response) {
      if (records.length >= limit) break;
      if (!item || item.value == null || item.value === "" || item.label == null) {
        throw new TypeError("Remote records need nonempty value and label fields");
      }
      const value = String(item.value);
      if (seen.has(value)) continue;
      seen.add(value);
      records.push({ value, label: String(item.label) });
    }
    return records;
  }
  function createRemoteSource(load, { minLength = 2, limit = 50, onResults = () => {
  }, onStatus = () => {
  } } = {}) {
    if (typeof load !== "function") throw new TypeError("Remote source must be a function");
    if (!Number.isSafeInteger(minLength) || minLength < 0) throw new RangeError("minLength must be a nonnegative integer");
    positiveInteger(limit, "limit");
    let generation = 0;
    let lastQuery;
    let active;
    let disposed = false;
    function search(query) {
      if (disposed) return;
      query = String(query ?? "");
      if (query === lastQuery) return;
      lastQuery = query;
      const current = ++generation;
      active?.abort();
      active = null;
      if (query.length < minLength) {
        onResults([], query);
        onStatus("idle", query);
        return;
      }
      const request = new AbortController();
      active = request;
      onStatus("loading", query);
      onResults([], query);
      Promise.resolve().then(() => load(query, { signal: request.signal, limit })).then((response) => {
        if (disposed || current !== generation || request.signal.aborted) return;
        const records = recordsFrom(response, limit);
        onResults(records, query);
        onStatus("ready", query, void 0, records.length);
      }).catch((error) => {
        if (disposed || current !== generation || request.signal.aborted) return;
        onStatus("error", query, error);
      });
    }
    return {
      search,
      refresh() {
        const query = lastQuery ?? "";
        lastQuery = void 0;
        search(query);
      },
      dispose() {
        disposed = true;
        ++generation;
        active?.abort();
        active = null;
      }
    };
  }
  function connectRemoteSelect(select, { load, subscribe, update, minLength = 2, limit = 50, onStatus } = {}) {
    if (!(select instanceof HTMLSelectElement)) throw new TypeError("Remote search needs a select element");
    if (typeof subscribe !== "function" || typeof update !== "function") {
      throw new TypeError("Remote search needs subscribe and update functions");
    }
    const first = select.options[0];
    const blank = !select.multiple && first && first.value === "" && first.text === "" ? first : null;
    function apply(records) {
      const selected = Array.from(select.options).filter((option) => option.selected && option.value !== "");
      const byValue = new Map(selected.map((option) => [option.value, option]));
      const groups = /* @__PURE__ */ new Map();
      for (const option of selected) {
        if (option.parentElement instanceof HTMLOptGroupElement && !groups.has(option.parentElement)) {
          groups.set(option.parentElement, option.parentElement.cloneNode(false));
        }
      }
      while (select.firstChild) select.removeChild(select.firstChild);
      if (blank) select.appendChild(blank);
      for (const option of selected) {
        const group = groups.get(option.parentElement);
        if (group) {
          if (!group.parentElement) select.appendChild(group);
          group.appendChild(option);
        } else {
          select.appendChild(option);
        }
      }
      for (const record of records) {
        const existing = byValue.get(record.value);
        if (existing) {
          existing.text = record.label;
        } else {
          select.appendChild(new Option(record.label, record.value));
        }
      }
      for (const option of selected) option.selected = true;
      update();
    }
    const controller = createRemoteSource(load, { minLength, limit, onResults: apply, onStatus });
    apply([]);
    const unsubscribe = subscribe((query) => controller.search(query));
    return {
      search: controller.search,
      refresh: controller.refresh,
      dispose() {
        controller.dispose();
        if (typeof unsubscribe === "function") unsubscribe();
      }
    };
  }
  return __toCommonJS(index_exports);
})();
