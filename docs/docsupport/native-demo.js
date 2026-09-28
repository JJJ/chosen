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
