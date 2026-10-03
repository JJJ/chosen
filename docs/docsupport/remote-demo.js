// A small async provider for the demos. The remote controller is in the
// chosen-jjj/remote package entry; replace load() with a server request.
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

  function load(query) {
    return new Promise(function (resolve, reject) {
      root.ChosenRemoteDemo.search(query, function (error, records) {
        if (error) reject(error);
        else resolve(records);
      });
    });
  }

  root.ChosenRemoteDemo = { search: search, load: load };
})(window);
