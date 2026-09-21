describe "Basic setup", ->
  it "uses the single select as the accessible dropdown control", ->
    div = $("<div>").html("<select><option>One</option><option>Two</option></select>")
    div.find("select").chosen()
    control = div.find(".chosen-single")
    expect(control.attr("role")).toBe("button")
    expect(String(control.attr("tabindex"))).toBe("0")
    expect(control.find("button").length).toBe(0)
    expect(control.attr("aria-expanded")).toBe("false")
    control.trigger($.Event("keydown", which: 13))
    expect(control.attr("aria-expanded")).toBe("true")
    div.find("select").data("chosen").results_hide()
    expect(control.attr("aria-expanded")).toBe("false")

  it "copies accessible names and descriptions to the search input", ->
    div = $("<div>").html("<select aria-label='Choices' aria-labelledby='field-label' aria-describedby='field-help'><option>One</option></select>")
    div.find("select").chosen()
    search = div.find(".chosen-search-input")
    expect(search.attr("aria-label")).toBe("Choices")
    expect(search.attr("aria-labelledby")).toBe("field-label")
    expect(search.attr("aria-describedby")).toBe("field-help")

  it "keeps generated listbox and option IDs unique without select IDs", ->
    div = $("<div>").html("<select><option value=''></option><option>One</option></select><select><option value=''></option><option>Two</option></select>")
    div.find("select").chosen()
    div.find(".chosen-container").each -> $(this).trigger("mousedown")
    lists = div.find(".chosen-results")
    expect(lists.first().attr("id")).not.toBe(lists.last().attr("id"))
    expect(div.find(".chosen-results li").first().attr("id")).not.toBe(div.find(".chosen-results li").last().attr("id"))
    div.find(".chosen-search-input").each ->
      expect($(this).attr("aria-controls")).toBe($(this).closest(".chosen-container").find(".chosen-results").attr("id"))

  it "copies custom ARIA attributes on update without replacing managed state", ->
    div = $("<div>").html("<select aria-required='true' aria-invalid='true' aria-expanded='true'><option>One</option></select>")
    select = div.find("select").chosen()
    search = div.find(".chosen-search-input")
    expect(search.attr("aria-required")).toBe("true")
    expect(search.attr("aria-invalid")).toBe("true")
    expect(search.attr("aria-expanded")).toBe("false")
    select.removeAttr("aria-invalid").attr("aria-errormessage", "field-error").trigger("chosen:updated")
    expect(search.attr("aria-invalid")).toBeUndefined()
    expect(search.attr("aria-errormessage")).toBe("field-error")

  it "uses an associated label when the select has no explicit ARIA name", ->
    div = $("<div>").html("<label for='label-test'>Choices</label><select id='label-test'><option>One</option></select>").appendTo("body")
    div.find("select").chosen()
    expect(div.find(".chosen-search-input").attr("aria-labelledby")).toBe(div.find("label").attr("id") + " ")
    div.remove()

  it "should add chosen to jQuery object", ->
    expect(jQuery.fn.chosen).toBeDefined()

  it "should create very basic chosen", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
        <option value='United Kingdom'>United Kingdom</option>
        <option value='Afghanistan'>Afghanistan</option>
      </select>
    "
    div = $("<div>").html(tmpl)
    select = div.find("select")
    expect(select.length).toBe(1)
    select.chosen()
    # very simple check that the necessary elements have been created
    ["container", "container-single", "single", "default"].forEach (clazz)->
      el = div.find(".chosen-#{clazz}")
      expect(el.length).toBe(1)

    # test a few interactions
    expect(select.val()).toBe ""

    container = div.find(".chosen-container")
    container.trigger("mousedown") # open the drop
    expect(container.hasClass("chosen-container-active")).toBe true
    #select an item
    container.find(".active-result").last().trigger $.Event("mouseup", which: 1)

    expect(select.val()).toBe "Afghanistan"

  describe "data-placeholder", ->

    it "should render", ->
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      select = div.find("select")
      expect(select.length).toBe(1)
      select.chosen()
      placeholder = div.find(".chosen-single > span")
      expect(placeholder.text()).toBe("Choose a Country...")

    it "should render with special characters", ->
      tmpl = "
        <select data-placeholder='&lt;None&gt;'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      select = div.find("select")
      expect(select.length).toBe(1)
      select.chosen()
      placeholder = div.find(".chosen-single > span")
      expect(placeholder.text()).toBe("<None>")

    it "should render with ampersand", ->
      tmpl = "
        <select data-placeholder='Choose from A &amp; B'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      select = div.find("select")
      expect(select.length).toBe(1)
      select.chosen()
      placeholder = div.find(".chosen-single > span")
      expect(placeholder.text()).toBe("Choose from A & B")

    it "should handle ampersand in options", ->
      div = $("<div>").html("
        <select>
          <option value=''></option>
          <option value='1'>Option 1</option>
        </select>
      ")
      select = div.find("select")
      select.chosen({
        placeholder_text_single: 'Choose from A & B'
      })
      placeholder = div.find(".chosen-single > span")
      expect(placeholder.text()).toBe("Choose from A & B")

    it "should handle already-escaped entities in options", ->
      div = $("<div>").html("
        <select>
          <option value=''></option>
          <option value='1'>Option 1</option>
        </select>
      ")
      select = div.find("select")
      select.chosen({
        placeholder_text_single: 'Choose from A &amp; B'
      })
      placeholder = div.find(".chosen-single > span")
      expect(placeholder.text()).toBe("Choose from A & B")

  describe "disabled fieldset", ->

    it "should render as disabled", ->
      tmpl = "
        <fieldset disabled>
          <select data-placeholder='Choose a Country...'>
            <option value=''></option>
            <option value='United States'>United States</option>
            <option value='United Kingdom'>United Kingdom</option>
            <option value='Afghanistan'>Afghanistan</option>
          </select>
        </fieldset>
      "
      div = $("<div>").html(tmpl)
      select = div.find("select")
      expect(select.length).toBe(1)
      select.chosen()

      container = div.find(".chosen-container")
      expect(container.hasClass("chosen-disabled")).toBe true
      expect(container.find(".chosen-single").attr("aria-disabled")).toBe("true")
      expect(String(container.find(".chosen-single").attr("tabindex"))).toBe("-1")

  it "it should not render hidden options", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value='' hidden>Choose a Country</option>
        <option value='United States'>United States</option>
      </select>
    "
    div = $("<div>").html(tmpl)
    select = div.find("select")
    select.chosen()
    container = div.find(".chosen-container")
    container.trigger("mousedown") # open the drop
    expect(container.find(".active-result").length).toBe 1


  it "it should not render hidden optgroups", ->
    tmpl = "
      <select>
        <optgroup label='Not shown' hidden>
          <option value='Item1'>Item1</option>
        </optgroup>
        <optgroup label='Shown'>
          <option value='Item2'>Item2</option>
        </optgroup>
      </select>
    "
    div = $("<div>").html(tmpl)
    select = div.find("select")
    select.chosen()
    container = div.find(".chosen-container")
    container.trigger("mousedown") # open the drop
    expect(container.find(".group-result").length).toBe 1
    expect(container.find(".active-result").length).toBe 1
