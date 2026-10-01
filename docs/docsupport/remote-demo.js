// A small async provider for the demos. Replace search() with a server request
// that returns a bounded page of { value, label } records in an application.
(function (root) {
  var projects = [
    { value: 'atlas', label: 'Atlas' },
    { value: 'beacon', label: 'Beacon' },
    { value: 'cobalt', label: 'Cobalt' },
    { value: 'comet', label: 'Comet' },
    { value: 'delta', label: 'Delta' },
    { value: 'ember', label: 'Ember' },
    { value: 'fable', label: 'Fable' },
    { value: 'harbor', label: 'Harbor' },
    { value: 'lumen', label: 'Lumen' },
    { value: 'orbit', label: 'Orbit' }
  ];

  function search(query, done) {
    root.setTimeout(function () {
      var term = query.toLowerCase();
      done(null, projects.filter(function (project) {
        return project.label.toLowerCase().indexOf(term) !== -1;
      }).slice(0, 6));
    }, 120);
  }

  function selectedOptions(select) {
    var selected = [];
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].selected) selected.push(select.options[i]);
    }
    return selected;
  }

  // subscribe(handler) receives each Chosen search query. update() asks Chosen
  // to re-read the source select after an async response. Selected options stay
  // in the select even when absent from the latest result page.
  function connect(select, subscribe, update, status, load) {
    var lastQuery;
    var request = 0;
    load = load || search;

    subscribe(function (query) {
      if (query === lastQuery) return; // chosen:updated repeats this query.
      lastQuery = query;
      var current = ++request;
      if (query.length < 2) {
        var retained = selectedOptions(select);
        while (select.firstChild) select.removeChild(select.firstChild);
        retained.forEach(function (option) { select.appendChild(option); });
        update();
        status.textContent = 'Type at least two characters to search.';
        return;
      }

      status.textContent = 'Loading projects…';
      load(query, function (error, results) {
        if (current !== request) return; // Ignore an older response.
        if (error) {
          status.textContent = 'Could not load projects. Try another search.';
          return;
        }
        var selected = selectedOptions(select);
        var seen = Object.create(null);
        selected.forEach(function (option) { seen[option.value] = true; });
        while (select.firstChild) select.removeChild(select.firstChild);
        selected.forEach(function (option) { select.appendChild(option); });
        results.forEach(function (result) {
          if (seen[result.value]) return;
          seen[result.value] = true;
          select.appendChild(new Option(result.label, result.value));
        });
        update();
        status.textContent = results.length + ' projects returned. Selected values stay in the form.';
      });
    });
  }

  root.ChosenRemoteDemo = { search: search, connect: connect };
})(window);
