describe "Basic setup", ->
  it "transfers native autofocus to the generated control", ->
    for multiple in [false, true]
      multiple_attribute = if multiple then " multiple" else ""
      div = $("<div><select autofocus#{multiple_attribute}><option>One</option><option>Two</option></select></div>").appendTo("body")
      select = div.find("select")
      select[0].focus()
      chosen = select.chosen().data("chosen")
      control = div.find(if multiple then ".chosen-search-input" else ".chosen-single")

      expect(document.activeElement).toBe(control[0])
      expect(chosen.results_showing).toBe(false)
      div.remove()

  it "keeps blank options with nonempty values selectable", ->
    div = $("<div>").html("<select><option value=''></option><option value=' '></option></select>")
    select = div.find("select").chosen()
    chosen = select.data("chosen")
    chosen.results_show()
    result = div.find(".active-result")
    expect(result.length).toBe(1)
    result.trigger($.Event("mouseup", which: 1))
    expect(select.val()).toBe(" ")

  it "does not style a selected option as a placeholder when their text matches", ->
    div = $("<div>").html("<select data-placeholder='Same text'><option></option><option selected>Same text</option></select>")
    select = div.find("select").chosen()
    expect(div.find(".chosen-single span").text()).toBe("Same text")
    expect(div.find(".chosen-single").hasClass("chosen-default")).toBe(false)

  it "deletes selected choices with backspace by default", ->
    div = $("<div>").html("<select multiple><option selected>One</option></select>")
    chosen = div.find("select").chosen().data("chosen")
    chosen.keydown_backstroke()
    expect(div.find("option").prop("selected")).toBe(false)
    expect(div.find(".search-choice").length).toBe(0)

  it "keeps selected choices when backspace deletion is disabled", ->
    div = $("<div>").html("<select multiple><option selected>One</option></select>")
    chosen = div.find("select").chosen(backspace_deletes_choices: false).data("chosen")
    chosen.keydown_backstroke()
    chosen.keydown_backstroke()
    expect(div.find("option").prop("selected")).toBe(true)
    expect(div.find(".search-choice").length).toBe(1)

  it "clears an allowed single selection with Backspace or Delete", ->
    for key in [8, 46]
      div = $("<div><select><option value=''></option><option selected>One</option></select></div>")
      select = div.find("select").chosen(allow_single_deselect: true)
      event = $.Event("keydown", which: key)
      div.find(".chosen-single").trigger(event)

      expect(select.val()).toBe("")
      expect(event.isDefaultPrevented()).toBe(true)

  it "refreshes single deselection when the empty option changes", ->
    div = $("<div><select><option selected>One</option></select></div>").appendTo("body")
    select = div.find("select").chosen(allow_single_deselect: true)
    expect(div.find(".search-choice-close").length).toBe(0)

    select.prepend("<option value=''></option>").trigger("chosen:updated")
    expect(div.find(".search-choice-close").length).toBe(1)

    select.find("option").first().remove()
    select.trigger("chosen:updated")
    expect(div.find(".search-choice-close").length).toBe(0)
    div.remove()

  it "exposes the browser support check", ->
    expect($.fn.chosen.browser_is_supported).toBeDefined()
    expect($.fn.chosen.browser_is_supported()).toBe(true)

  it "focuses the search input when results open", ->
    div = $("<div>").html("<select><option>One</option><option>Two</option></select>").appendTo("body")
    chosen = div.find("select").chosen().data("chosen")
    chosen.results_show()
    expect(document.activeElement).toBe(div.find(".chosen-search-input")[0])
    div.remove()

  it "navigates results with Home, End, Page Up, and Page Down", ->
    options = ("<option>Option #{index}</option>" for index in [1..8]).join("")
    div = $("<div><select>#{options}</select></div>").appendTo("body")
    chosen = div.find("select").chosen().data("chosen")
    chosen.results_show()
    results = chosen.search_results.find("li.active-result").css(height: "20px", padding: 0)
    chosen.search_results.css(height: "60px", maxHeight: "60px")

    chosen.search_field.trigger($.Event("keydown", which: 35))
    expect(results.index(chosen.result_highlight)).toBe(7)

    chosen.search_field.trigger($.Event("keydown", which: 36))
    expect(results.index(chosen.result_highlight)).toBe(0)

    chosen.search_field.trigger($.Event("keydown", which: 34))
    expect(results.index(chosen.result_highlight)).toBe(3)

    chosen.search_field.trigger($.Event("keydown", which: 33))
    expect(results.index(chosen.result_highlight)).toBe(0)

    chosen.results_hide()
    chosen.selected_item.trigger($.Event("keydown", which: 35))
    results = chosen.search_results.find("li.active-result")
    expect(chosen.results_showing).toBe(true)
    expect(results.index(chosen.result_highlight)).toBe(7)

    chosen.search_field.val("Option")
    home = $.Event("keydown", which: 36)
    chosen.search_field.trigger(home)
    expect(home.isDefaultPrevented()).toBe(false)
    div.remove()

  it "uses typeahead navigation when search is disabled", ->
    div = $("<div><select><option>Alpha</option><option disabled>Banana</option><option>Blue</option><option>North</option><option>New</option></select></div>").appendTo("body")
    chosen = div.find("select").chosen(disable_search: true).data("chosen")
    chosen.results_show()

    blue = $.Event("keydown", which: 66, key: "b")
    chosen.search_field.trigger(blue)
    expect(chosen.result_highlight.text()).toBe("Blue")
    expect(blue.isDefaultPrevented()).toBe(true)

    chosen.clear_typeahead()
    chosen.search_field.trigger($.Event("keydown", which: 78, key: "n"))
    chosen.search_field.trigger($.Event("keydown", which: 69, key: "e"))
    expect(chosen.result_highlight.text()).toBe("New")
    div.remove()

  it "keeps multiple-select search editable when disable_search is set", ->
    div = $("<div><select multiple><option>Alpha</option><option>Blue</option></select></div>").appendTo("body")
    chosen = div.find("select").chosen(disable_search: true).data("chosen")
    chosen.results_show()
    printable = $.Event("keydown", which: 66, key: "b")
    chosen.search_field.trigger(printable)
    expect(printable.isDefaultPrevented()).toBe(false)
    expect(chosen.result_highlight.text()).toBe("Alpha")
    div.remove()

  it "selects a highlighted multiple result with Tab only when enabled", ->
    build = (options = {}) ->
      div = $("<div><select multiple><option>Alpha</option><option>Beta</option></select></div>").appendTo("body")
      select = div.find("select").chosen(options)
      chosen = select.data("chosen")
      chosen.results_show()
      chosen.search_field.val("Beta").trigger("input")
      { div, select, chosen }

    default_control = build()
    default_control.chosen.search_field.trigger($.Event("keydown", which: 9))
    expect(default_control.select.find("option:selected").length).toBe(0)
    default_control.div.remove()

    enabled_control = build(multiselect_allow_tab_to_select: true)
    enabled_control.chosen.search_field.trigger($.Event("keydown", which: 9))
    expect(enabled_control.select.val()).toEqual(["Beta"])
    enabled_control.div.remove()

  it "refreshes restored form values when browser history shows the page", ->
    div = $("<div>").html("<select><option>One</option><option>Two</option></select>").appendTo("body")
    select = div.find("select").chosen()
    select[0].selectedIndex = 1
    window.dispatchEvent(new Event("pageshow"))
    expect(div.find(".chosen-single span").text()).toBe("Two")
    div.remove()

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

  it "refreshes the select title when updated", ->
    div = $("<div>").html("<select title='Initial title'><option>One</option></select>").appendTo("body")
    select = div.find("select").chosen()
    expect(div.find(".chosen-container").attr("title")).toBe("Initial title")
    select.attr("title", "Updated title").trigger("chosen:updated")
    expect(div.find(".chosen-container").attr("title")).toBe("Updated title")
    select.removeAttr("title").trigger("chosen:updated")
    expect(div.find(".chosen-container").attr("title")).toBeUndefined()
    div.remove()

  it "refreshes inherited select classes without removing Chosen state", ->
    div = $("<div>").html("<select class='initial-class'><option>One</option></select>").appendTo("body")
    select = div.find("select").chosen(inherit_select_classes: true)
    container = div.find(".chosen-container").addClass("chosen-container-active")
    expect(container.hasClass("initial-class")).toBe(true)

    select.removeClass("initial-class").addClass("updated-class").trigger("chosen:updated")
    expect(container.hasClass("initial-class")).toBe(false)
    expect(container.hasClass("updated-class")).toBe(true)
    expect(container.hasClass("chosen-container")).toBe(true)
    expect(container.hasClass("chosen-container-active")).toBe(true)
    div.remove()

  it "removes a selected choice when its inner label is clicked", ->
    div = $("<div>").html("<select multiple><option selected>One</option></select>").appendTo("body")
    select = div.find("select").chosen()
    div.find(".search-choice-close span").trigger("click")
    expect(select.find("option").prop("selected")).toBe(false)
    expect(div.find(".search-choice").length).toBe(0)
    div.remove()

  it "restores inline styles and removes its select listeners on destroy", ->
    div = $("<div>").html("<select tabindex='0' style='display:inline-block;position:relative;opacity:0.8'><option>One</option></select>").appendTo("body")
    select = div.find("select").chosen()
    chosen = select.data("chosen")
    spyOn(chosen, "results_update_field").and.callThrough()
    select.chosen("destroy")
    select.trigger("chosen:updated")
    window.dispatchEvent(new Event("pageshow"))
    expect(chosen.results_update_field).not.toHaveBeenCalled()
    expect(select[0].style.display).toBe("inline-block")
    expect(select[0].style.position).toBe("relative")
    expect(select[0].style.opacity).toBe("0.8")
    expect(select[0].getAttribute("tabindex")).toBe("0")
    div.remove()

  it "keeps required selects focusable for native validation", ->
    form = $("<form><select required><option value=''></option><option value='one'>One</option></select></form>").appendTo("body")
    select = form.find("select").chosen()

    expect(select[0].checkValidity()).toBe(false)
    expect(select[0].style.display).not.toBe("none")
    expect(select[0].style.position).toBe("absolute")
    expect(select[0].style.opacity).toBe("0")
    expect(select[0].tabIndex).toBe(-1)
    expect(form[0].reportValidity()).toBe(false)
    expect(document.activeElement).toBe(select[0])

    select.chosen("destroy")
    expect(select[0].hasAttribute("tabindex")).toBe(false)
    form.remove()

  it "keeps readonly select values enabled for submission", ->
    form = $("<form><select name='choice' readonly><option value='one' selected>One</option><option value='two'>Two</option></select></form>").appendTo("body")
    select = form.find("select").chosen()
    chosen = select.data("chosen")
    container = form.find(".chosen-container")

    expect(select[0].disabled).toBe(false)
    expect(new FormData(form[0]).get("choice")).toBe("one")
    expect(container.hasClass("chosen-disabled")).toBe(true)
    expect(container.hasClass("chosen-readonly")).toBe(true)
    expect(container.find(".chosen-search-input").prop("disabled")).toBe(true)
    container.trigger("mousedown")
    expect(chosen.results_showing).toBe(false)

    select.removeAttr("readonly").trigger("chosen:updated")
    expect(container.hasClass("chosen-disabled")).toBe(false)
    expect(container.hasClass("chosen-readonly")).toBe(false)
    expect(container.find(".chosen-search-input").prop("disabled")).toBe(false)
    container.trigger("mousedown")
    expect(chosen.results_showing).toBe(true)
    form.remove()

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
    div = $("<div>").html("<label for='accessible-single'>Choices</label><select id='accessible-single'><option>One</option><option>Two</option></select>").appendTo("body")
    div.find("select").chosen()
    control = div.find(".chosen-single")
    chosen = div.find("select").data("chosen")
    expect(control.attr("role")).toBe("combobox")
    expect(String(control.attr("tabindex"))).toBe("0")
    expect(control.find("button").length).toBe(0)
    expect(control.attr("aria-labelledby")).toBe(div.find("label").attr("id") + " ")
    expect(control.attr("aria-controls")).toBe(chosen.search_results.attr("id"))
    expect(control.attr("aria-expanded")).toBe("false")
    expect(chosen.dropdown.attr("aria-hidden")).toBe("true")
    control.trigger($.Event("keydown", which: 13))
    expect(control.attr("aria-expanded")).toBe("true")
    expect(control.attr("aria-hidden")).toBe("true")
    expect(chosen.dropdown.attr("aria-hidden")).toBe("false")
    chosen.search_field.trigger($.Event("keyup", which: 27))
    expect(control.attr("aria-expanded")).toBe("false")
    expect(control.attr("aria-hidden")).toBeUndefined()
    expect(chosen.dropdown.attr("aria-hidden")).toBe("true")
    expect(document.activeElement).toBe(control[0])
    div.remove()

  it "keeps active descendant and option selection state current", ->
    div = $("<div>").html("<select><option>One</option><option selected>Two</option><option>Three</option></select>")
    chosen = div.find("select").chosen().data("chosen")
    chosen.results_show()
    selected = div.find(".result-selected")

    expect(selected.attr("aria-selected")).toBe("true")
    expect(div.find(".active-result").not(selected).first().attr("aria-selected")).toBe("false")
    expect(chosen.search_field.attr("aria-activedescendant")).toBe(chosen.result_highlight.attr("id"))

    chosen.result_clear_highlight()
    expect(chosen.search_field.attr("aria-activedescendant")).toBeUndefined()
    expect(selected.attr("aria-selected")).toBe("true")

    next_result = div.find(".active-result").last()
    chosen.result_do_highlight(next_result)
    chosen.result_select(target: next_result[0], preventDefault: ->)
    expect(selected.attr("aria-selected")).toBe("false")
    expect(next_result.attr("aria-selected")).toBe("true")

  it "copies accessible names and descriptions to the search input", ->
    div = $("<div>").html("<select aria-label='Choices' aria-labelledby='field-label' aria-describedby='field-help'><option>One</option></select>")
    div.find("select").chosen()
    search = div.find(".chosen-search-input")
    expect(search.attr("aria-label")).toBe("Choices")
    expect(search.attr("aria-labelledby")).toBe("field-label")
    expect(search.attr("aria-describedby")).toBe("field-help")
    expect(div.find(".chosen-single").attr("aria-label")).toBe("Choices")
    expect(div.find(".chosen-single").attr("aria-labelledby")).toBe("field-label")
    expect(div.find(".chosen-single").attr("aria-describedby")).toBe("field-help")

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
    expect(div.find(".chosen-single").attr("aria-labelledby")).toBe(div.find("label").attr("id") + " ")
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

    it "should fall back to the select placeholder attribute", ->
      div = $("<div>").html("
        <select placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
        </select>
      ")
      div.find("select").chosen()

      expect(div.find(".chosen-single > span").text()).toBe("Choose a Country...")

    it "should prefer data-placeholder over the select placeholder attribute", ->
      div = $("<div>").html("
        <select placeholder='Fallback' data-placeholder='Preferred'>
          <option value=''></option>
          <option value='one'>One</option>
        </select>
      ")
      div.find("select").chosen()

      expect(div.find(".chosen-single > span").text()).toBe("Preferred")

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
