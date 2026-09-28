describe "Initialization defaults", ->
  previous_defaults = null

  beforeEach ->
    previous_defaults = Chosen.defaults
    Chosen.defaults = {}

  afterEach ->
    Chosen.defaults = previous_defaults

  it "uses shared defaults only for later instances and lets local options win", ->
    div = new Element("div").update("<select class='shared'><option value=''></option><option>One</option></select><select class='local'><option value=''></option><option>Two</option></select><select class='later'><option value=''></option><option>Three</option></select>")
    document.body.appendChild(div)
    Chosen.defaults = {placeholder_text_single: "Shared prompt", disable_search: true}

    shared = new Chosen(div.down("select.shared"))
    expect(shared.default_text).toBe("Shared prompt")
    expect(shared.disable_search).toBe(true)

    local = new Chosen(div.down("select.local"), placeholder_text_single: "Local prompt", disable_search: false)
    expect(local.default_text).toBe("Local prompt")
    expect(local.disable_search).toBe(false)

    Chosen.defaults.placeholder_text_single = "Later prompt"
    later = new Chosen(div.down("select.later"))
    expect(later.default_text).toBe("Later prompt")
    expect(shared.options.placeholder_text_single).toBe("Shared prompt")
    div.remove()

  it "keeps the supplied options object when no shared defaults are set", ->
    div = new Element("div").update("<select><option>One</option></select>")
    document.body.appendChild(div)
    options = {disable_search: true}
    chosen = new Chosen(div.down("select"), options)
    expect(chosen.options).toBe(options)
    div.remove()
