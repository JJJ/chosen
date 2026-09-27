describe "Basic setup", ->
  it "keeps linked label text selected instead of activating Chosen", ->
    div = new Element('div').update("<label for='drag-label'>Choose a country by name</label><select id='drag-label'><option>One</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    label = div.down('label')
    range = document.createRange()
    range.setStart(label.firstChild, 0)
    range.setEnd(label.firstChild, 6)
    selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    click = new MouseEvent('click', bubbles: true, cancelable: true)
    label.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(true)
    expect(selection.toString()).toBe('Choose')
    expect(chosen.active_field).toBe(false)
    selection.removeAllRanges()
    other = new Element('p').update('Unrelated text')
    div.insert(other)
    range.selectNodeContents(other)
    selection.addRange(range)
    label.dispatchEvent(new MouseEvent('click', bubbles: true, cancelable: true))
    expect(chosen.active_field).toBe(true)
    selection.removeAllRanges()
    div.remove()

  it "preserves explicitly empty placeholder text", ->
    div = new Element('div').update("<select class='single' placeholder='Fallback' data-placeholder=''><option></option><option>One</option></select><select class='multiple' multiple><option>Two</option></select>")
    document.body.appendChild(div)
    single = new Chosen(div.down('select.single'))
    multiple = new Chosen(div.down('select.multiple'), placeholder_text_multiple: "")

    expect(single.default_text).toBe("")
    expect(div.down('.chosen-single > span').textContent).toBe("")
    expect(multiple.default_text).toBe("")
    expect(multiple.search_field.readAttribute('placeholder')).toBe("")
    div.remove()

  it "starts searching when typing on a focused single select", ->
    div = new Element('div').update("<select><option></option><option>Apple</option><option>Banana</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    prevented = false
    chosen.selected_item_keydown(which: 66, key: 'b', preventDefault: -> prevented = true)

    expect(prevented).toBe(true)
    expect(chosen.results_showing).toBe(true)
    expect(chosen.search_field.value).toBe('b')
    expect(div.select('.active-result').pluck('textContent')).toEqual(['Banana'])
    div.remove()

  it "uses explicit CSS width when initialized in a hidden container", ->
    div = new Element('div').update("<select style='width:240px'><option>One</option></select>")
    div.hide()
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    expect(chosen.container.style.width).toBe('240px')
    div.show()
    expect(chosen.container.getWidth()).toBe(240)
    div.remove()

  it "uses search inputs by default and supports text inputs for both select types", ->
    for multiple in [false, true]
      attribute = if multiple then " multiple" else ""
      div = new Element('div').update("<select#{attribute}><option>One</option><option>Two</option></select>")
      default_chosen = new Chosen(div.down('select'))
      expect(default_chosen.search_field.type).toBe("search")

      configured = new Element('div').update("<select#{attribute}><option>One</option><option>Two</option></select>")
      chosen = new Chosen(configured.down('select'), search_input_type: "text")
      expect(chosen.search_field.type).toBe("text")
      expect(chosen.search_field.readAttribute("autocomplete")).toBe("off")
      chosen.results_show()
      chosen.search_field.value = "Two"
      simulant.fire(chosen.search_field, "input")
      expect(configured.select(".active-result").length).toBe(1)
      expect(configured.down(".active-result").textContent).toBe("Two")

  it "applies runtime theme variable overrides", ->
    div = new Element('div').update("<select><option>One</option></select>")
    document.body.insert(div)
    chosen = new Chosen(div.down('select'))
    div.style.setProperty('--chosen-text-color', '#123456')
    div.style.setProperty('--chosen-border-radius', '9px')
    div.style.setProperty('--chosen-control-padding-block', '8px')
    div.style.setProperty('--chosen-control-shadow', '0 0 0 2px #010203')
    div.style.setProperty('--chosen-dropdown-background', '#101112')
    div.style.setProperty('--chosen-focus-ring-width', '3px')
    div.style.setProperty('--chosen-focus-ring-color', '#456789')
    chosen.selected_item.focus()

    expect(getComputedStyle(chosen.selected_item).color).toBe('rgb(18, 52, 86)')
    expect(getComputedStyle(chosen.selected_item).borderRadius).toBe('9px')
    expect(getComputedStyle(chosen.selected_item).paddingTop).toBe('8px')
    expect(getComputedStyle(chosen.selected_item).boxShadow).toContain('rgb(1, 2, 3)')
    expect(getComputedStyle(chosen.dropdown).backgroundColor).toBe('rgb(16, 17, 18)')
    expect(getComputedStyle(chosen.selected_item).outlineWidth).toBe('3px')
    expect(getComputedStyle(chosen.selected_item).outlineColor).toBe('rgb(69, 103, 137)')
    div.remove()

  it "preserves RTL spacing with logical theme properties", ->
    div = new Element('div').update("<select class='chosen-rtl'><option>One</option></select><select class='chosen-rtl' multiple><optgroup label='Group'><option selected>Two</option><option>Three</option></optgroup></select>")
    document.body.insert(div)
    chosen = (new Chosen(select) for select in div.select('select'))
    chosen[1].results_show()

    singleElement = div.down('.chosen-container-single .chosen-single')
    choiceElement = div.down('.chosen-container-multi .search-choice')
    groupOptionElement = div.down('.chosen-container-multi .group-option')
    throw new Error("RTL fixture missing single=#{singleElement?}, choice=#{choiceElement?}, group option=#{groupOptionElement?}") unless singleElement? and choiceElement? and groupOptionElement?
    single = getComputedStyle(singleElement)
    choice = getComputedStyle(choiceElement)
    groupOption = getComputedStyle(groupOptionElement)

    expect(single.direction).toBe('rtl')
    expect([single.paddingTop, single.paddingRight, single.paddingBottom, single.paddingLeft]).toEqual(['2px', '7px', '2px', '0px'])
    expect([choice.paddingTop, choice.paddingRight, choice.paddingBottom, choice.paddingLeft]).toEqual(['3px', '5px', '3px', '20px'])
    expect([groupOption.paddingRight, groupOption.paddingLeft]).toEqual(['15px', '0px'])
    div.remove()

  it "sizes the dropdown independently from the control", ->
    div = new Element('div').update("<select class='fixed'><option>Short</option></select><select class='intrinsic'><option>Short</option><option>An intentionally long option label that should remain on one line</option></select>")
    document.body.insert(div)
    chosen = new Chosen(div.down('select.fixed'), width: '140px', dropdown_width: '320px')

    expect(chosen.container.getWidth()).toBe(140)
    expect(chosen.dropdown.getWidth()).toBe(320)

    intrinsic = new Chosen(div.down('select.intrinsic'), width: '140px', dropdown_width: 'max-content')
    expect(intrinsic.dropdown.getBoundingClientRect().width).toBeGreaterThan(intrinsic.container.getBoundingClientRect().width)
    div.remove()

  it "optionally refreshes the control width after options change", ->
    div = new Element('div').update("<select class='dynamic'><option>Short</option></select><select class='default'><option>Short</option></select><select class='fixed'><option>Short</option></select>")
    document.body.insert(div)
    dynamic = new Chosen(div.down('select.dynamic'), recalculate_width_on_update: true)
    unchanged = new Chosen(div.down('select.default'))
    fixed = new Chosen(div.down('select.fixed'), recalculate_width_on_update: true, width: '120px')
    initial_width = dynamic.container.getWidth()
    unchanged_width = unchanged.container.getWidth()

    for select in div.select('select')
      select.insert(new Element('option').update('A much longer option added after Chosen initialization'))
      select.fire('chosen:updated')

    expect(dynamic.container.getWidth()).toBeGreaterThan(initial_width)
    expect(unchanged.container.getWidth()).toBe(unchanged_width)
    expect(fixed.container.getWidth()).toBe(120)
    expect(dynamic.form_field.style.display).toBe('none')
    dynamic.form_field.down('option:last-child').remove()
    dynamic.form_field.fire('chosen:updated')
    expect(dynamic.container.getWidth()).toBe(initial_width)
    div.remove()

  it "positions an opt-in fixed dropdown outside its clipping ancestor", ->
    div = new Element('div', style: 'height:60px;overflow:hidden').update("<select style='width:200px'><option></option><option>One</option><option>Two</option><option>Three</option></select>")
    document.body.insert(div)
    chosen = new Chosen(div.down('select'), dropdown_position: 'fixed', dropdown_width: '150%')
    chosen.results_show()

    expect(chosen.container.hasClassName('chosen-fixed-dropdown')).toBe(true)
    expect(getComputedStyle(chosen.dropdown).position).toBe('fixed')
    expect(chosen.dropdown.getWidth()).toBeCloseTo(chosen.container.getWidth() * 1.5, 0)
    expect(chosen.dropdown.getBoundingClientRect().bottom).toBeGreaterThan(div.getBoundingClientRect().bottom)
    chosen.results_hide()
    chosen.destroy()
    div.remove()

  it "transfers native autofocus to the generated control", ->
    for multiple in [false, true]
      multiple_attribute = if multiple then " multiple" else ""
      div = new Element('div').update("<select autofocus#{multiple_attribute}><option>One</option><option>Two</option></select>")
      document.body.insert(div)
      select = div.down('select')
      select.focus()
      chosen = new Chosen(select)
      control = div.down(if multiple then '.chosen-search-input' else '.chosen-single')

      expect(document.activeElement).toBe(control)
      expect(chosen.results_showing).toBe(false)
      div.remove()

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

  it "collapses extra selected choices without changing selected values", ->
    div = new Element('div').update("<select multiple style='width:300px'><option selected>One</option><option selected>Two</option><option selected>Three</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select,
      max_items_shown: 1
      more_items_text: (count) -> "#{count} hidden"
      show_fewer_items_text: "Collapse")
    choices = div.select('li.search-choice')
    summary = div.down('.chosen-choice-summary button')

    expect(choices.length).toBe(3)
    expect(choices.filter((choice) -> choice.hidden).length).toBe(2)
    expect(summary.textContent).toBe("2 hidden")
    expect(Math.abs(choices[0].getBoundingClientRect().height - summary.getBoundingClientRect().height)).toBeLessThan(1)
    expect($A(select.selectedOptions).pluck('value')).toEqual(["One", "Two", "Three"])

    summary.click()
    expect(choices.filter((choice) -> choice.hidden).length).toBe(0)
    expect(summary.textContent).toBe("Collapse")

    summary.click()
    expect(choices.filter((choice) -> choice.hidden).length).toBe(2)
    select.options[2].selected = false
    select.fire('chosen:updated')
    expect(div.select('li.search-choice').filter((choice) -> choice.hidden).length).toBe(1)
    expect(div.down('.chosen-choice-summary button').textContent).toBe("1 hidden")
    expect($A(select.selectedOptions).pluck('value')).toEqual(["One", "Two"])
    div.remove()

  it "does not style a selected option as a placeholder when their text matches", ->
    div = new Element('div').update("<select data-placeholder='Same text'><option></option><option selected>Same text</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down('select'))
    expect(div.down('.chosen-single span').innerHTML).toBe('Same text')
    expect(div.down('.chosen-single').hasClassName('chosen-default')).toBe(false)
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

  it "clears an allowed single selection with Backspace or Delete", ->
    for key in [8, 46]
      div = new Element('div').update("<select><option value=''></option><option selected>One</option></select>")
      select = div.down('select')
      chosen = new Chosen(select, allow_single_deselect: true)
      prevented = false
      chosen.selected_item_keydown(keyCode: key, preventDefault: -> prevented = true)

      expect(select.value).toBe("")
      expect(prevented).toBe(true)

  it "refreshes single deselection when the empty option changes", ->
    div = new Element('div').update("<select><option selected>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select, allow_single_deselect: true)
    expect(div.down('.search-choice-close')).toBeUndefined()

    select.insertBefore(new Option('', ''), select.firstChild)
    select.fire('chosen:updated')
    expect(div.down('.search-choice-close')).toBeDefined()

    select.removeChild(select.options[0])
    select.fire('chosen:updated')
    expect(div.down('.search-choice-close')).toBeUndefined()
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

  it "navigates results with Home, End, Page Up, and Page Down", ->
    options = ("<option>Option #{index}</option>" for index in [1..8]).join("")
    div = new Element('div').update("<select>#{options}</select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    chosen.results_show()
    results = chosen.search_results.select("li.active-result")
    result.setStyle(height: "20px", padding: 0) for result in results
    chosen.search_results.setStyle(height: "60px", maxHeight: "60px")

    chosen.keydown_checker(which: 35, preventDefault: ->)
    expect(results.indexOf(chosen.result_highlight)).toBe(7)

    chosen.keydown_checker(which: 36, preventDefault: ->)
    expect(results.indexOf(chosen.result_highlight)).toBe(0)

    chosen.keydown_checker(which: 34, preventDefault: ->)
    expect(results.indexOf(chosen.result_highlight)).toBe(3)

    chosen.keydown_checker(which: 33, preventDefault: ->)
    expect(results.indexOf(chosen.result_highlight)).toBe(0)

    chosen.results_hide()
    chosen.selected_item_keydown(which: 35, preventDefault: ->)
    results = chosen.search_results.select("li.active-result")
    expect(chosen.results_showing).toBe(true)
    expect(results.indexOf(chosen.result_highlight)).toBe(7)

    prevented = false
    chosen.search_field.value = "Option"
    chosen.keydown_checker(which: 36, preventDefault: -> prevented = true)
    expect(prevented).toBe(false)
    div.remove()

  it "uses typeahead navigation when search is disabled", ->
    div = new Element('div').update("<select><option>Alpha</option><option disabled>Banana</option><option>Blue</option><option>North</option><option>New</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'), disable_search: true)
    chosen.results_show()

    prevented = false
    chosen.keydown_checker(which: 66, key: "b", preventDefault: -> prevented = true)
    expect(chosen.result_highlight.innerHTML).toBe("Blue")
    expect(prevented).toBe(true)

    chosen.clear_typeahead()
    chosen.keydown_checker(which: 78, key: "n", preventDefault: ->)
    chosen.keydown_checker(which: 69, key: "e", preventDefault: ->)
    expect(chosen.result_highlight.innerHTML).toBe("New")
    div.remove()

  it "keeps multiple-select search editable when disable_search is set", ->
    div = new Element('div').update("<select multiple><option>Alpha</option><option>Blue</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'), disable_search: true)
    chosen.results_show()
    prevented = false
    chosen.keydown_checker(which: 66, key: "b", preventDefault: -> prevented = true)
    expect(prevented).toBe(false)
    expect(chosen.result_highlight.innerHTML).toBe("Alpha")
    div.remove()

  it "keeps search input text visible under a dark color scheme", ->
    div = new Element('div', style: 'color-scheme:dark').update("<select><option>One</option><option>Two</option></select><select multiple><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    new Chosen(select) for select in div.select('select')
    for input in div.select('.chosen-search-input')
      expect(window.getComputedStyle(input).color).toBe("rgb(68, 68, 68)")
    div.remove()

  it "selects a highlighted multiple result with Tab only when enabled", ->
    build = (options = {}) ->
      div = new Element('div').update("<select multiple><option>Alpha</option><option>Beta</option></select>")
      document.body.appendChild(div)
      select = div.down('select')
      chosen = new Chosen(select, options)
      chosen.results_show()
      chosen.search_field.value = "Beta"
      chosen.search_if_value_changed()
      { div, select, chosen }

    press_tab = (control) ->
      control.chosen.keydown_checker(
        which: 9
        target: control.chosen.search_field
        preventDefault: ->
      )

    default_control = build()
    press_tab(default_control)
    expect(default_control.select.selectedIndex).toBe(-1)
    default_control.div.remove()

    enabled_control = build(multiselect_allow_tab_to_select: true)
    press_tab(enabled_control)
    expect(enabled_control.select.selectedOptions[0].text).toBe("Beta")
    enabled_control.div.remove()

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

  it "refreshes the select title when updated", ->
    div = new Element('div').update("<select title='Initial title'><option>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select)
    expect(div.down('.chosen-container').readAttribute('title')).toBe('Initial title')
    select.writeAttribute('title', 'Updated title')
    select.fire('chosen:updated')
    expect(div.down('.chosen-container').readAttribute('title')).toBe('Updated title')
    select.removeAttribute('title')
    select.fire('chosen:updated')
    expect(div.down('.chosen-container').readAttribute('title')).toBeNull()
    div.remove()

  it "copies option titles to selected multiple choices", ->
    div = new Element('div').update("<select multiple><option title='Choice details' selected>One</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down('select'))
    expect(div.down('.search-choice').readAttribute('title')).toBe('Choice details')
    div.remove()

  it "can display selected values while keeping labels in the results", ->
    div = new Element('div').update("<select><option value='&lt;44&gt;' selected>+44 United Kingdom</option></select><select multiple><option value='ca' selected>Canada</option></select>")
    document.body.appendChild(div)
    selects = div.select('select')
    single = new Chosen(selects[0], display_selected_value: true)
    multiple = new Chosen(selects[1], display_selected_value: true)
    single.results_show()
    multiple.results_show()

    expect(div.down('.chosen-single span').textContent).toBe('<44>')
    expect(div.down('.chosen-single span').innerHTML).toBe('&lt;44&gt;')
    expect(div.down('.search-choice > span').textContent).toBe('ca')
    expect(single.search_results.down('li').textContent).toBe('+44 United Kingdom')
    expect(multiple.search_results.down('li').textContent).toBe('Canada')
    single.destroy()
    multiple.destroy()
    div.remove()

  it "refreshes inherited select classes without removing Chosen state", ->
    div = new Element('div').update("<select class='initial-class'><option>One</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    new Chosen(select, inherit_select_classes: true)
    container = div.down('.chosen-container').addClassName('chosen-container-active')
    expect(container.hasClassName('initial-class')).toBe(true)

    select.removeClassName('initial-class').addClassName('updated-class')
    select.fire('chosen:updated')
    expect(container.hasClassName('initial-class')).toBe(false)
    expect(container.hasClassName('updated-class')).toBe(true)
    expect(container.hasClassName('chosen-container')).toBe(true)
    expect(container.hasClassName('chosen-container-active')).toBe(true)
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

  it "keeps readonly select values enabled for submission", ->
    form = new Element('form').update("<select name='choice' readonly><option value='one' selected>One</option><option value='two'>Two</option></select>")
    document.body.appendChild(form)
    select = form.down('select')
    chosen = new Chosen(select)
    container = form.down('.chosen-container')

    expect(select.disabled).toBe(false)
    expect(new FormData(form).get('choice')).toBe('one')
    expect(container.hasClassName('chosen-disabled')).toBe(true)
    expect(container.hasClassName('chosen-readonly')).toBe(true)
    expect(container.down('.chosen-search-input').disabled).toBe(true)
    chosen.container_mousedown(target: container, type: 'mousedown', which: 1, stop: ->)
    expect(chosen.results_showing).toBe(false)

    select.removeAttribute('readonly')
    select.fire('chosen:updated')
    expect(container.hasClassName('chosen-disabled')).toBe(false)
    expect(container.hasClassName('chosen-readonly')).toBe(false)
    expect(container.down('.chosen-search-input').disabled).toBe(false)
    chosen.container_mousedown(target: container, type: 'mousedown', which: 1, stop: ->)
    expect(chosen.results_showing).toBe(true)
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

  it "selects filtered options and deselects enabled choices with opt-in bulk actions", ->
    div = new Element('div').update("<select multiple><option value='alpha'>Alpha</option><option value='alpine' disabled>Alpine</option><option value='beta' selected>Beta</option><option value='locked' selected disabled>Locked</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    changes = 0
    select.observe "change", -> changes++
    chosen = new Chosen(select, allow_select_all: true, allow_deselect_all: true, select_all_text: "Take these", deselect_all_text: "Clear choices")

    chosen.results_show()
    chosen.search_field.value = "Al"
    chosen.winnow_results()
    expect(div.down(".chosen-select-all").innerHTML).toBe("Take these")
    chosen.search_results_mouseup(target: div.down(".chosen-select-all"), type: 'mouseup', which: 1, preventDefault: ->)
    expect((option.value for option in select.options when option.selected)).toEqual(["alpha", "beta", "locked"])
    expect(changes).toBe(1)

    expect(div.down(".chosen-deselect-all").innerHTML).toBe("Clear choices")
    chosen.search_results_mouseup(target: div.down(".chosen-deselect-all"), type: 'mouseup', which: 1, preventDefault: ->)
    expect((option.value for option in select.options when option.selected)).toEqual(["locked"])
    expect(changes).toBe(2)
    div.remove()

  it "respects the selection limit during bulk selection", ->
    div = new Element('div').update("<select multiple><option>One</option><option>Two</option><option>Three</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    maxselected = jasmine.createSpy("maxselected")
    select.observe "chosen:maxselected", maxselected
    chosen = new Chosen(select, allow_select_all: true, max_selected_options: 2)
    chosen.results_show()
    chosen.keyup_checker(which: 13, preventDefault: ->)

    expect((option for option in select.options when option.selected).length).toBe(2)
    expect(maxselected).toHaveBeenCalled()
    div.remove()

  it "uses bulk shortcuts only when the multiple search is empty", ->
    div = new Element('div').update("<select multiple><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select, allow_select_all: true, allow_deselect_all: true)
    chosen.results_show()

    chosen.search_field.value = "O"
    chosen.winnow_results()
    text_select = jasmine.createSpy("textSelect")
    chosen.keydown_checker(which: 65, ctrlKey: true, altKey: false, shiftKey: false, preventDefault: text_select)
    expect(text_select).not.toHaveBeenCalled()
    expect((option for option in select.options when option.selected).length).toBe(0)

    chosen.search_field.value = ""
    chosen.winnow_results()
    select_all = jasmine.createSpy("selectAll")
    chosen.keydown_checker(which: 65, metaKey: true, altKey: false, shiftKey: false, preventDefault: select_all)
    expect(select_all).toHaveBeenCalled()
    expect((option for option in select.options when option.selected).length).toBe(2)

    deselect_all = jasmine.createSpy("deselectAll")
    chosen.keydown_checker(which: 65, metaKey: true, altKey: false, shiftKey: true, preventDefault: deselect_all)
    expect(deselect_all).toHaveBeenCalled()
    expect((option for option in select.options when option.selected).length).toBe(0)
    expect(div.select(".chosen-bulk-action-last").length).toBe(1)
    div.remove()

  it "does not add bulk actions unless requested", ->
    div = new Element('div').update("<select multiple><option>One</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down('select'))
    expect(div.select("[data-chosen-action]").length).toBe(0)
    div.remove()

  it "keeps Deselect all available when selected results are hidden", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down('select'), allow_deselect_all: true, display_selected_options: false)
    expect(div.select(".chosen-deselect-all").length).toBe(1)
    div.remove()

  it "deselects selected results by pointer or Enter when enabled", ->
    div = new Element('div').update("<select multiple><option value='one' selected>One</option><option value='locked' selected disabled>Locked</option><option value='three'>Three</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    changes = 0
    select.observe "change", -> changes++
    chosen = new Chosen(select, deselect_selected_results: true, max_selected_options: 2, hide_results_on_select: false)

    chosen.results_show()
    expect(chosen.results_showing).toBe(true)
    expect(div.select(".result-selected.active-result.chosen-result-deselectable").length).toBe(1)
    expect(div.select(".result-selected.chosen-result-deselectable").length).toBe(1)
    first_selected = div.down(".result-selected.active-result")
    chosen.search_results_mouseup(target: first_selected, which: 1, ctrlKey: true, preventDefault: ->)
    expect(select.options[0].selected).toBe(false)
    expect(select.options[1].selected).toBe(true)
    expect(div.select(".search-choice").length).toBe(1)
    expect(chosen.results_showing).toBe(true)

    third = div.down(".active-result[data-option-array-index='2']")
    chosen.search_results_mouseup(target: third, which: 1, preventDefault: ->)
    selected = div.down(".result-selected.active-result[data-option-array-index='2']")
    chosen.result_do_highlight(selected)
    chosen.keyup_checker(which: 13, target: chosen.search_field, preventDefault: ->)
    expect(select.options[2].selected).toBe(false)
    expect(div.select(".search-choice").length).toBe(1)
    expect(changes).toBe(3)
    div.remove()

  it "keeps selected results inert unless deselection is enabled", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    chosen = new Chosen(div.down('select'))
    chosen.results_show()
    expect(div.select(".result-selected.active-result").length).toBe(0)
    expect(div.select(".chosen-result-deselectable").length).toBe(0)

  it "keeps focus on the search input when an inert result is pressed", ->
    div = new Element('div').update("<select multiple><option selected>One</option><option disabled>Two</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    chosen.results_show()

    press = (element) ->
      event = document.createEvent('MouseEvents')
      event.initMouseEvent('mousedown', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
      element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)

    press(div.down('.result-selected'))
    press(div.down('.disabled-result'))
    chosen.search_field.value = 'Missing'
    chosen.winnow_results()
    press(div.down('.no-results'))
    expect(document.activeElement).toBe(chosen.search_field)
    div.remove()

  it "opens Deselect all at the selection limit", ->
    div = new Element('div').update("<select multiple><option selected>One</option></select>")
    chosen = new Chosen(div.down('select'), allow_deselect_all: true, max_selected_options: 1)
    chosen.results_show()
    expect(chosen.results_showing).toBe(true)
    chosen.search_results_mouseup(target: div.down(".chosen-deselect-all"), which: 1, preventDefault: ->)
    expect(div.down('option').selected).toBe(false)

  it "highlights pointer results without scrolling while keyboard highlight scrolls", ->
    div = new Element("div").update("<select></select>")
    document.body.appendChild(div)
    select = div.down("select")
    select.insert(new Element("option").update("Option #{index}")) for index in [1..30]
    chosen = new Chosen(select)
    chosen.results_show()
    result = chosen.search_results.select(".active-result").last()
    chosen.search_results.scrollTop = 0

    chosen.search_results_mouseover(target: result)
    expect(chosen.result_highlight).toBe(result)
    expect(chosen.search_results.scrollTop).toBe(0)

    chosen.result_do_highlight(result)
    expect(chosen.search_results.scrollTop).toBeGreaterThan(0)
    div.remove()

  it "uses the single select as the accessible dropdown control", ->
    div = new Element("div")
    div.update("<label for='accessible-single'>Choices</label><select id='accessible-single'><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down("select"))
    control = div.down(".chosen-single")
    expect(control.readAttribute("role")).toBe("combobox")
    expect(control.readAttribute("tabindex")).toBe("0")
    expect(control.down("button")).toBeUndefined()
    expect(control.readAttribute("aria-labelledby")).toBe(div.down("label").id + " ")
    expect(control.readAttribute("aria-controls")).toBe(chosen.search_results.id)
    expect(control.readAttribute("aria-expanded")).toBe("false")
    expect(chosen.dropdown.readAttribute("aria-hidden")).toBe("true")
    chosen.results_show()
    expect(control.readAttribute("aria-expanded")).toBe("true")
    expect(control.readAttribute("aria-hidden")).toBe("true")
    expect(chosen.dropdown.readAttribute("aria-hidden")).toBe("false")
    escape_keydown =
      which: 27
      preventDefault: jasmine.createSpy("preventDefault")
      stopPropagation: jasmine.createSpy("stopPropagation")
    chosen.keydown_checker(escape_keydown)
    expect(escape_keydown.preventDefault).toHaveBeenCalled()
    expect(escape_keydown.stopPropagation).toHaveBeenCalled()
    chosen.keyup_checker(which: 27, preventDefault: ->)
    expect(control.readAttribute("aria-expanded")).toBe("false")
    expect(control.readAttribute("aria-hidden")).toBeNull()
    expect(chosen.dropdown.readAttribute("aria-hidden")).toBe("true")
    expect(document.activeElement).toBe(control)
    closed_escape =
      which: 27
      preventDefault: jasmine.createSpy("closedPreventDefault")
      stopPropagation: jasmine.createSpy("closedStopPropagation")
    chosen.keydown_checker(closed_escape)
    expect(closed_escape.preventDefault).not.toHaveBeenCalled()
    expect(closed_escape.stopPropagation).not.toHaveBeenCalled()
    div.remove()

  it "keeps active descendant and option selection state current", ->
    div = new Element("div").update("<select><option>One</option><option selected>Two</option><option>Three</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down("select"))
    chosen.results_show()
    selected = div.down(".result-selected")

    expect(selected.readAttribute("aria-selected")).toBe("true")
    expect(div.select(".active-result").find((result) -> result isnt selected).readAttribute("aria-selected")).toBe("false")
    expect(chosen.search_field.readAttribute("aria-activedescendant")).toBe(chosen.result_highlight.id)

    chosen.result_clear_highlight()
    expect(chosen.search_field.readAttribute("aria-activedescendant")).toBeNull()
    expect(selected.readAttribute("aria-selected")).toBe("true")

    next_result = div.select(".active-result").last()
    chosen.result_do_highlight(next_result)
    chosen.result_select(target: next_result, preventDefault: ->)
    expect(selected.readAttribute("aria-selected")).toBe("false")
    expect(next_result.readAttribute("aria-selected")).toBe("true")
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
    expect(div.down(".chosen-single").readAttribute("aria-label")).toBe("Choices")
    expect(div.down(".chosen-single").readAttribute("aria-labelledby")).toBe("field-label")
    expect(div.down(".chosen-single").readAttribute("aria-describedby")).toBe("field-help")

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
    expect(div.down('.chosen-single').readAttribute('aria-labelledby')).toBe(div.down('label').id + ' ')
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

    it "should fall back to the select placeholder attribute", ->
      div = new Element("div")
      div.update("
        <select placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
        </select>
      ")
      document.body.appendChild(div)
      new Chosen(div.down("select"))

      expect(div.down(".chosen-single > span").innerText).toBe("Choose a Country...")
      div.remove()

    it "should prefer data-placeholder over the select placeholder attribute", ->
      div = new Element("div")
      div.update("
        <select placeholder='Fallback' data-placeholder='Preferred'>
          <option value=''></option>
          <option value='one'>One</option>
        </select>
      ")
      document.body.appendChild(div)
      new Chosen(div.down("select"))

      expect(div.down(".chosen-single > span").innerText).toBe("Preferred")
      div.remove()

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
