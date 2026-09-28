'use strict';
const project = document.getElementById('native-project');
const skills = document.getElementById('native-skills');
const events = document.getElementById('native-events');
const projectChosen = new ChosenNative.Chosen(project, { allow_single_deselect: true, search_in_values: true });
const skillsChosen = new ChosenNative.Chosen(skills, { max_selected_options: 3,
  multiselect_allow_tab_to_select: true, display_selected_value: true,
  include_group_label_in_selected: true, deselect_selected_results: true,
  hide_results_on_select: false });
let added = 0;

for (const select of [project, skills]) {
  for (const name of ['input', 'change', 'chosen:showing_dropdown', 'chosen:hiding_dropdown', 'chosen:maxselected']) {
    select.addEventListener(name, () => {
      events.textContent = `${select.name}: ${name}\nValues: ${Array.from(select.selectedOptions, option => option.value).join(', ') || '(none)'}`;
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
