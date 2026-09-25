describe "Basic setup", ->
  it "keeps blank options with nonempty values selectable", ->
    div = new Element('div').update("<select><option value=''></option><option value=' '></option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)
    chosen.results_show()
    results = div.select('.active-result')
    expect(results.length).toBe(1)
    chosen.search_results_mouseup(target: results[0], which: 1, preventDefault: ->)
    expect(select.value).toBe(' ')
    div.remove()

  it "deletes selected choices with backspace by default", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)
    chosen.keydown_backstroke()
    expect(select.options[0].selected).toBe(false)
    expect(div.select('.search-choice').length).toBe(0)
    div.remove()

  it "keeps selected choices when backspace deletion is disabled", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select, backspace_deletes_choices: false)
    chosen.keydown_backstroke()
    chosen.keydown_backstroke()
    expect(select.options[0].selected).toBe(true)
    expect(div.select('.search-choice').length).toBe(1)
    div.remove()

  it "exposes the browser support check", ->
    expect(Chosen.browser_is_supported).toBeDefined()
    expect(Chosen.browser_is_supported()).toBe(true)

  it "focuses the search input when results open", ->
    div = new Element('div').update("<select><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    chosen.results_show()
    expect(document.activeElement).toBe(div.down('.chosen-search-input'))
    div.remove()

  it "refreshes restored form values when browser history shows the page", ->
    div = new Element('div').update("<select><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select)
    select.selectedIndex = 1
    event = document.createEvent('Event')
    event.initEvent('pageshow', true, true)
    window.dispatchEvent(event)
    expect(div.down('.chosen-single span').textContent).toBe('Two')
    div.remove()

  it "refreshes stale results when an option is removed before selection", ->
    div = new Element('div').update("<select><option value=''></option><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)
    chosen.results_show()
    select.removeChild(select.options[2])
    chosen.search_results_mouseup(target: div.select('.active-result').last(), which: 1, preventDefault: ->)
    expect(select.value).toBe("")
    expect(div.select('.active-result').pluck('textContent').join('')).toBe('One')
    div.remove()

  it "does not select a different option after source indices shift", ->
    div = new Element('div').update("<select multiple><option>One</option><option>Two</option><option>Three</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)
    chosen.results_show()
    stale_result = div.select('.active-result')[1]
    select.removeChild(select.options[0])
    chosen.search_results_mouseup(target: stale_result, which: 1, preventDefault: ->)
    expect(select.options[1].selected).toBe(false)
    expect(chosen.results_data[0].text).toBe('Two')
    div.remove()

  it "refreshes stale choices when their source option is removed", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select)
    select.removeChild(select.options[0])
    div.down('.search-choice-close').click()
    expect(div.down('.search-choice')).toBeUndefined()
    div.remove()

  it "does not open an empty results drop after every visible option is selected", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select, display_selected_options: false)
    chosen.results_show()
    expect(chosen.results_showing).toBe(true)
    expect(div.down('.chosen-container').hasClassName('chosen-empty-results')).toBe(true)
    expect(window.getComputedStyle(div.down('.chosen-drop')).display).toBe('none')
    select.add(new Option('Two', 'Two'))
    select.fire('chosen:updated')
    expect(div.down('.chosen-container').hasClassName('chosen-empty-results')).toBe(false)
    expect(window.getComputedStyle(div.down('.chosen-drop')).display).toBe('block')
    div.remove()

  it "removes a selected choice when its inner label is clicked", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select)
    div.down('.search-choice-close span').click()
    expect(select.options[0].selected).toBe(false)
    expect(div.down('.search-choice')).toBeUndefined()
    div.remove()

  it "restores inline styles and preserves other select listeners on destroy", ->
    div = new Element('div').update("<select tabindex='0' style='display:inline-block;position:relative;opacity:0.8'><option>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    updates = 0
    select.observe 'chosen:updated', -> updates += 1
    chosen = new Chosen(select)
    spyOn(chosen, 'results_update_field').and.callThrough()
    chosen.destroy()
    select.fire('chosen:updated')
    event = document.createEvent('Event')
    event.initEvent('pageshow', true, true)
    window.dispatchEvent(event)
    expect(updates).toBe(1)
    expect(chosen.results_update_field).not.toHaveBeenCalled()
    expect(select.style.display).toBe('inline-block')
    expect(select.style.position).toBe('relative')
    expect(select.style.opacity).toBe('0.8')
    expect(select.readAttribute('tabindex')).toBe('0')
    div.remove()

  it "keeps required selects focusable for native validation", ->
    form = new Element('form').update("<select required><option value=''></option><option value='one'>One</option></select>")
    document.body.appendChild(form)
    select = form.down('select')
    chosen = new Chosen(select)

    expect(select.checkValidity()).toBe(false)
    expect(select.style.display).not.toBe('none')
    expect(select.style.position).toBe('absolute')
    expect(select.style.opacity).toBe('0')
    expect(select.tabIndex).toBe(-1)
    expect(form.reportValidity()).toBe(false)
    expect(document.activeElement).toBe(select)

    chosen.destroy()
    expect(select.readAttribute('tabindex')).toBeNull()
    form.remove()

  it "inherits multiple option classes on selected choices", ->
    div = new Element('div').update("<select multiple><option class='first second' selected>One</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down('select'), inherit_option_classes: true)
    expect(div.down('.search-choice').hasClassName('first')).toBe(true)
    expect(div.down('.search-choice').hasClassName('second')).toBe(true)
    div.remove()

  it "appends literal option values and labels", ->
    div = new Element('div').update("<select multiple><option>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)
    value = 'a" onclick="alert(1)'
    label = '<img src=x onerror=alert(1)>'
    chosen.select_append_option(value: value, text: label)
    expect(select.options.length).toBe(2)
    expect(select.options[1].value).toBe(value)
    expect(select.options[1].text).toBe(label)
    expect(div.down('img')).toBeUndefined()
    div.remove()

  it "selects only available options in the clicked group", ->
    div = new Element('div').update("<select multiple select-by-group><optgroup label='First'><option selected>One</option><option>Two</option><option disabled>Three</option></optgroup><option>Outside</option><optgroup label='Second'><option>Four</option></optgroup></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select, hide_results_on_select: false)
    chosen.results_show()
    group = div.down('.group-result')
    chosen.search_results_mouseup(target: group, which: 1, preventDefault: ->)
    chosen.search_results_mouseup(target: group, which: 1, preventDefault: ->)
    expect(div.select('.search-choice').length).toBe(2)
    expect(select.options[0].selected).toBe(true)
    expect(select.options[1].selected).toBe(true)
    expect(select.options[2].selected).toBe(false)
    expect(select.options[3].selected).toBe(false)
    expect(select.options[4].selected).toBe(false)
    div.remove()

  it "does not select a group without the select-by-group attribute", ->
    div = new Element('div').update("<select multiple><optgroup label='Group'><option>One</option></optgroup></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)
    chosen.results_show()
    chosen.search_results_mouseup(target: div.down('.group-result'), which: 1, preventDefault: ->)
    expect(select.options[0].selected).toBe(false)
    div.remove()

  it "uses the single select as the accessible dropdown control", ->
    div = new Element("div")
    div.update("<select><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down("select"))
    control = div.down(".chosen-single")
    expect(control.readAttribute("role")).toBe("button")
    expect(control.readAttribute("tabindex")).toBe("0")
    expect(control.down("button")).toBeUndefined()
    expect(control.readAttribute("aria-expanded")).toBe("false")
    chosen.results_show()
    expect(control.readAttribute("aria-expanded")).toBe("true")
    chosen.results_hide()
    expect(control.readAttribute("aria-expanded")).toBe("false")
    div.remove()

  it "copies accessible names and descriptions to the search input", ->
    div = new Element("div")
    div.update("<select aria-label='Choices' aria-labelledby='field-label' aria-describedby='field-help'><option>One</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down("select"))
    search = div.down(".chosen-search-input")
    expect(search.readAttribute("aria-label")).toBe("Choices")
    expect(search.readAttribute("aria-labelledby")).toBe("field-label")
    expect(search.readAttribute("aria-describedby")).toBe("field-help")

  it "keeps generated listbox and option IDs unique without select IDs", ->
    div = new Element('div').update("<select><option value=''></option><option>One</option></select><select><option value=''></option><option>Two</option></select>")
    document.body.appendChild(div)
    selects = div.select('select')
    first = new Chosen(selects[0])
    second = new Chosen(selects[1])
    first.results_show()
    second.results_show()
    lists = div.select('.chosen-results')
    expect(lists[0].id).not.toBe(lists[1].id)
    options = div.select('.chosen-results li')
    expect(options[0].id).not.toBe(options[options.length - 1].id)
    for search in div.select('.chosen-search-input')
      expect(search.readAttribute('aria-controls')).toBe(search.up('.chosen-container').down('.chosen-results').id)
    div.remove()

  it "copies custom ARIA attributes on update without replacing managed state", ->
    div = new Element('div').update("<select aria-required='true' aria-invalid='true' aria-expanded='true'><option>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select)
    search = div.down('.chosen-search-input')
    expect(search.readAttribute('aria-required')).toBe('true')
    expect(search.readAttribute('aria-invalid')).toBe('true')
    expect(search.readAttribute('aria-expanded')).toBe('false')
    select.removeAttribute('aria-invalid')
    select.writeAttribute('aria-errormessage', 'field-error')
    select.fire('chosen:updated')
    expect(search.readAttribute('aria-invalid')).toBeNull()
    expect(search.readAttribute('aria-errormessage')).toBe('field-error')
    div.remove()

  it "uses an associated label when the select has no explicit ARIA name", ->
    div = new Element('div').update("<label for='label-test'>Choices</label><select id='label-test'><option>One</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down('select'))
    expect(div.down('.chosen-search-input').readAttribute('aria-labelledby')).toBe(div.down('label').id + ' ')
    div.remove()

  it "should add expose a Chosen global", ->
    expect(Chosen).toBeDefined()

  it "should create very basic chosen", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
        <option value='United Kingdom'>United Kingdom</option>
        <option value='Afghanistan'>Afghanistan</option>
      </select>
    "

    div = new Element("div")
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down("select")
    expect(select).toBeDefined()
    chosen = new Chosen(select)
    # very simple check that the necessary elements have been created
    ["container", "container-single", "single", "default"].forEach (clazz)->
      el = div.down(".chosen-#{clazz}")
      expect(el).toBeDefined()

    # test a few interactions
    expect($F(select)).toBe ""

    container = div.down(".chosen-container")
    # Create a mock event for the mousedown handler
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    # Directly call the mousedown handler since event simulation doesn't work with Prototype.observe
    chosen.container_mousedown(mockEvt)
    expect(container.hasClassName("chosen-container-active")).toBe true

    # select an item by calling the chosen handler directly
    result = container.select(".active-result").last()
    # Create a mock event object with the necessary properties
    mockUpEvt = { target: result, which: 1, preventDefault: -> }
    chosen.search_results_mouseup(mockUpEvt)

    expect($F(select)).toBe "Afghanistan"
    div.remove()

  describe "data-placeholder", ->

    it "should use the placeholder attribute for multiple selects", ->
      div = new Element("div")
      div.update("
        <select data-placeholder='Choose a Country...' multiple>
          <option value='United States'>United States</option>
        </select>
      ")
      document.body.appendChild(div)
      new Chosen(div.down("select"))
      search = div.down(".chosen-search-input")

      expect(search.readAttribute("placeholder")).toBe("Choose a Country...")
      expect(search.hasAttribute("value")).toBe(false)
      expect(search.value).toBe("")
      div.remove()

    it "should render", ->
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose a Country...")
      div.remove()

    it "should render with special characters", ->
      tmpl = "
        <select data-placeholder='&lt;None&gt;'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("<None>")
      div.remove()

    it "should render with ampersand", ->
      tmpl = "
        <select data-placeholder='Choose from A &amp; B'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose from A & B")
      div.remove()

    it "should handle ampersand in options", ->
      tmpl = "
        <select>
          <option value=''></option>
          <option value='1'>Option 1</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select, {
        placeholder_text_single: 'Choose from A & B'
      })

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose from A & B")
      div.remove()

    it "should handle already-escaped entities in options", ->
      tmpl = "
        <select>
          <option value=''></option>
          <option value='1'>Option 1</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select, {
        placeholder_text_single: 'Choose from A &amp; B'
      })

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose from A & B")
      div.remove()

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
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      container = div.down(".chosen-container")
      expect(container.hasClassName("chosen-disabled")).toBe true
      expect(container.down(".chosen-single").readAttribute("aria-disabled")).toBe("true")
      expect(container.down(".chosen-single").readAttribute("tabindex")).toBe("-1")
      div.remove()

  it "it should not render hidden options", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value='' hidden>Choose a Country</option>
        <option value='United States'>United States</option>
      </select>
    "
    div = new Element("div")
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down("select")
    expect(select).toBeDefined()
    new Chosen(select)
    container = div.down(".chosen-container")
    simulant.fire(container, "mousedown") # open the drop
    expect(container.select(".active-result").length).toBe 1
    div.remove()

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
    div = new Element("div")
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down("select")
    expect(select).toBeDefined()
    new Chosen(select)
    container = div.down(".chosen-container")
    simulant.fire(container, "mousedown") # open the drop
    expect(container.select(".group-result").length).toBe 1
    expect(container.select(".active-result").length).toBe 1
    div.remove()
