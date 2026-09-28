describe "Initialization defaults", ->
  previous_defaults = null

  beforeEach ->
    previous_defaults = $.fn.chosen.defaults
    $.fn.chosen.defaults = {}

  afterEach ->
    $.fn.chosen.defaults = previous_defaults

  it "uses shared defaults only for later instances and lets local options win", ->
    div = $("<div><select class='shared'><option value=''></option><option>One</option></select><select class='local'><option value=''></option><option>Two</option></select><select class='later'><option value=''></option><option>Three</option></select></div>").appendTo("body")
    $.fn.chosen.defaults = {placeholder_text_single: "Shared prompt", disable_search: true}

    div.find(".shared").chosen()
    shared = div.find(".shared").data("chosen")
    expect(shared.default_text).toBe("Shared prompt")
    expect(shared.disable_search).toBe(true)

    div.find(".local").chosen(placeholder_text_single: "Local prompt", disable_search: false)
    local = div.find(".local").data("chosen")
    expect(local.default_text).toBe("Local prompt")
    expect(local.disable_search).toBe(false)

    $.fn.chosen.defaults.placeholder_text_single = "Later prompt"
    div.find(".later").chosen()
    expect(div.find(".later").data("chosen").default_text).toBe("Later prompt")
    expect(shared.options.placeholder_text_single).toBe("Shared prompt")
    div.remove()

  it "keeps the supplied options object when no shared defaults are set", ->
    div = $("<div><select><option>One</option></select></div>").appendTo("body")
    options = {disable_search: true}
    div.find("select").chosen(options)
    expect(div.find("select").data("chosen").options).toBe(options)
    div.remove()
