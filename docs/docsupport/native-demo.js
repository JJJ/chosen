'use strict';
const project = document.getElementById('native-project');
const skills = document.getElementById('native-skills');
const season = document.getElementById('native-season');
const events = document.getElementById('native-events');
const projectChosen = new ChosenNative.Chosen(project, { allow_single_deselect: true, search_in_values: true });
document.getElementById('native-slow-search').addEventListener('change', event => {
  projectChosen.options.search_delay = event.currentTarget.checked ? 250 : 0;
});
const skillsChosen = new ChosenNative.Chosen(skills, { max_selected_options: 3,
  create_option: true, persistent_create_option: true, skip_no_results: true,
  max_items_shown: 1,
  allow_select_all: true, allow_deselect_all: true,
  paste_multiple_values: true,
  parser_config: { copy_data_attributes: true },
  multiselect_allow_tab_to_select: true, display_selected_value: true,
  include_group_label_in_selected: true, deselect_selected_results: true,
  hide_results_on_select: false });
new ChosenNative.Chosen(season, {
  width: '12rem', dropdown_width: 'min(19rem, 90vw)', dropdown_position: 'fixed' });
let added = 0;

for (const select of [project, skills, season]) {
  for (const name of ['input', 'change', 'chosen:showing_dropdown', 'chosen:hiding_dropdown',
    'chosen:search', 'chosen:search_updated', 'chosen:no_results', 'chosen:maxselected']) {
    select.addEventListener(name, event => {
      const query = event.detail?.search_term;
      events.textContent = `${select.name}: ${name}${query === undefined ? '' : ` (${query})`}\nValues: ${Array.from(select.selectedOptions, option => option.value).join(', ') || '(none)'}`;
    });
  }
}

document.getElementById('native-add').addEventListener('click', () => {
  added += 1;
  project.add(new Option(`Project ${added}`, `project-${added}`));
  projectChosen.update();
  events.textContent = `Added Project ${added}; Chosen updated from the native select.`;
});
document.getElementById('native-toggle').addEventListener('click', event => {
  project.disabled = !project.disabled;
  projectChosen.update();
  event.currentTarget.textContent = project.disabled ? 'Enable project' : 'Disable project';
});
document.getElementById('native-direction').addEventListener('click', event => {
  skills.dir = skills.dir === 'rtl' ? 'ltr' : 'rtl';
  skillsChosen.update();
  event.currentTarget.textContent = skills.dir === 'rtl' ? 'Use left-to-right skills' : 'Use right-to-left skills';
});
document.getElementById('native-demo-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  events.textContent = `Submitted project: ${data.get('project') || '(none)'}\nSubmitted skills: ${data.getAll('skills').join(', ') || '(none)'}`;
});

// Keep the feature sections in the same order as the classic demo pages.
const suite = document.getElementById('native-suite-form');
const suiteEvent = document.getElementById('native-suite-event');
const makeOption = item => {
  const data = typeof item === 'string' ? { label: item } : item;
  const option = new Option(data.label, data.value || data.label);
  option.disabled = !!data.disabled;
  option.hidden = !!data.hidden;
  if (data.searchText) option.dataset.searchText = data.searchText;
  return option;
};
for (const example of window.ChosenAdapterCases) {
  const section = document.createElement('section');
  section.id = example.id;
  section.className = `adapter-suite-example ${example.className || ''}`;
  const title = document.createElement('h2');
  const anchor = document.createElement('a');
  anchor.className = 'anchor';
  anchor.href = `#${example.id}`;
  anchor.textContent = example.title;
  title.append(anchor);
  const comparison = document.createElement('div');
  comparison.className = 'side-by-side clearfix';
  const label = document.createElement('label');
  const id = `native-suite-${example.id}`;
  label.htmlFor = id;
  label.className = 'comparison-label';
  label.textContent = example.id === 'labels-work-too' ? 'Click this label' : 'Into This';
  const select = document.createElement('select');
  select.id = id;
  select.name = `suite-${example.id}`;
  select.multiple = !!example.multiple;
  select.required = !!example.required;
  if (example.dir) select.dir = example.dir;
  if (example.groupAction) select.setAttribute('select-by-group', '');
  if (example.placeholder) select.dataset.placeholder = example.placeholder;
  if (example.dataOptions) {
    select.dataset.disableSearch = 'true';
    select.dataset.allowSingleDeselect = 'true';
    select.dataset.placeholderTextSingle = 'Choose a project...';
  }
  if (!example.multiple) select.add(new Option('', ''));
  for (const item of example.options) {
    if (typeof item === 'object' && item.options) {
      const group = document.createElement('optgroup');
      group.label = item.label;
      for (const child of item.options) group.append(makeOption(child));
      select.append(group);
    } else select.append(makeOption(item));
  }
  if (example.defaultValue) for (const option of select.options) {
    option.selected = (Array.isArray(example.defaultValue) ? example.defaultValue : [example.defaultValue]).includes(option.value);
  }
  const help = document.createElement('p');
  help.textContent = example.help;
  const controlWrap = document.createElement('div');
  controlWrap.className = `adapter-suite-control${example.className === 'adapter-case-clipped' ? ' adapter-suite-clip' : ''}`;
  comparison.append(help);
  if (example.id === 'standard-select' || example.id === 'multiple-select') {
    const originalWrap = document.createElement('div');
    const originalLabel = document.createElement('label');
    originalLabel.className = 'comparison-label';
    originalLabel.htmlFor = `${id}-original`;
    originalLabel.textContent = 'Turns This';
    const original = select.cloneNode(true);
    original.id = `${id}-original`;
    original.removeAttribute('name');
    original.className = 'select';
    originalWrap.append(originalLabel, original);
    comparison.append(originalWrap);
  }
  controlWrap.append(label, select);
  comparison.append(controlWrap);
  section.append(title, comparison);
  suite.append(section);
  const chosenOptions = { width: false, ...(example.native || {}) };
  let chosen = new ChosenNative.Chosen(select, chosenOptions);
  select.addEventListener('change', () => {
    suiteEvent.textContent = `${example.title}: ${Array.from(select.selectedOptions, option => option.value).join(', ') || '(none)'}`;
  });
  if (example.id === 'no-results-text-support') {
    const status = document.createElement('output');
    status.setAttribute('role', 'status');
    status.textContent = 'No search yet.';
    controlWrap.append(status);
    select.addEventListener('chosen:no_results', event => {
      status.textContent = `No results for: ${event.detail.search_term}`;
    });
    select.addEventListener('chosen:no_results_clear', event => {
      status.textContent = `No-results message cleared: ${event.detail.search_term}`;
    });
  }
  if (example.dynamic) {
    const actions = document.createElement('div');
    actions.className = 'adapter-suite-actions';
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Add an option';
    add.addEventListener('click', () => {
      const count = select.options.length;
      select.add(new Option(`Item ${count}`, `item-${count}`));
      chosen?.update();
      suiteEvent.textContent = `${example.title}: added Item ${count}`;
    });
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Destroy Chosen';
    toggle.addEventListener('click', () => {
      if (chosen) { chosen.destroy(); chosen = null; toggle.textContent = 'Rebuild Chosen'; }
      else { chosen = new ChosenNative.Chosen(select, chosenOptions); toggle.textContent = 'Destroy Chosen'; }
      suiteEvent.textContent = `${example.title}: ${chosen ? 'rebuilt' : 'destroyed'}`;
    });
    actions.append(add, toggle);
    controlWrap.append(actions);
  }
  if (example.groupAction) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Make read-only';
    toggle.addEventListener('click', () => {
      if (select.hasAttribute('readonly')) select.removeAttribute('readonly');
      else select.setAttribute('readonly', '');
      chosen.update();
      toggle.textContent = select.hasAttribute('readonly') ? 'Make editable' : 'Make read-only';
    });
    controlWrap.append(toggle);
  }
  if (example.required) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Check validity';
    button.addEventListener('click', () => {
      select.setAttribute('aria-invalid', String(!select.checkValidity()));
      chosen.update();
      suiteEvent.textContent = `${example.title}: ${select.checkValidity() ? 'valid' : 'selection required'}`;
    });
    controlWrap.append(button);
  }
}
