describe "Basic setup", ->
  it "refreshes stale results when an option is removed before selection", ->
    div = $("<div>").html("<select><option value=''></option><option>One</option><option>Two</option></select>").appendTo("body")
    select = div.find("select").chosen()
    chosen = select.data("chosen")
    chosen.results_show()
    select.find("option").last().remove()
    div.find(".active-result").last().trigger($.Event("mouseup", which: 1))
    expect(select.val()).toBe("")
    expect(div.find(".active-result").text()).toBe("One")
    div.remove()

  it "does not select a different option after source indices shift", ->
    div = $("<div>").html("<select multiple><option>One</option><option>Two</option><option>Three</option></select>").appendTo("body")
    select = div.find("select").chosen()
    chosen = select.data("chosen")
    chosen.results_show()
    stale_result = div.find(".active-result").eq(1)
    select.find("option").first().remove()
    stale_result.trigger($.Event("mouseup", which: 1))
    expect(select.find("option").eq(1).prop("selected")).toBe(false)
    expect(chosen.results_data[0].text).toBe("Two")
    div.remove()

  it "refreshes stale choices when their source option is removed", ->
    div = $("<div>").html("<select multiple><option selected>One</option></select>").appendTo("body")
    select = div.find("select").chosen()
    select.find("option").remove()
    div.find(".search-choice-close").trigger("click")
    expect(div.find(".search-choice").length).toBe(0)
    div.remove()

  it "does not open an empty results drop after every visible option is selected", ->
    div = $("<div>").html("<select multiple><option selected>One</option></select>").appendTo("body")
    select = div.find("select").chosen(display_selected_options: false)
    chosen = select.data("chosen")
    chosen.results_show()
    expect(chosen.results_showing).toBe(true)
    expect(div.find(".chosen-container").hasClass("chosen-empty-results")).toBe(true)
    expect(window.getComputedStyle(div.find(".chosen-drop")[0]).display).toBe("none")
    select.append("<option>Two</option>").trigger("chosen:updated")
    expect(div.find(".chosen-container").hasClass("chosen-empty-results")).toBe(false)
    expect(window.getComputedStyle(div.find(".chosen-drop")[0]).display).toBe("block")
    div.remove()

  it "removes a selected choice when its inner label is clicked", ->
    div = $("<div>").html("<select multiple><option selected>One</option></select>").appendTo("body")
    select = div.find("select").chosen()
    div.find(".search-choice-close span").trigger("click")
    expect(select.find("option").prop("selected")).toBe(false)
    expect(div.find(".search-choice").length).toBe(0)
    div.remove()

  it "restores inline styles and removes its select listeners on destroy", ->
    div = $("<div>").html("<select style='display:inline-block;position:relative;opacity:0.8'><option>One</option></select>").appendTo("body")
    select = div.find("select").chosen()
    chosen = select.data("chosen")
    spyOn(chosen, "results_update_field").and.callThrough()
    select.chosen("destroy")
    select.trigger("chosen:updated")
    expect(chosen.results_update_field).not.toHaveBeenCalled()
    expect(select[0].style.display).toBe("inline-block")
    expect(select[0].style.position).toBe("relative")
    expect(select[0].style.opacity).toBe("0.8")
    div.remove()

  it "inherits multiple option classes on selected choices", ->
    div = $("<div>").html("<select multiple><option class='first second' selected>One</option></select>")
    div.find("select").chosen(inherit_option_classes: true)
    expect(div.find(".search-choice").hasClass("first")).toBe(true)
    expect(div.find(".search-choice").hasClass("second")).toBe(true)

  it "appends literal option values and labels", ->
    div = $("<div>").html("<select multiple><option>One</option></select>")
    select = div.find("select").chosen()
    value = 'a" onclick="alert(1)'
    label = '<img src=x onerror=alert(1)>'
    select.data("chosen").select_append_option(value: value, text: label)
    expect(select.find("option").length).toBe(2)
    expect(select.find("option").last().val()).toBe(value)
    expect(select.find("option").last().text()).toBe(label)
    expect(select.find("img").length).toBe(0)

  it "selects only available optgroup options without inspecting another container", ->
    other = $("<div id='pops_chosen'><ul class='chosen-choices'><li><button class='search-choice-close' data-option-array-index='1'></button></li></ul></div>").appendTo("body")
    div = $("<div>").html("<select multiple select-by-group><optgroup label='Group'><option>One</option><option>Two</option><option disabled>Three</option></optgroup><option>Outside</option></select>").appendTo("body")
    div.find("select").chosen(hide_results_on_select: false)
    div.find(".chosen-container").trigger("mousedown")
    group = div.find(".group-result")
    group.trigger($.Event("mouseup", which: 1))
    group.trigger($.Event("mouseup", which: 1))
    expect(div.find(".search-choice").length).toBe(2)
    expect(div.find("option").last().prop("selected")).toBe(false)
    expect(div.find("option").eq(2).prop("selected")).toBe(false)
    div.remove()
    other.remove()

  it "keeps the result highlight when the pointer leaves an unrelated element", ->
    div = $("<div>").html("<select><option>One</option></select>")
    chosen = div.find("select").chosen().data("chosen")
    spyOn(chosen, "result_clear_highlight")
    chosen.search_results_mouseout(target: $("<span>")[0])
    expect(chosen.result_clear_highlight).not.toHaveBeenCalled()

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

    it "should use the placeholder attribute for multiple selects", ->
      div = $("<div>").html("
        <select data-placeholder='Choose a Country...' multiple>
          <option value='United States'>United States</option>
        </select>
      ")
      div.find("select").chosen()
      search = div.find(".chosen-search-input")

      expect(search.attr("placeholder")).toBe("Choose a Country...")
      expect(search[0].hasAttribute("value")).toBe(false)
      expect(search.val()).toBe("")

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
